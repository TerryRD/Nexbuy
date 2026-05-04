-- Phase 4 PR 2：訂單物流追蹤。
--
-- 既有的 orders.status 同時記金流（pending_payment / paid / refunded）跟
-- 粗的物流（shipped / completed）。為了讓客戶看到更細的物流進度（已出貨 →
-- 已送達 / 退貨）以及追蹤碼，新加 shipping_status / tracking_number /
-- tracking_carrier 三個欄位，與既有 status 並行（不動 advance flow）。
--
-- 設計選擇：
-- - shipping_status 用 text + CHECK 而不是 enum（跟既有 status 一致，方便
--   日後改動）
-- - tracking_number / carrier nullable — admin 可只切 shipping_status 不填碼
-- - 不加 trigger 自動同步 status ↔ shipping_status，admin 各自掌控

set search_path = public;

alter table orders
  add column if not exists shipping_status text not null default 'not_shipped'
    check (shipping_status in (
      'not_shipped', 'preparing', 'shipped', 'delivered', 'returned'
    )),
  add column if not exists tracking_number text,
  add column if not exists tracking_carrier text;

create index if not exists orders_shipping_status_idx
  on orders(shipping_status)
  where shipping_status in ('preparing', 'shipped');
