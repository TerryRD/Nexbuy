-- Seed data for local dev
-- 跑：supabase db reset 會自動執行這個檔案

-- 成品眼鏡 (5 款) + 處方鏡架 (3 款)
insert into products (slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available) values
  ('sunglass-classic-black', '經典黑框太陽眼鏡', '偏光鏡片、UV400、輕量 TR90 鏡架', 128000, array['/placeholder/sun-1.webp'], 'Nexbuy', 'finished', 15, true),
  ('sunglass-round-gold', '圓框金邊太陽眼鏡', '復古圓框、金屬鏡架、可替換鏡片', 168000, array['/placeholder/sun-2.webp'], 'Nexbuy', 'finished', 8, true),
  ('sunglass-sport-blue', '運動型藍框太陽眼鏡', '防滑鼻墊、包覆鏡框、適合騎行跑步', 98000, array['/placeholder/sun-3.webp'], 'SportX', 'finished', 20, true),
  ('reading-light-acetate', '時尚淺色平光眼鏡', '醋酸纖維鏡架、抗藍光、非度數', 68000, array['/placeholder/flat-1.webp'], 'Nexbuy', 'finished', 12, true),
  ('reading-metal-thin', '金屬細框平光眼鏡', '鈦金屬、超輕、抗過敏', 88000, array['/placeholder/flat-2.webp'], 'Nexbuy', 'finished', 10, true),
  ('rx-classic-tortoise', '玳瑁色經典鏡架 (可配度數)', '醋酸纖維、線上預約到店驗光配鏡', 320000, array['/placeholder/rx-1.webp'], 'Nexbuy', 'prescription_frame', null, true),
  ('rx-modern-titanium', '現代極簡鈦金屬鏡架', '日本製鈦金屬、線上預約到店驗光配鏡', 480000, array['/placeholder/rx-2.webp'], 'Nexbuy', 'prescription_frame', null, true),
  ('rx-kids-flexible', '兒童彈性鏡架', 'TR90 不易斷裂、線上預約到店驗光配鏡', 180000, array['/placeholder/rx-3.webp'], 'Nexbuy', 'prescription_frame', null, true);

-- 接下來 7 天可預約時段 (每日早 10:00、午 14:00、晚 18:00)
insert into appointment_slots (date, start_time, end_time, capacity, is_active)
select
  (current_date + d)::date,
  time,
  (time::time + interval '60 minutes')::time,
  1,
  true
from
  generate_series(0, 6) as d,
  (values (time '10:00'), (time '14:00'), (time '18:00')) as t(time);
