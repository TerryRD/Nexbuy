-- Row-Level Security policies
-- ⚠️ 上線前用 `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'` 確認全開

set search_path = public;

-- Helper: is_admin() checks JWT role claim
-- Admin 透過 auth.jwt() ->> 'role' = 'admin'。在 Supabase dashboard > Auth > Users
-- 編輯 raw_user_meta_data 加 "role": "admin"，或建個 admin_users table 存身份。
-- MVP 採最簡單的 JWT claim 做法。
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'role' = 'admin', false);
$$;

-- =========================================================================
-- products: 公開 read；admin 可寫
-- =========================================================================
alter table products enable row level security;

create policy products_public_read on products
  for select using (is_online_available or is_admin());

create policy products_admin_insert on products
  for insert with check (is_admin());
create policy products_admin_update on products
  for update using (is_admin()) with check (is_admin());
create policy products_admin_delete on products
  for delete using (is_admin());

-- =========================================================================
-- orders: 顧客只能看自己；admin 全部
-- 建單走 API route (用 service role key 繞過 RLS，route 裡自己驗證)
-- =========================================================================
alter table orders enable row level security;

create policy orders_owner_read on orders
  for select using (auth.uid() = user_id or is_admin());

create policy orders_admin_write on orders
  for update using (is_admin()) with check (is_admin());

create policy orders_admin_delete on orders
  for delete using (is_admin());

-- orders INSERT 不開 RLS：強制透過 API route + service_role

-- =========================================================================
-- order_items: 跟著 orders 的權限走
-- =========================================================================
alter table order_items enable row level security;

create policy order_items_read on order_items
  for select using (
    is_admin() or
    exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- order_items INSERT 只走 API route (service_role)

-- =========================================================================
-- appointment_slots: 公開讀啟用中的；admin 寫
-- =========================================================================
alter table appointment_slots enable row level security;

create policy slots_public_read on appointment_slots
  for select using (is_active or is_admin());

create policy slots_admin_write on appointment_slots
  for insert with check (is_admin());
create policy slots_admin_update on appointment_slots
  for update using (is_admin()) with check (is_admin());
create policy slots_admin_delete on appointment_slots
  for delete using (is_admin());

-- =========================================================================
-- appointments: owner / admin read；寫只走 book_appointment RPC
-- =========================================================================
alter table appointments enable row level security;

create policy appointments_owner_read on appointments
  for select using (auth.uid() = user_id or is_admin());

create policy appointments_admin_write on appointments
  for update using (is_admin()) with check (is_admin());

create policy appointments_admin_delete on appointments
  for delete using (is_admin());

-- 注意：guest booking (user_id is null) 的讀取不透過 RLS，而是透過 cancel_token
-- 走 API route + service_role。

-- =========================================================================
-- Grant RPC execute
-- =========================================================================
grant execute on function book_appointment to anon, authenticated;
grant execute on function cancel_appointment to anon, authenticated;
