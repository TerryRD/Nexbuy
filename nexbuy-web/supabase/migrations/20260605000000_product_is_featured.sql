-- 首頁「精選商品」策展旗標。依 migration 政策：nullable、無 default、不 backfill。
alter table products
  add column if not exists is_featured boolean;

comment on column products.is_featured is '首頁精選商品策展旗標；null/false = 不精選';

-- 精選查詢索引（部分索引，只索引 featured=true 的列）
create index if not exists products_is_featured_idx
  on products (is_featured)
  where is_featured = true;
