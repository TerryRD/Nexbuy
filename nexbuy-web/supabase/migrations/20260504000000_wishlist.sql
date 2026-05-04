-- Phase 4 PR 1：wishlist。客戶可在商品卡 / 商品詳情頁收藏鏡架，
-- 列表在 /account/wishlist。
--
-- 設計選擇：
-- - composite PK (customer_id, product_id) 直接讓 (customer, product)
--   唯一，免另開 unique constraint
-- - product_id 走 cascade，鏡架被刪掉就一起清掉
-- - customer_id ref customers(id) (而不是 auth.users)，跟 orders/appointments
--   的慣例不同 — 但 customers 反正是 auth.users 的 1:1 extension，
--   trigger 會建好，cascade 鏈也正確
--   ※ 改成跟其他表一致：直接 ref auth.users，免得 customers trigger
--   還沒跑完就有人想 INSERT
-- - RLS：自己的可 SELECT/INSERT/DELETE，admin 全 read（給未來分析用）

set search_path = public;

create table wishlist_items (
  customer_id uuid not null references auth.users on delete cascade,
  product_id uuid not null references products on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create index wishlist_items_customer_idx on wishlist_items(customer_id, created_at desc);

alter table wishlist_items enable row level security;

create policy wishlist_self_read on wishlist_items
  for select using (auth.uid() = customer_id or is_admin());

create policy wishlist_self_insert on wishlist_items
  for insert with check (auth.uid() = customer_id);

create policy wishlist_self_delete on wishlist_items
  for delete using (auth.uid() = customer_id);

-- UPDATE 不開 — wishlist 只有 add / remove，沒有改動
