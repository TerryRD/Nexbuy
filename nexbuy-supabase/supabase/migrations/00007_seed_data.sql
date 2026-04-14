-- ============================================================
-- Seed Data
-- Converted from C# SeedData.cs
-- ============================================================

-- ── Admin ───────────────────────────────────────────────────

INSERT INTO admins (email, password_hash, name, role, status)
VALUES (
  'admin@nexbuy.local',
  extensions.crypt('Admin123!', extensions.gen_salt('bf')),
  '系統管理員',
  'super_admin',
  'active'
);

-- ── Point Rules ─────────────────────────────────────────────

INSERT INTO point_rules (earn_rate, redeem_rate, point_expiry_months)
VALUES (0.01, 1.0, 12);

-- ── Categories ──────────────────────────────────────────────

-- Root categories
INSERT INTO categories (slug, sort_order) VALUES ('electronics', 1);
INSERT INTO categories (slug, sort_order) VALUES ('clothing', 2);
INSERT INTO categories (slug, sort_order) VALUES ('digital-goods', 3);

-- Sub-categories for electronics
INSERT INTO categories (parent_id, slug, sort_order)
VALUES (
  (SELECT id FROM categories WHERE slug = 'electronics'),
  'phones',
  1
);
INSERT INTO categories (parent_id, slug, sort_order)
VALUES (
  (SELECT id FROM categories WHERE slug = 'electronics'),
  'laptops',
  2
);

-- Sub-categories for clothing
INSERT INTO categories (parent_id, slug, sort_order)
VALUES (
  (SELECT id FROM categories WHERE slug = 'clothing'),
  'tops',
  1
);
INSERT INTO categories (parent_id, slug, sort_order)
VALUES (
  (SELECT id FROM categories WHERE slug = 'clothing'),
  'pants',
  2
);

-- ── Products ────────────────────────────────────────────────

-- Product 1: Smartphone
INSERT INTO products (id, category_id, sku, type, price, stock, status)
VALUES (
  'a0000001-0000-0000-0000-000000000001',
  (SELECT id FROM categories WHERE slug = 'phones'),
  'PHONE-001', 'physical', 25900, 50, 'active'
);

-- Product 2: Laptop
INSERT INTO products (id, category_id, sku, type, price, stock, status)
VALUES (
  'a0000001-0000-0000-0000-000000000002',
  (SELECT id FROM categories WHERE slug = 'laptops'),
  'LAPTOP-001', 'physical', 42900, 30, 'active'
);

-- Product 3: T-Shirt
INSERT INTO products (id, category_id, sku, type, price, stock, status)
VALUES (
  'a0000001-0000-0000-0000-000000000003',
  (SELECT id FROM categories WHERE slug = 'tops'),
  'TOP-001', 'physical', 590, 200, 'active'
);

-- Product 4: Jeans
INSERT INTO products (id, category_id, sku, type, price, stock, status)
VALUES (
  'a0000001-0000-0000-0000-000000000004',
  (SELECT id FROM categories WHERE slug = 'pants'),
  'PANT-001', 'physical', 1290, 100, 'active'
);

-- Product 5: Wireless Earbuds
INSERT INTO products (id, category_id, sku, type, price, stock, status)
VALUES (
  'a0000001-0000-0000-0000-000000000005',
  (SELECT id FROM categories WHERE slug = 'phones'),
  'PHONE-002', 'physical', 3490, 80, 'active'
);

-- Product 6: Digital Course
INSERT INTO products (id, category_id, sku, type, price, stock, max_downloads, download_expiry_hours, status)
VALUES (
  'a0000001-0000-0000-0000-000000000006',
  (SELECT id FROM categories WHERE slug = 'digital-goods'),
  'DIG-001', 'digital', 1990, 999, 5, 720, 'active'
);

-- ── Product Translations ────────────────────────────────────

-- Phone
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'zh-TW', '旗艦智慧型手機 Pro', '最新旗艦手機，搭載頂級處理器與 AMOLED 螢幕'),
  ('a0000001-0000-0000-0000-000000000001', 'en', 'Flagship Smartphone Pro', 'Latest flagship phone with top-tier processor and AMOLED display'),
  ('a0000001-0000-0000-0000-000000000001', 'ja', 'フラッグシップスマートフォン Pro', '最新フラッグシップ、最高級プロセッサとAMOLEDディスプレイ搭載');

