-- Fix demo product images that don't actually show eyewear.
--
-- QA 2026-05-05 抓到 4 個商品縮圖跟品名嚴重不符（棒球帽、車、植物、路人）。
-- 來源是 20260429 那輪用的 Unsplash photo ID 沒實際對到眼鏡，但 sunglass-
-- classic-black / rx-classic-tortoise 那兩張是 OK 的。
--
-- 短期解：把錯的 4 個換成已驗證的 Unsplash 眼鏡照（暫時複用 sunglass-
-- classic-black 那張）。長期解：admin 進後台上傳真品照（admin upload
-- 流程會 prepend 到 image_urls，自動覆蓋）。
--
-- 不動的：
--   sunglass-classic-black  ✅ 眼鏡
--   rx-classic-tortoise     ✅ 眼鏡
--   reading-metal-thin      （QA 沒問題）
--   rx-kids-flexible        （顯示眼鏡，雖然不是兒童款，可接受）

set search_path = public;

-- 用 sunglass-classic-black 那張（已確認是黑框太陽眼鏡）當 placeholder。
-- WHERE 條件對「商品名 ↔ 圖片不符」的 4 個 slug 開刀，其他不動。
update products
set image_urls = array[
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80&auto=format&fit=crop'
]
where slug in (
  'sunglass-round-gold',     -- 原本是棒球帽
  'sunglass-sport-blue',     -- 原本是植物
  'reading-light-acetate',   -- 原本是路人
  'rx-modern-titanium'       -- 原本是車
);
