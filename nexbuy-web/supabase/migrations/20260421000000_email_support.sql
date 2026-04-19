-- Lane D: email integration support.
-- - Orders need customer_email so we can send order-placed / order-paid mails.
-- - Appointments need reminder_sent_at so the daily cron doesn't double-send.
-- - place_order RPC gains p_customer_email parameter.

set search_path = public;

-- ---------------------------------------------------------------------------
-- orders.customer_email
-- ---------------------------------------------------------------------------

alter table orders add column if not exists customer_email text;

-- Backfill any pre-Lane-D rows. The single seed/test order(s) are dev-only,
-- a placeholder is fine.
update orders set customer_email = 'legacy@nexbuy.test' where customer_email is null;

alter table orders alter column customer_email set not null;

-- ---------------------------------------------------------------------------
-- appointments.reminder_sent_at
-- ---------------------------------------------------------------------------

alter table appointments add column if not exists reminder_sent_at timestamptz;

create index if not exists appointments_pending_reminder_idx
  on appointments (slot_id)
  where status = 'booked' and reminder_sent_at is null;

-- ---------------------------------------------------------------------------
-- place_order RPC: drop + recreate with customer_email
-- ---------------------------------------------------------------------------

drop function if exists place_order(jsonb, text, text, text, text, uuid);

create or replace function place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_note text default null,
  p_user_id uuid default null
)
returns table(order_id uuid, order_no text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_no text;
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

  insert into orders (
    order_no, user_id,
    subtotal_cents, shipping_fee_cents, total_cents,
    recipient_name, recipient_phone, customer_email, shipping_address, note
  ) values (
    v_order_no, p_user_id,
    v_subtotal, v_shipping, v_total,
    p_customer_name, p_customer_phone, p_customer_email, p_shipping_address, p_note
  )
  returning id into v_order_id;

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

  return query select v_order_id, v_order_no;
end;
$$;

grant execute on function place_order to anon, authenticated;
