-- 購物車伺服器端儲存，供登入後跨裝置合併使用。
-- 策略：localStorage 為主要存取層；登入時從 DB 合併一次，其餘操作仍走 localStorage。

set search_path = public;

create table if not exists cart_items (
  user_id     uuid    not null references auth.users(id) on delete cascade,
  product_id  uuid    not null references products(id)   on delete cascade,
  slug        text    not null,
  name        text    not null,
  price_cents integer not null,
  quantity    integer not null default 1 check (quantity >= 1 and quantity <= 10),
  image_url   text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table cart_items enable row level security;

create policy "cart_items: users own their rows"
  on cart_items for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_cart_items_user on cart_items(user_id);
