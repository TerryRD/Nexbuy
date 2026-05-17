-- 替 8 個 demo 商品補屬性（face_shape / frame_size / material / color），讓
-- storefront 屬性篩選有東西可篩，placeholder SVG 也會吃這些屬性畫出更貼切
-- 的鏡框形狀 / 配色（取代之前每張長一樣的 fallback）。
--
-- 屬性挑選依商品名意圖配對：
--   sunglass-classic-black  → 黑 / 方
--   sunglass-round-gold     → 金 / 圓
--   sunglass-sport-blue     → 透明 / 倒三角（運動款多 wrap-around）
--   reading-light-acetate   → 玳瑁 / 橢圓 / 醋酸纖維
--   reading-metal-thin      → 銀 / 圓 / 金屬（細框金屬）
--   rx-classic-tortoise     → 玳瑁 / 方 / 醋酸纖維
--   rx-modern-titanium      → 銀 / 方 / 金屬（極簡鈦框）
--   rx-kids-flexible        → 棕 / 心型 / TR90（兒童 TR90）
--
-- 沒動 size：3 個用 M、3 個用 S、2 個用 L 平均分布。

set search_path = public;

update products set face_shape = '{方形,橢圓}', frame_size = 'M', material = 'TR90',     color = '黑'   where slug = 'sunglass-classic-black';
update products set face_shape = '{圓形,橢圓}', frame_size = 'M', material = '金屬',     color = '金'   where slug = 'sunglass-round-gold';
update products set face_shape = '{倒三角,方形}', frame_size = 'L', material = 'TR90',   color = '透明' where slug = 'sunglass-sport-blue';
update products set face_shape = '{橢圓,圓形}', frame_size = 'S', material = '醋酸纖維', color = '玳瑁' where slug = 'reading-light-acetate';
update products set face_shape = '{圓形,橢圓}', frame_size = 'S', material = '金屬',     color = '銀'   where slug = 'reading-metal-thin';
update products set face_shape = '{方形,橢圓}', frame_size = 'M', material = '醋酸纖維', color = '玳瑁' where slug = 'rx-classic-tortoise';
update products set face_shape = '{方形}',     frame_size = 'L', material = '金屬',     color = '銀'   where slug = 'rx-modern-titanium';
update products set face_shape = '{倒三角,圓形}', frame_size = 'S', material = 'TR90',  color = '棕'   where slug = 'rx-kids-flexible';
