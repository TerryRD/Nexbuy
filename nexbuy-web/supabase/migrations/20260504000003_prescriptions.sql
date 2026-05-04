-- Phase 6 PR 2：驗光紀錄。每個客戶可有多筆 RX（每次驗光一筆）。
-- admin 在後台輸入，客戶在 /account/prescriptions 唯讀。
--
-- 設計選擇：
-- - 各眼 4 欄 numeric(4,2)：度數常見格式 ±20.00（球面）/ ±10.00（散光）/
--   軸度 0-180（整數，但用 numeric 統一型別、CHECK 限制）
-- - PD: 整數 mm；mono PD（左右分別）以後再加，現在先一個總 PD
-- - exam_date 必填（驗光日，與 created_at 區別 — admin 可能補登舊紀錄）
-- - 不存光學中心高度 / 棱鏡 — 多焦點才用，超出 MVP scope

set search_path = public;

create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users on delete cascade,
  exam_date date not null,

  right_sphere numeric(4,2) check (right_sphere is null or (right_sphere >= -30 and right_sphere <= 30)),
  right_cylinder numeric(4,2) check (right_cylinder is null or (right_cylinder >= -10 and right_cylinder <= 10)),
  right_axis integer check (right_axis is null or (right_axis >= 0 and right_axis <= 180)),
  right_add numeric(4,2) check (right_add is null or (right_add >= 0 and right_add <= 5)),

  left_sphere numeric(4,2) check (left_sphere is null or (left_sphere >= -30 and left_sphere <= 30)),
  left_cylinder numeric(4,2) check (left_cylinder is null or (left_cylinder >= -10 and left_cylinder <= 10)),
  left_axis integer check (left_axis is null or (left_axis >= 0 and left_axis <= 180)),
  left_add numeric(4,2) check (left_add is null or (left_add >= 0 and left_add <= 5)),

  pd integer check (pd is null or (pd >= 40 and pd <= 90)),
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prescriptions_customer_idx on prescriptions(customer_id, exam_date desc);

create trigger prescriptions_updated_at before update on prescriptions
  for each row execute function set_updated_at();

-- RLS
alter table prescriptions enable row level security;

create policy prescriptions_owner_read on prescriptions
  for select using (auth.uid() = customer_id or is_admin());

create policy prescriptions_admin_insert on prescriptions
  for insert with check (is_admin());

create policy prescriptions_admin_update on prescriptions
  for update using (is_admin()) with check (is_admin());

create policy prescriptions_admin_delete on prescriptions
  for delete using (is_admin());
