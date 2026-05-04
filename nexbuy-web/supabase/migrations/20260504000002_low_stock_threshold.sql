-- Phase 5 PR 2：低庫存警戒值改成 per-product 可調，搭配每日 cron
-- /api/cron/low-stock-alert 寄 digest 給 admin。
--
-- 設計選擇：
-- - 不用全域設定（products.metadata 之類）— 每副鏡架熱銷度差異大，
--   per-product 才實用
-- - default 3：與 PR 1 dashboard 原 hardcoded 警戒值一致
-- - prescription_frame 的 finished_stock 是 null，這個欄位對它無意義
--   但仍給 default 3 以免日後新增 kind 時要寫 NULL 處理

set search_path = public;

alter table products
  add column if not exists low_stock_threshold integer not null default 3
    check (low_stock_threshold >= 0 and low_stock_threshold <= 99999);
