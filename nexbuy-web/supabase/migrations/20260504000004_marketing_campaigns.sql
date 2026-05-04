-- Phase 6 PR 3：marketing email blasts。
--
-- 一個 row = 一封要寄給所有「marketing_opt_in=true」客戶的活動信。
--
-- 設計選擇：
-- - 不另外建 marketing_sends 細表（per-recipient log）— MVP 只要彙總計數，
--   失敗的個別 customer log 寫到 console.error 就好
-- - body 直接存 HTML（admin 自己輸入 / 由 sender 端 wrap 成 transactional
--   email 樣板）；之後若要加 markdown 編輯器再轉 HTML 也行
-- - status 流程：draft → scheduled → sending → sent (或 cancelled)
--   draft / scheduled 都可以改回 draft 重編
-- - scheduled_at 在 status='scheduled' 時必填；其他狀態可空
-- - sent_at 在 status='sent' 時填

set search_path = public;

create table marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 50000),
  status text not null default 'draft' check (status in (
    'draft', 'scheduled', 'sending', 'sent', 'cancelled'
  )),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marketing_scheduled_idx on marketing_campaigns(scheduled_at)
  where status = 'scheduled';

create trigger marketing_campaigns_updated_at before update on marketing_campaigns
  for each row execute function set_updated_at();

-- RLS：admin only
alter table marketing_campaigns enable row level security;

create policy marketing_admin_all on marketing_campaigns
  for all using (is_admin()) with check (is_admin());
