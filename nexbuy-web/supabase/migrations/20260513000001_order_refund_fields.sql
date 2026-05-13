-- 退款追蹤：記錄退款金額、方式、備註、時間。
-- 與 orders.status = 'refunded' 搭配使用。
-- cancelled_at 同理（訂單取消時間）。

set search_path = public;

alter table orders
  add column if not exists refund_amount_cents  integer,
  add column if not exists refund_method        text,
  add column if not exists refund_note          text,
  add column if not exists refunded_at          timestamptz,
  add column if not exists cancelled_at         timestamptz;
