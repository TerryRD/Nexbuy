-- 一次塞滿所有測試情境：admin / 客戶 / 報表頁都有東西可看。
-- 以「儘量不影響真實流量」為前提：訂單放過去 60 天散布、appointments
-- 放今天 + 未來幾天 + 過去（已完成/未到/取消）。
-- 全部 idempotent — order_no / cancel_token / slug 都用 fixed prefix「TEST-」/
-- 「test-」開頭，重跑可清楚看到。
--
-- 涵蓋情境：
--   slots: 未來 28 天 weekday × 3 時段 + active/inactive/full 狀態
--   orders: 7 種 status × 各種 shipping_status
--   appointments: booked(future) / completed / noshow / cancelled
--   prescriptions: 1 客戶 2 筆驗光紀錄（看歷程）
--   wishlist: 1 客戶 3 件收藏
--   marketing_campaigns: draft / scheduled / sent
--   customers.marketing_opt_in: 1 真客戶設 true（行銷信有對象）

set search_path = public;

-- ---------------------------------------------------------------------------
-- 0. 客戶 marketing_opt_in：1 個真客戶開（留另 1 個關，行銷信對象 = 1）
-- ---------------------------------------------------------------------------

update customers set marketing_opt_in = true
  where id = '697d30d9-ff0a-4aa4-8302-8e8deb98e130';

-- ---------------------------------------------------------------------------
-- 1. Slots — 未來 28 天 × 平日 × 3 時段 (10/14/18) + 一些狀態變化
-- ---------------------------------------------------------------------------

-- weekday 1-5（一到五）的 28 天，每天三段 60 分鐘
insert into appointment_slots (date, start_time, end_time, capacity, booked_count, is_active)
select d::date,
       t.s::time,
       t.e::time,
       1 as capacity,
       0 as booked_count,
       true as is_active
from generate_series(current_date, current_date + interval '27 days', interval '1 day') as d,
     (values ('10:00','11:00'), ('14:00','15:00'), ('18:00','19:00')) as t(s, e)
where extract(dow from d) between 1 and 5
on conflict (date, start_time) do nothing;

-- 把今天的 14:00 標 booked_count=1（搭配下面 appointment）
update appointment_slots set booked_count = 1
  where date = current_date and start_time = '14:00:00';

-- 明天 10:00 標滿
update appointment_slots set booked_count = capacity
  where date = current_date + interval '1 day' and start_time = '10:00:00';

-- 後天 18:00 改成 inactive（admin 暫時關掉）
update appointment_slots set is_active = false
  where date = current_date + interval '2 days' and start_time = '18:00:00';

-- ---------------------------------------------------------------------------
-- 2. Test Orders — 涵蓋全部 status × shipping_status
-- ---------------------------------------------------------------------------
-- 用固定 order_no（TEST 前綴）+ 預先指定 id 方便 order_items reference

