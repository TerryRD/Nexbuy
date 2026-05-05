-- 補正：之前 20260505000006 把 8 個 demo 商品的 image_urls 全部清成 []
-- 是過頭的處理。客戶看到 SVG icon-only 顯然不是預期。把照片補回來，
-- 用 Unsplash 上確認是眼鏡的 8 張不同 photo ID（一張一個 SKU），順便
-- 加 12 個新測試商品 → storefront 共 20 件，filter 跟 list pagination
-- 都有東西可玩。
--
-- 真品照上線時：admin 進編輯頁上傳 → image_urls[0] 蓋掉 Unsplash URL，
-- 照片自動切換。
--
-- 註：照片 ID 都是已驗證為眼鏡相關（之前 QA 確認過、或來自 HERO_SLIDES
-- 既有用過的 set）。如果某張在 Unsplash 上被刪/改，前端 SVG fallback
-- 會接手（getProductImageUrl helper 已經這樣設計）。

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. 恢復 8 個既有商品的圖（每個都不同）
-- ---------------------------------------------------------------------------

-- 已驗證為眼鏡照的 Unsplash IDs（每個 ID 用來做 1 張 SKU 圖）
update products set image_urls = array['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80&auto=format&fit=crop'] where slug = 'sunglass-classic-black';
update products set image_urls = array['https://images.unsplash.com/photo-1577803645773-f96470509666?w=1200&q=80&auto=format&fit=crop'] where slug = 'sunglass-round-gold';
update products set image_urls = array['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&q=80&auto=format&fit=crop'] where slug = 'sunglass-sport-blue';
update products set image_urls = array['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=1200&q=80&auto=format&fit=crop'] where slug = 'reading-light-acetate';
update products set image_urls = array['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&q=80&auto=format&fit=crop'] where slug = 'reading-metal-thin';
update products set image_urls = array['https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&auto=format&fit=crop'] where slug = 'rx-classic-tortoise';
update products set image_urls = array['https://images.unsplash.com/photo-1577744486770-020ab432da65?w=1200&q=80&auto=format&fit=crop'] where slug = 'rx-modern-titanium';
update products set image_urls = array['https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1200&q=80&auto=format&fit=crop'] where slug = 'rx-kids-flexible';

-- ---------------------------------------------------------------------------
-- 2. 加 12 個新測試商品（涵蓋各種 kind / 顏色 / 形狀 / 尺寸 / 材質）
-- ---------------------------------------------------------------------------

insert into products (
  name, slug, kind, price_cents, finished_stock, low_stock_threshold,
  is_online_available, description, brand, image_urls,
  face_shape, frame_size, material, color
) values
-- 成品太陽眼鏡
('飛行員金屬太陽眼鏡', 'sunglass-aviator-gold', 'finished', 138000, 8, 3, true,
 '經典 aviator 雙樑設計、抗 UV400、適合長臉與方臉。',
 'Skyline', array['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80&auto=format&fit=crop'],
 '{方形,倒三角}', 'L', '金屬', '金'),

('貓眼太陽眼鏡', 'sunglass-cat-eye', 'finished', 98000, 12, 3, true,
 '復古貓眼造型、輕量醋酸纖維、女性愛用款。',
 'Vintage Co.', array['https://images.unsplash.com/photo-1577803645773-f96470509666?w=1200&q=80&auto=format&fit=crop'],
 '{圓形,橢圓}', 'M', '醋酸纖維', '玳瑁'),

('木紋方框太陽眼鏡', 'sunglass-wooden-square', 'finished', 158000, 5, 3, true,
 '天然木紋鏡架、偏光鏡片、戶外運動兩用。',
 'Forest', array['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&q=80&auto=format&fit=crop'],
 '{方形}', 'M', '複合', '棕'),

-- 成品平光眼鏡
('抗藍光透明圓框', 'reading-clear-round', 'finished', 78000, 15, 3, true,
 '電腦族首選、抗藍光、抗 UV、無度數。',
 'Workday', array['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=1200&q=80&auto=format&fit=crop'],
 '{圓形,橢圓}', 'M', '醋酸纖維', '透明'),

('細邊金屬商務眼鏡', 'reading-metal-rect', 'finished', 88000, 10, 3, true,
 '極簡商務款、超輕鈦金屬、無度數平光。',
 'Tokyo Frames', array['https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&auto=format&fit=crop'],
 '{方形}', 'L', '金屬', '銀'),

('熊貓玳瑁圓框', 'reading-panda-round', 'finished', 68000, 20, 3, true,
 '黑色框 + 玳瑁邊雙色搭配、抗藍光、輕量。',
 'Vintage Co.', array['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&q=80&auto=format&fit=crop'],
 '{圓形}', 'S', '醋酸纖維', '玳瑁'),

-- 處方鏡架
('日系極簡細圓鏡架', 'rx-japan-thin-round', 'prescription_frame', 380000, null, 3, true,
 '日本鈦金屬細邊圓框、線上預約到店配鏡。可客製鏡片。',
 'Tokyo Frames', array['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&q=80&auto=format&fit=crop'],
 '{圓形,橢圓}', 'M', '金屬', '金'),

('北歐白色方框鏡架', 'rx-nordic-white-square', 'prescription_frame', 320000, null, 3, true,
 '北歐極簡風白色醋酸纖維、線上預約到店配鏡。',
 'Helsinki', array['https://images.unsplash.com/photo-1577744486770-020ab432da65?w=1200&q=80&auto=format&fit=crop'],
 '{方形,橢圓}', 'M', '醋酸纖維', '透明'),

('黑色商務粗框鏡架', 'rx-business-bold', 'prescription_frame', 280000, null, 3, true,
 '商務正裝必備、粗框醋酸纖維、線上預約到店配鏡。',
 'Suit Up', array['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80&auto=format&fit=crop'],
 '{方形}', 'L', '醋酸纖維', '黑'),

('銀色金屬圓框鏡架', 'rx-silver-round', 'prescription_frame', 360000, null, 3, true,
 '日本製銀色金屬細圓框、線上預約到店驗光配鏡。',
 'Tokyo Frames', array['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=1200&q=80&auto=format&fit=crop'],
 '{圓形}', 'S', '金屬', '銀'),

-- 太陽眼鏡 — 售完狀態（測試「已售完」flag）
('限量金屬手工太陽眼鏡', 'sunglass-limited-handmade', 'finished', 248000, 0, 3, true,
 '日本職人手工打磨、限量發售。目前已售完。',
 'Artisan', array['https://images.unsplash.com/photo-1577803645773-f96470509666?w=1200&q=80&auto=format&fit=crop'],
 '{方形,橢圓}', 'M', '金屬', '金'),

-- 下架狀態（測試 admin 視角能看到、storefront 看不到）
('下架款 — 系統測試用', 'test-offline-product', 'finished', 50000, 5, 3, false,
 '這個是給 admin 測試「下架」狀態用的，storefront 看不到。',
 'Test', array[]::text[],
 '{}', null, null, null);
