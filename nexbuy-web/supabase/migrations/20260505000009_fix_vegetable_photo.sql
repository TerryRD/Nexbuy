-- 補正：之前 20260505000008 用了 1542838132-92c53300491e 給
-- rx-classic-tortoise 跟 reading-metal-rect — 我以為這是眼鏡照，
-- 結果實際 download 來看是蔬菜攤位。😅
--
-- 替換成已驗證為眼鏡的兩張：
--   rx-classic-tortoise → 1574258495973（玳瑁色金邊鏡架，跟商品色調最合）
--   reading-metal-rect  → 1591076482161（木桌上的金屬細邊鏡框）
--
-- production DB 已用 Management API 直接 update 修好；這支 migration
-- 補回 history 讓 dev / main / production 三邊一致，重新跑 schema 也
-- 能得到同樣結果。

set search_path = public;

update products set image_urls = array['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&q=80&auto=format&fit=crop']
  where slug = 'rx-classic-tortoise';

update products set image_urls = array['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=1200&q=80&auto=format&fit=crop']
  where slug = 'reading-metal-rect';