with test_orders as (
  insert into orders (
    id, order_no, payment_code, user_id, status, shipping_status,
    subtotal_cents, shipping_fee_cents, total_cents,
    recipient_name, recipient_phone, customer_email, shipping_address,
    note, tracking_number, tracking_carrier,
    created_at
  ) values
  -- (a) paid — ATM 已對到帳，等備貨
  ('aaaaaaaa-0001-0000-0000-000000000001',
   'TEST-260503100000-001', '11111',
   '697d30d9-ff0a-4aa4-8302-8e8deb98e130',
   'paid', 'not_shipped',
   168000, 0, 168000,
   '林希哲', '0987654321', 'scterry0327@gmail.com', '台北市信義區信義路 5 段 7 號 89 樓',
   '已收款備貨中', null, null,
   now() - interval '5 days'),

  -- (b) preparing — 已付款 + 備貨中
  ('aaaaaaaa-0002-0000-0000-000000000002',
   'TEST-260504100000-002', '22222',
   null,
   'preparing', 'preparing',
   206000, 0, 206000,
   '陳大文', '0912345678', 'guest1@example.com', '新北市板橋區文化路一段 100 號',
   null, null, null,
   now() - interval '3 days'),

  -- (c) shipped — 已寄出，有 tracking
  ('aaaaaaaa-0003-0000-0000-000000000003',
   'TEST-260504200000-003', '33333',
   '20f1fa22-e68c-4132-a65b-7282b6a4f957',
   'shipped', 'shipped',
   188000, 0, 188000,
   'terry19990327', '0922888888', 'terry19990327@gmail.com', '桃園市中壢區中央西路 200 號',
   '希望週二前到', '912345678901', '黑貓宅急便',
   now() - interval '7 days'),

  -- (d) completed — 已收件，已完成
  ('aaaaaaaa-0004-0000-0000-000000000004',
   'TEST-260420100000-004', '44444',
   '697d30d9-ff0a-4aa4-8302-8e8deb98e130',
   'completed', 'delivered',
   136000, 0, 136000,
   '林希哲', '0987654321', 'scterry0327@gmail.com', '台北市信義區信義路 5 段 7 號 89 樓',
   null, '987654321098', '7-11 取貨',
   now() - interval '21 days'),

  -- (e) cancelled — admin 取消（客戶反悔、缺貨等）
  ('aaaaaaaa-0005-0000-0000-000000000005',
   'TEST-260415100000-005', '55555',
   null,
   'cancelled', 'not_shipped',
   78000, 8000, 86000,
   '王小美', '0933444555', 'guest2@example.com', '台中市西屯區台灣大道三段 99 號',
   '客戶來信要求取消', null, null,
   now() - interval '30 days'),

  -- (f) refunded — 已退款（客戶收件後不滿意退貨）
  ('aaaaaaaa-0006-0000-0000-000000000006',
   'TEST-260408100000-006', '66666',
   null,
   'refunded', 'returned',
   168000, 0, 168000,
   '李志明', '0966777888', 'guest3@example.com', '高雄市苓雅區四維三路 6 號',
   '收到後反悔，退貨退款', '111222333444', '黑貓宅急便',
   now() - interval '40 days'),

  -- (g) 另一筆 pending_payment（未來會成 paid，順便壓今日報表）
  ('aaaaaaaa-0007-0000-0000-000000000007',
   'TEST-260505100000-007', '77777',
   null,
   'pending_payment', 'not_shipped',
   238000, 0, 238000,
   '張小英', '0955666777', 'guest4@example.com', '台南市東區東門路二段 158 號',
   null, null, null,
   now() - interval '6 hours')
  returning id
)
select count(*) from test_orders;

-- ---------------------------------------------------------------------------
-- 3. Order items — 配對 7 張 order 各買 1-2 件（用真實商品 ID）
-- ---------------------------------------------------------------------------

-- 用 slug subquery 帶實際 product_id + price，order subtotal/total 由
-- 下一段 update 重算對齊 order_items 加總（避免硬寫死數字算錯）。

insert into order_items (order_id, product_id, product_name, unit_price_cents, quantity, subtotal_cents)
select o.order_id, p.id, p.name, p.price_cents, 1, p.price_cents
from products p
join (values
  ('aaaaaaaa-0001-0000-0000-000000000001'::uuid, 'sunglass-round-gold'),
  ('aaaaaaaa-0002-0000-0000-000000000002'::uuid, 'sunglass-aviator-gold'),
  ('aaaaaaaa-0002-0000-0000-000000000002'::uuid, 'reading-panda-round'),
  ('aaaaaaaa-0003-0000-0000-000000000003'::uuid, 'sunglass-aviator-gold'),
  ('aaaaaaaa-0003-0000-0000-000000000003'::uuid, 'reading-clear-round'),
  ('aaaaaaaa-0004-0000-0000-000000000004'::uuid, 'sunglass-classic-black'),
  ('aaaaaaaa-0005-0000-0000-000000000005'::uuid, 'reading-clear-round'),
  ('aaaaaaaa-0006-0000-0000-000000000006'::uuid, 'sunglass-round-gold'),
  ('aaaaaaaa-0007-0000-0000-000000000007'::uuid, 'sunglass-aviator-gold'),
  ('aaaaaaaa-0007-0000-0000-000000000007'::uuid, 'reading-metal-rect')
) as o(order_id, slug) on o.slug = p.slug;


-- ---------------------------------------------------------------------------
-- 3.5 修正 order subtotal/total 對齊 order_items 加總
-- ---------------------------------------------------------------------------

