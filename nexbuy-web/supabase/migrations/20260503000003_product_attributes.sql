-- Phase 3：商品 attribute schema。給之後的 filter chips、比較功能、
-- 客戶端決策輔助用。全部 nullable — admin 沒有每副鏡架都填的義務。
--
-- 設計選擇：
-- - face_shape 是 text[] 陣列（一副鏡架可能適合多種臉型）
-- - frame_size / material / color 各是單一 text（值是有限集合，但用
--   text 而不是 enum 方便日後擴充）
-- - 校驗集合在 zod schema、不放 DB CHECK constraint（避免改集合時
--   要再寫 migration）

set search_path = public;

alter table products
  add column if not exists face_shape text[] not null default '{}',
  add column if not exists frame_size text,
  add column if not exists material text,
  add column if not exists color text;

-- 之後 filter UI 多半會用 contains 或 = 查，建 index 給 face_shape
-- 用 GIN（陣列 contains 查最佳）+ 其他三個用 btree（部分掃常見）。
create index if not exists products_face_shape_idx
  on products using gin (face_shape);
create index if not exists products_frame_size_idx
  on products (frame_size) where frame_size is not null;
create index if not exists products_material_idx
  on products (material) where material is not null;
create index if not exists products_color_idx
  on products (color) where color is not null;
