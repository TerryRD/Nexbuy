-- 把 demo 階段塞的 Unsplash placeholder 商品圖全部清掉，回到 image_urls=[] 的
-- 「沒上傳」狀態。前端 productPlaceholderSvg() 會接手生成 deterministic 的
-- SVG 鏡框圖，跟商品的 kind / color / face_shape 對齊，視覺上每張都不同
-- 且不會再出現「棒球帽 / 車子 / 植物當眼鏡賣」的混亂。
--
-- 這個 update 只動 demo seed 商品（slug 跟 20260429 / 20260505000001 那
-- 兩波 demo 一致）。admin 上傳的真實照不會被動到：
--   - admin 上傳會 prepend 到 image_urls
--   - 上線後新進的商品也不會 match 下面這幾個 slug

set search_path = public;

update products
set image_urls = '{}'::text[]
where slug in (
  'sunglass-classic-black',
  'sunglass-round-gold',
  'sunglass-sport-blue',
  'reading-light-acetate',
  'reading-metal-thin',
  'rx-classic-tortoise',
  'rx-modern-titanium',
  'rx-kids-flexible'
);
