-- place_order RPC: atomic multi-item order creation with stock decrement.
--
-- Same race-safe pattern as book_appointment: each line uses
-- `update products ... where finished_stock >= qty` so two concurrent
-- orders competing for the last N units can't both win.
--
-- Guest checkout supported via p_user_id = null.

set search_path = public;

create or replace function place_order(
  p_items jsonb,                -- array of {product_id, quantity}
  p_customer_name text,
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
     or coalesce(length(trim(p_customer_phone)), 0) = 0
     or coalesce(length(trim(p_shipping_address)), 0) = 0 then
    raise exception 'INVALID_CUSTOMER' using errcode = 'P0001';
  end if;

  -- Pass 1: validate + decrement stock + sum subtotal
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

  -- Shipping rule: 80 NTD flat, free over 3000 NTD (subtotal in cents).
  v_shipping := case when v_subtotal >= 300000 then 0 else 8000 end;
  v_total := v_subtotal + v_shipping;

  -- order_no: NB-YYMMDDHHMMSS-NNN (ms + 3-digit random). Very unlikely to
  -- collide at MVP volume; caller can retry on unique-violation if needed.
  v_order_no := 'NB-'
    || to_char(now() at time zone 'Asia/Taipei', 'YYMMDDHH24MISS')
    || '-'
    || lpad((floor(random() * 1000))::int::text, 3, '0');

  insert into orders (
    order_no, user_id,
    subtotal_cents, shipping_fee_cents, total_cents,
    recipient_name, recipient_phone, shipping_address, note
  ) values (
    v_order_no, p_user_id,
    v_subtotal, v_shipping, v_total,
    p_customer_name, p_customer_phone, p_shipping_address, p_note
  )
  returning id into v_order_id;

  -- Pass 2: insert order_items snapshot (re-query for name/price; stock
  -- already decremented so the read is safe).
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

-- Public order lookup by order_no (for the success page, allows guests
-- to see their own order via the order_no alone — acts as a simple
-- shared secret since it contains a random component).
-- The orders table has RLS (owner/admin only for select), so guests
-- cannot use PostgREST directly. The success page uses the admin client
-- to look up by order_no. This function isn't strictly needed but
-- reserved for a future API endpoint if we want to avoid the admin key.
