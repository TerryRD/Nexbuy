-- Nexbuy MVP initial schema
-- Stack: Next.js + Supabase
-- Scope: 眼鏡店 MVP (成品直購 + 處方預約到店)

set search_path = public;

-- =========================================================================
-- Products
-- =========================================================================
-- kind = 'finished'          → 成品眼鏡 (加入購物車直接買)
-- kind = 'prescription_frame' → 處方鏡架 (線上預約到店配鏡)

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  image_urls text[] not null default '{}',
  brand text,
  kind text not null check (kind in ('finished', 'prescription_frame')),
  finished_stock integer check (
    (kind = 'finished' and finished_stock is not null and finished_stock >= 0)
    or (kind = 'prescription_frame' and finished_stock is null)
  ),
  is_online_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_kind_idx on products(kind) where is_online_available;

-- =========================================================================
-- Orders (成品直購)
-- =========================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  user_id uuid references auth.users,  -- null 允許 guest checkout
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'preparing', 'shipped', 'completed', 'cancelled', 'refunded'
  )),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_fee_cents integer not null default 0 check (shipping_fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  recipient_name text not null,
  recipient_phone text not null,
  shipping_address text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on orders(user_id);
create index orders_status_idx on orders(status) where status in ('pending_payment', 'paid');

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid not null references products on delete restrict,
  -- 快照商品名稱 / 價格 (防止商品改名或改價後訂單金額跳動)
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_cents integer not null check (subtotal_cents >= 0)
);

create index order_items_order_idx on order_items(order_id);

-- =========================================================================
-- Appointment Slots (可預約時段)
-- =========================================================================

create table appointment_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  capacity integer not null default 1 check (capacity > 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (date, start_time)
);

create index slots_date_active_idx on appointment_slots(date) where is_active;

-- =========================================================================
-- Appointments (處方預約到店)
-- =========================================================================

create table appointments (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references appointment_slots on delete restrict,
  user_id uuid references auth.users,  -- null 允許 guest booking
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  frame_product_id uuid references products on delete set null,
  note text,
  status text not null default 'booked' check (status in (
    'booked', 'completed', 'noshow', 'cancelled'
  )),
  -- gen_random_uuid() is Postgres-native; strip dashes to get 32-char hex token
  -- matching the `^[0-9a-f]{32}$` format validated in the API route.
  cancel_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index appointments_slot_idx on appointments(slot_id);
create index appointments_user_idx on appointments(user_id);

-- =========================================================================
-- book_appointment RPC (atomic, race-safe)
-- =========================================================================
-- 關鍵：用 Postgres atomic UPDATE 保證 slot.booked_count < capacity 時才建 appointment
-- 兩個 request 同時打這個 function，只有一個會成功 (另一個的 UPDATE 會匹配不到)
-- 回傳 (appointment_id, cancel_token) 或 raise exception 'SLOT_FULL'

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

  insert into appointments (
    slot_id, user_id, customer_name, customer_email, customer_phone,
    frame_product_id, note
  ) values (
    p_slot_id, p_user_id, p_customer_name, p_customer_email, p_customer_phone,
    p_frame_product_id, p_note
  )
  returning id, appointments.cancel_token
  into v_appointment_id, v_cancel_token;

  return query select v_appointment_id, v_cancel_token;
end;
$$;

-- =========================================================================
-- cancel_appointment RPC (token-based, guest-friendly)
-- =========================================================================
-- 取消預約並釋放 slot booked_count
-- 用 cancel_token 驗證，不需要登入

create or replace function cancel_appointment(p_cancel_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_id uuid;
  v_status text;
begin
  select slot_id, status into v_slot_id, v_status
  from appointments
  where cancel_token = p_cancel_token;

  if v_slot_id is null then
    raise exception 'INVALID_TOKEN' using errcode = 'P0002';
  end if;

  if v_status = 'cancelled' then
    -- Idempotent：已經取消過就直接回 true，不重複扣 slot
    return true;
  end if;

  if v_status != 'booked' then
    raise exception 'CANNOT_CANCEL' using errcode = 'P0003';
  end if;

  update appointments
  set status = 'cancelled', cancelled_at = now()
  where cancel_token = p_cancel_token and status = 'booked';

  update appointment_slots
  set booked_count = greatest(0, booked_count - 1)
  where id = v_slot_id;

  return true;
end;
$$;

-- =========================================================================
-- updated_at triggers
-- =========================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
