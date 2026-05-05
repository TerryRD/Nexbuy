-- 商品改成軟刪除。
--
-- 原本 admin「刪除」是 hard delete（DROP），雖然 order_items 已 snapshot
-- product 名稱 / 價格、appointments.frame_product_id 也是 ON DELETE SET
-- NULL，所以歷史不會壞。但「下架」與「刪除」之間缺一個明確的中間態：
-- 真的不想再賣這個 SKU 但要保留統計關聯。
--
-- 改法：
--   1. products.deleted_at timestamptz null
--   2. RLS 公開讀 policy 加上 deleted_at is null
--   3. admin actions.deleteProduct 改成同時設 is_online_available=false +
--      deleted_at=now()，搭配舊有 is_online_available 過濾即可，不用改
--      RPC / 既有查詢
--
-- 復原：直接 SQL `update products set deleted_at = null, is_online_available = true`
-- 即可。後台暫不出 UI（rare 操作）。

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. products.deleted_at
-- ---------------------------------------------------------------------------

alter table products
  add column if not exists deleted_at timestamptz;

-- 公開讀 policy 收緊：deleted 的就算 is_online_available 暫時還沒被 toggle 也不能看到。
-- admin 仍能看到全部（包含 soft-deleted），方便將來出復原 UI。

drop policy if exists products_public_read on products;

create policy products_public_read on products
  for select using (
    (is_online_available and deleted_at is null)
    or is_admin()
  );
