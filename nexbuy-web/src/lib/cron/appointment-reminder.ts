// 預約 T-24h 提醒的純邏輯。被 /api/cron/appointment-reminder 與 /api/cron/daily
// 共用（Vercel Hobby 方案 cron 限額 2 顆，所以合併到 daily 一顆）。

import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendEmail, isEmailConfigured } from "@/lib/email/send";
import { appointmentReminderEmail } from "@/lib/email/templates";
import { formatDate, formatTime } from "@/lib/format";
import { publicEnv } from "@/lib/env";

interface AppointmentRow {
  id: string;
  customer_name: string;
  customer_email: string;
  cancel_token: string;
  slot: { date: string; start_time: string; end_time: string } | null;
  frame: { name: string } | null;
}

export interface AppointmentReminderResult {
  ok: true;
  date: string;
  candidates: number;
  reminders_sent: number;
}

export async function runAppointmentReminder(): Promise<
  AppointmentReminderResult | { ok: false; error: string }
> {
  // "Tomorrow" in Asia/Taipei
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowTW = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  const admin = createAdminSupabase();

  const { data: slotIds, error: slotErr } = await admin
    .from("appointment_slots")
    .select("id")
    .eq("date", tomorrowTW);

  if (slotErr) {
    console.error("[cron/appointment] slot lookup failed:", slotErr);
    return { ok: false, error: "INTERNAL" };
  }

  const ids = (slotIds ?? []).map((s) => s.id);
  if (ids.length === 0) {
    return { ok: true, date: tomorrowTW, candidates: 0, reminders_sent: 0 };
  }

  const { data: rows, error: apptErr } = await admin
    .from("appointments")
    .select(
      `
      id, customer_name, customer_email, cancel_token,
      slot:appointment_slots ( date, start_time, end_time ),
      frame:products ( name )
    `,
    )
    .in("slot_id", ids)
    .eq("status", "booked")
    .is("reminder_sent_at", null);

  if (apptErr) {
    console.error("[cron/appointment] appointment query failed:", apptErr);
    return { ok: false, error: "INTERNAL" };
  }

  const appointments = (rows ?? []) as unknown as AppointmentRow[];
  let sent = 0;

  for (const a of appointments) {
    if (!a.slot) continue;
    const cancelUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/appointment/${a.cancel_token}`;
    const to = [a.customer_email];

    if (!isEmailConfigured() || to.length === 0) {
      console.warn("[cron/appointment] 未寄 email (缺 email 設定 或 收件人)");
    } else {
      const content = appointmentReminderEmail({
        customerName: a.customer_name,
        appointmentDate: formatDate(a.slot.date),
        appointmentTime: `${formatTime(a.slot.start_time)} – ${formatTime(a.slot.end_time)}`,
        frameName: a.frame?.name ?? null,
        cancelUrl,
      });
      try {
        await sendEmail({ to, ...content });
      } catch (err) {
        console.error("[cron/appointment] 寄信失敗:", err);
      }
    }

    const { error: markErr } = await admin
      .from("appointments")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", a.id);
    if (markErr) {
      console.error(
        `[cron/appointment] mark reminder_sent_at for ${a.id} failed:`,
        markErr,
      );
      continue;
    }
    sent += 1;
  }

  return {
    ok: true,
    date: tomorrowTW,
    candidates: appointments.length,
    reminders_sent: sent,
  };
}