-- Laptop
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000002', 'zh-TW', '輕薄筆記型電腦 14 吋', '超輕薄設計，14 吋 2K 螢幕，續航力長達 12 小時'),
  ('a0000001-0000-0000-0000-000000000002', 'en', 'Ultra-thin Laptop 14"', 'Ultra-thin design, 14-inch 2K display, up to 12 hours battery life'),
  ('a0000001-0000-0000-0000-000000000002', 'ja', '超薄型ノートパソコン 14インチ', '超薄型デザイン、14インチ2Kディスプレイ、最大12時間バッテリー');

-- T-Shirt
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000003', 'zh-TW', '經典純棉圓領T恤', '100% 純棉材質，舒適透氣，多色可選'),
  ('a0000001-0000-0000-0000-000000000003', 'en', 'Classic Cotton Crew Neck T-Shirt', '100% cotton, comfortable and breathable, available in multiple colors'),
  ('a0000001-0000-0000-0000-000000000003', 'ja', 'クラシックコットンクルーネックTシャツ', '100%コットン素材、快適で通気性抜群、多色展開');

-- Jeans
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000004', 'zh-TW', '修身直筒牛仔褲', '彈性丹寧布料，修身剪裁，經典百搭'),
  ('a0000001-0000-0000-0000-000000000004', 'en', 'Slim Straight Jeans', 'Stretch denim fabric, slim fit, classic and versatile'),
  ('a0000001-0000-0000-0000-000000000004', 'ja', 'スリムストレートジーンズ', 'ストレッチデニム素材、スリムフィット、定番で合わせやすい');

-- Earbuds
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000005', 'zh-TW', '真無線藍牙耳機', '主動降噪，IPX5 防水，續航 30 小時'),
  ('a0000001-0000-0000-0000-000000000005', 'en', 'True Wireless Bluetooth Earbuds', 'Active noise cancellation, IPX5 waterproof, 30-hour battery life'),
  ('a0000001-0000-0000-0000-000000000005', 'ja', '完全ワイヤレスBluetoothイヤホン', 'アクティブノイズキャンセリング、IPX5防水、30時間バッテリー');

-- Digital Course
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('a0000001-0000-0000-0000-000000000006', 'zh-TW', 'Python 程式設計入門課程', '從零開始學 Python，包含實戰專案與練習題'),
  ('a0000001-0000-0000-0000-000000000006', 'en', 'Python Programming Beginner Course', 'Learn Python from scratch with hands-on projects and exercises'),
  ('a0000001-0000-0000-0000-000000000006', 'ja', 'Python プログラミング入門コース', 'ゼロから学ぶPython、実践プロジェクトと演習問題付き');

-- ── Product Images ──────────────────────────────────────────

INSERT INTO product_images (product_id, url, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', '/images/products/phone-001-1.svg', 1),
  ('a0000001-0000-0000-0000-000000000001', '/images/products/phone-001-2.svg', 2),
  ('a0000001-0000-0000-0000-000000000002', '/images/products/laptop-001-1.svg', 1),
  ('a0000001-0000-0000-0000-000000000002', '/images/products/laptop-001-2.svg', 2),
  ('a0000001-0000-0000-0000-000000000003', '/images/products/top-001-1.svg', 1),
  ('a0000001-0000-0000-0000-000000000004', '/images/products/pant-001-1.svg', 1),
  ('a0000001-0000-0000-0000-000000000005', '/images/products/phone-002-1.svg', 1),
  ('a0000001-0000-0000-0000-000000000006', '/images/products/dig-001-1.svg', 1);

-- ── Shipping Methods ────────────────────────────────────────

INSERT INTO shipping_methods (name, type, base_fee, free_shipping_threshold, is_active) VALUES
  ('宅配', 'home_delivery', 100, 1500, true),
  ('7-11超商取貨', 'seven_eleven', 60, 1000, true),
  ('全家超商取貨', 'family_mart', 60, 1000, true);

-- ── Coupons ─────────────────────────────────────────────────

INSERT INTO coupons (code, type, value, min_order_amount, usage_limit, used_count, start_at, expired_at, status) VALUES
  ('WELCOME10', 'percentage', 10, 500, 1000, 0, now(), now() + interval '6 months', 'active'),
  ('SAVE100', 'fixed_amount', 100, 1000, 500, 0, now(), now() + interval '3 months', 'active');