update orders o set
  subtotal_cents = sum_items.s,
  total_cents    = sum_items.s + o.shipping_fee_cents
from (
  select order_id, sum(subtotal_cents)::int as s
  from order_items
  where order_id::text like 'aaaaaaaa-%'
  group by order_id
) as sum_items
where o.id = sum_items.order_id;

-- ---------------------------------------------------------------------------
-- 4. Appointments — 6 種情境（booked future / completed / noshow / cancelled）
-- ---------------------------------------------------------------------------

-- 用 CTE 把今天 14:00 / 3 天後 14:00 / 過去日的 slot 找出來
-- (今天 14:00 booked_count 已加上去)

insert into appointments (
  id, slot_id, user_id, customer_name, customer_email, customer_phone,
  frame_product_id, status, note, cancel_token, created_at
)
-- (a) booked — 今天 14:00（slot 已 booked_count++）
select 'bbbbbbbb-0001-0000-0000-000000000001'::uuid,
       s.id,
       '697d30d9-ff0a-4aa4-8302-8e8deb98e130'::uuid,
       '林希哲', 'scterry0327@gmail.com', '0987654321',
       (select id from products where slug = 'rx-classic-tortoise'),
       'booked', '想配新的近視眼鏡', md5(random()::text || clock_timestamp()::text),
       now() - interval '2 hours'
from appointment_slots s
where s.date = current_date and s.start_time = '14:00:00'
union all
-- (b) booked — 3 天後 14:00（會自動 increment booked_count via update）
select 'bbbbbbbb-0002-0000-0000-000000000002'::uuid,
       s.id,
       null,
       '陳大文', 'guest1@example.com', '0912345678',
       (select id from products where slug = 'rx-modern-titanium'),
       'booked', '想看鈦金屬款', md5(random()::text || clock_timestamp()::text),
       now() - interval '1 day'
from appointment_slots s
where s.date = current_date + interval '3 days' and s.start_time = '14:00:00'
union all
-- (c) booked — 5 天後 18:00（家長帶小孩配鏡）
select 'bbbbbbbb-0003-0000-0000-000000000003'::uuid,
       s.id,
       null,
       '王小美 (媽媽)', 'guest2@example.com', '0933444555',
       (select id from products where slug = 'rx-kids-flexible'),
       'booked', '小孩 8 歲，想看兒童彈性款', md5(random()::text || clock_timestamp()::text),
       now() - interval '12 hours'
from appointment_slots s
where s.date = current_date + interval '5 days' and s.start_time = '18:00:00';

-- 同步 booked_count（給上面 +3 個 booked appointment 對應的 slot）
update appointment_slots s set booked_count = booked_count + 1
where (s.date, s.start_time) in (
  (current_date + interval '3 days', '14:00:00'),
  (current_date + interval '5 days', '18:00:00')
)
  and s.booked_count < s.capacity;

-- (d) completed — 過去 14 天前到店完成（不需 slot 連動，直接 insert）
-- 用過去某 slot 或新建 — 直接用過去任意 slot id；先建 historical slot
insert into appointment_slots (id, date, start_time, end_time, capacity, booked_count, is_active)
values
  ('cccccccc-0001-0000-0000-000000000001', current_date - interval '14 days', '10:00:00', '11:00:00', 1, 1, true),
  ('cccccccc-0002-0000-0000-000000000002', current_date - interval '21 days', '14:00:00', '15:00:00', 1, 1, true),
  ('cccccccc-0003-0000-0000-000000000003', current_date - interval '7 days',  '18:00:00', '19:00:00', 1, 1, true)
on conflict (id) do nothing;

insert into appointments (
  id, slot_id, user_id, customer_name, customer_email, customer_phone,
  frame_product_id, status, note, cancel_token, created_at
) values
('bbbbbbbb-0004-0000-0000-000000000004', 'cccccccc-0001-0000-0000-000000000001',
 '20f1fa22-e68c-4132-a65b-7282b6a4f957',
 'terry19990327', 'terry19990327@gmail.com', '0922888888',
 (select id from products where slug = 'rx-modern-titanium'),
 'completed', '已配鏡完成', md5(random()::text || clock_timestamp()::text),
 (current_date - interval '15 days')::timestamptz),

