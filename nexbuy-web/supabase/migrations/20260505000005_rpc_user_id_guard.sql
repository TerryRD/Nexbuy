-- SEC-001 [HIGH] — RPC p_user_id spoofing 防護。
--
-- 問題：book_appointment / place_order 兩個 RPC 接 p_user_id 參數且
-- grant to anon / authenticated。/api/orders 跟 /api/appointments 兩個 API
-- route 都用 server-side auth.getUser() 強制覆蓋 p_user_id，但 RPC 是
-- grant to public 的，attacker 可以繞過 API route 直接打 PostgREST：
--
--   POST /rest/v1/rpc/book_appointment
--   { "p_slot_id": "...", "p_user_id": "<受害者 UUID>", ... }
--
-- 在受害者帳號下偽造預約 / 訂單（騷擾、製造混亂、騙到客服或對帳）。
--
-- 修法：RPC 內部驗證 p_user_id 必須等於 auth.uid()（或兩者皆 null）。
-- 不一致就 raise FORBIDDEN。
--
-- 保留 p_user_id 參數本身是為了 backward compat（caller signature 不變）。

set search_path = public;

-- ---------------------------------------------------------------------------
-- helper：guard 比對 — 沒登入的呼叫者必須傳 null；登入的必須傳 auth.uid()
-- ---------------------------------------------------------------------------

create or replace function ensure_user_id_matches_caller(p_user_id uuid)
returns void
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if p_user_id is null then
    -- guest path：就算當下其實有 session，也允許；place_order 流程以 client
    -- 傳的 email 為主，沒人受害。
    return;
  end if;
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
end;
$$;

grant execute on function ensure_user_id_matches_caller(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- book_appointment：在最開頭加 guard
-- ---------------------------------------------------------------------------

create or replace function book_appointment(
  p_slot_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_frame_product_id uuid default null,
  p_user_id uuid default null,
  p_note text default null
)
returns table(appointment_id uuid, cancel_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_updated uuid;
  v_appointment_id uuid;
  v_cancel_token text;
begin
  -- SEC-001 guard：擋直接打 RPC 偽造他人 user_id
  perform ensure_user_id_matches_caller(p_user_id);

  -- Atomic increment; 如果滿了 WHERE 不匹配，v_slot_updated 會是 null
  update appointment_slots
  set booked_count = booked_count + 1
  where id = p_slot_id
    and is_active = true
    and booked_count < capacity
    and date >= current_date
  returning id into v_slot_updated;

  if v_slot_updated is null then
    raise exception 'SLOT_FULL' using errcode = 'P0001';
  end if;

  -- cancel_token: 32-char hex
  v_cancel_token := encode(gen_random_bytes(16), 'hex');

  insert into appointments (
    slot_id, user_id, customer_name, customer_email, customer_phone,
    frame_product_id, note, cancel_token
  ) values (
    p_slot_id, p_user_id, p_customer_name, p_customer_email, p_customer_phone,
    p_frame_product_id, p_note, v_cancel_token
  )
  returning id into v_appointment_id;

  return query select v_appointment_id, v_cancel_token;
end;
$$;

grant execute on function book_appointment to anon, authenticated;

-- ---------------------------------------------------------------------------
-- place_order：同樣加 guard
-- ---------------------------------------------------------------------------

drop function if exists place_order(jsonb, text, text, text, text, text, uuid);

create or replace function place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_note text default null,
  p_user_id uuid default null
)
returns table(order_id uuid, order_no text, payment_code text, lookup_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_no text;
  v_payment_code text;
  v_lookup_token uuid;
  v_subtotal integer := 0;
  v_shipping integer;
  v_total integer;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_name text;
  v_price integer;
  v_rows integer;
begin
  -- SEC-001 guard：擋直接打 RPC 把訂單掛到別人帳號
  perform ensure_user_id_matches_caller(p_user_id);

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  if coalesce(length(trim(p_customer_name)), 0) = 0
     or coalesce(length(trim(p_customer_email)), 0) = 0
     or coalesce(length(trim(p_customer_phone)), 0) = 0
     or coalesce(length(trim(p_shipping_address)), 0) = 0 then
    raise exception 'INVALID_CUSTOMER' using errcode = 'P0001';
  end if;

  for v_item in select jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;

    if v_qty is null or v_qty <= 0 or v_qty > 10 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    update products
    set finished_stock = finished_stock - v_qty
    where id = v_product_id
      and kind = 'finished'
      and is_online_available = true
      and deleted_at is null
      and finished_stock >= v_qty
    returning name, price_cents into v_name, v_price;

    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'OUT_OF_STOCK:%', v_product_id using errcode = 'P0002';
    end if;

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  v_shipping := case when v_subtotal >= 300000 then 0 else 8000 end;
  v_total := v_subtotal + v_shipping;

  v_order_no := 'NB-'
    || to_char(now() at time zone 'Asia/Taipei', 'YYMMDDHH24MISS')
    || '-'
    || lpad((floor(random() * 1000))::int::text, 3, '0');

  v_payment_code := lpad((floor(random() * 100000))::int::text, 5, '0');

  insert into orders (
    order_no, payment_code, user_id,
    subtotal_cents, shipping_fee_cents, total_cents,
    recipient_name, recipient_phone, customer_email, shipping_address, note
  ) values (
    v_order_no, v_payment_code, p_user_id,
    v_subtotal, v_shipping, v_total,
    p_customer_name, p_customer_phone, p_customer_email, p_shipping_address, p_note
  )
  returning id, lookup_token into v_order_id, v_lookup_token;

  for v_item in select jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;

    select name, price_cents into v_name, v_price
    from products where id = v_product_id;

    insert into order_items (
      order_id, product_id, product_name, unit_price_cents, quantity, subtotal_cents
    ) values (
      v_order_id, v_product_id, v_name, v_price, v_qty, v_price * v_qty
    );
  end loop;

  return query select v_order_id, v_order_no, v_payment_code, v_lookup_token;
end;
$$;

grant execute on function place_order to anon, authenticated;
