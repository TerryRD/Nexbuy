-- admin 代客取消預約。
--
-- 既有的 cancel_appointment(p_cancel_token) 只接 token，admin 沒有 token。
-- 加一個 admin-only RPC：用 appointment_id 取消，順便把 slot 的
-- booked_count 釋放回去。RLS / role 檢查在 RPC 內做，避免被 anon 呼叫。

set search_path = public;

create or replace function admin_cancel_appointment(p_appointment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_id uuid;
  v_status text;
begin
  if not is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select slot_id, status into v_slot_id, v_status
  from appointments
  where id = p_appointment_id;

  if v_slot_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_status = 'cancelled' then
    -- idempotent
    return true;
  end if;

  if v_status != 'booked' then
    raise exception 'CANNOT_CANCEL' using errcode = 'P0003';
  end if;

  update appointments
  set status = 'cancelled', cancelled_at = now()
  where id = p_appointment_id and status = 'booked';

  update appointment_slots
  set booked_count = greatest(0, booked_count - 1)
  where id = v_slot_id;

  return true;
end;
$$;

grant execute on function admin_cancel_appointment to authenticated;