('bbbbbbbb-0005-0000-0000-000000000005', 'cccccccc-0002-0000-0000-000000000002',
 null,
 '李志明', 'guest3@example.com', '0966777888',
 (select id from products where slug = 'rx-classic-tortoise'),
 'noshow', '當天未到', md5(random()::text || clock_timestamp()::text),
 (current_date - interval '22 days')::timestamptz),

('bbbbbbbb-0006-0000-0000-000000000006', 'cccccccc-0003-0000-0000-000000000003',
 '697d30d9-ff0a-4aa4-8302-8e8deb98e130',
 '林希哲', 'scterry0327@gmail.com', '0987654321',
 (select id from products where slug = 'rx-business-bold'),
 'cancelled', '臨時有事', md5(random()::text || clock_timestamp()::text),
 (current_date - interval '8 days')::timestamptz);

-- ---------------------------------------------------------------------------
-- 5. Prescriptions — 林希哲 2 筆驗光紀錄（看歷程）
-- ---------------------------------------------------------------------------

insert into prescriptions (
  id, customer_id, exam_date,
  right_sphere, right_cylinder, right_axis, right_add,
  left_sphere, left_cylinder, left_axis, left_add,
  pd, notes
) values
('dddddddd-0001-0000-0000-000000000001',
 '697d30d9-ff0a-4aa4-8302-8e8deb98e130', current_date - interval '180 days',
 -2.50, -0.75, 90, 0.00,
 -2.75, -0.50, 85, 0.00,
 62, '初診紀錄'),
('dddddddd-0002-0000-0000-000000000002',
 '697d30d9-ff0a-4aa4-8302-8e8deb98e130', current_date - interval '14 days',
 -2.75, -0.75, 90, 0.00,
 -3.00, -0.50, 85, 0.00,
 62, '半年回診，度數略增 0.25')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Wishlist — 林希哲收藏 3 件
-- ---------------------------------------------------------------------------

insert into wishlist_items (customer_id, product_id) values
('697d30d9-ff0a-4aa4-8302-8e8deb98e130', (select id from products where slug = 'rx-japan-thin-round')),
('697d30d9-ff0a-4aa4-8302-8e8deb98e130', (select id from products where slug = 'sunglass-classic-black')),
('697d30d9-ff0a-4aa4-8302-8e8deb98e130', (select id from products where slug = 'reading-clear-round'))
on conflict (customer_id, product_id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Marketing campaigns — 3 種狀態（draft / scheduled / sent）
-- ---------------------------------------------------------------------------

insert into marketing_campaigns (
  id, subject, body, status,
  scheduled_at, sent_at,
  recipient_count, success_count, error_count,
  created_by, created_at
) values
('eeeeeeee-0001-0000-0000-000000000001',
 '春季新款上市，限定 9 折',
 '<p>嗨，</p><p>春日新款鏡架到貨了，這個月來店配鏡享 9 折 — 包含驗光、鏡架、鏡片。</p><p><a href="https://nexbuy-web.vercel.app/products?kind=prescription_frame">看新款</a></p>',
 'draft', null, null, 0, 0, 0,
 'a8367b92-7186-4a60-95df-8b47e77b66df',
 now() - interval '2 days'),

('eeeeeeee-0002-0000-0000-000000000002',
 '中秋連假快閃 — 太陽眼鏡 8 折',
 '<p>嗨，</p><p>中秋連假快閃 3 天，所有太陽眼鏡 8 折！</p><p><a href="https://nexbuy-web.vercel.app/products?kind=finished">看太陽眼鏡</a></p>',
 'scheduled',
 now() + interval '14 days', null, 0, 0, 0,
 'a8367b92-7186-4a60-95df-8b47e77b66df',
 now() - interval '1 day'),

('eeeeeeee-0003-0000-0000-000000000003',
 '回門市做免費鏡架調整',
 '<p>嗨，</p><p>春暖花開，記得回店做免費鏡架調整 — 鼻墊、鏡腿、清洗都包，半年內買的免費。</p>',
 'sent',
 null, now() - interval '30 days',
 1, 1, 0,
 'a8367b92-7186-4a60-95df-8b47e77b66df',
 now() - interval '32 days')
on conflict (id) do nothing;
