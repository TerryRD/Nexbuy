-- Fix: book_appointment RPC 之前 set search_path = public 把 extensions 排除掉，
-- gen_random_bytes 屬於 pgcrypto extension，在 CI / fresh DB 直接報 "function
-- gen_random_bytes does not exist"。
--
-- 修法：直接 schema-qualify 成 extensions.gen_random_bytes(16)，避免再受 search_path
-- 影響。RPC 其他邏輯不變，繼續 set search_path = public 保持安全。
--
-- production / dev 之前能跑只是運氣好（環境 search_path 預設就有 extensions），
-- 補上這條後不論 fresh / 既有 DB 都穩。

set search_path = public;

create or replace function book_appointment(
  p_slot_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_frame_product_id uuid default null,
  p_user_id uuid default null,
  p_note text default null
)
returns table(appointment_id uuid, cancel_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_updated uuid;
  v_appointment_id uuid;
  v_cancel_token text;
begin
  -- SEC-001 guard：擋直接打 RPC 偽造他人 user_id
  perform ensure_user_id_matches_caller(p_user_id);

  -- Atomic increment; 如果滿了 WHERE 不匹配，v_slot_updated 會是 null
  update appointment_slots
  set booked_count = booked_count + 1
  where id = p_slot_id
    and is_active = true
    and booked_count < capacity
    and date >= current_date
  returning id into v_slot_updated;

  if v_slot_updated is null then
    raise exception 'SLOT_FULL' using errcode = 'P0001';
  end if;

  -- cancel_token: 32-char hex；schema-qualify pgcrypto 避免 search_path 問題
  v_cancel_token := encode(extensions.gen_random_bytes(16), 'hex');

  insert into appointments (
    slot_id, user_id, customer_name, customer_email, customer_phone,
    frame_product_id, note, cancel_token
  ) values (
    p_slot_id, p_user_id, p_customer_name, p_customer_email, p_customer_phone,
    p_frame_product_id, p_note, v_cancel_token
  )
  returning id into v_appointment_id;

  return query select v_appointment_id, v_cancel_token;
end;
$$;

grant execute on function book_appointment to anon, authenticated;
