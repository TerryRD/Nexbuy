-- 補幾個有具體 query justification 的 index。MVP 流量小、資料量少，這些
-- 加上去當下不會有可測量的 perf 改善；目的是「以後流量上來不用再補」。
-- 偏少不偏多 — 多 index 會拖 write、占空間，所以只挑使用頻率高且現有
-- index 沒覆蓋到的。
--
-- audit 過後沒加的（覆蓋不足但流量太小不值得）：
--   - products(deleted_at) — admin list filter，現有 ~10 列，seq scan 一定快
--   - customers(marketing_opt_in)=true — dispatch query，~3 列
--   - appointments(customer_email) — guest 查詢路徑沒走這個欄位
--   - prescriptions(customer_id, exam_date desc) — customer detail 聚合，量小
--
-- 已有但仍記在這當 reference：
--   - orders(status) partial WHERE status in ('pending_payment','paid')
--   - marketing_campaigns(scheduled_at) partial WHERE status='scheduled'
--   - products(kind) partial WHERE is_online_available

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. marketing_campaigns: 「今日已寄 N / 3 顆」daily cap query
-- ---------------------------------------------------------------------------
-- query: WHERE status = 'sent' AND sent_at >= today_start
-- 出現在：admin/marketing/page.tsx + dispatch.ts (每次寄送前都跑一次)
-- 現有 marketing_scheduled_idx 是 status='scheduled' partial — 不能用。

create index if not exists marketing_sent_idx
  on marketing_campaigns (sent_at desc)
  where status = 'sent';

-- ---------------------------------------------------------------------------
-- 2. orders: 報表 + admin 列表時間範圍掃描
-- ---------------------------------------------------------------------------
-- query: WHERE created_at >= from AND created_at < to (報表)
-- query: ORDER BY created_at DESC LIMIT 100/200 (admin orders list)
-- 現有 orders_pkey 是 id（uuid，不能拿來 sort 時間）。
-- created_at 索引也會幫到 reports 那種大範圍掃描。

create index if not exists orders_created_at_idx
  on orders (created_at desc);
