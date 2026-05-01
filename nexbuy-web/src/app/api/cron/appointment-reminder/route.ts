// Daily T-24h appointment reminder — invoked by Vercel Cron.
//
// Cron schedule lives in nexbuy-web/vercel.json:
//   { "path": "/api/cron/appointment-reminder", "schedule": "0 2 * * *" }
// 02:00 UTC = 10:00 Asia/Taipei. Sends a reminder for every appointment
// scheduled for the *next* calendar day (tomorrow) that hasn't been
// reminded yet.
//
// Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}` when a CRON_SECRET
// env var exists. The route refuses requests that don't match.
// - In production CRON_SECRET is REQUIRED. If unset the route returns 500
//   (fail-closed) so a missing env var can never silently expose the endpoint.
// - In local dev (NODE_ENV !== "production") an unset CRON_SECRET leaves the
//   route open — convenient for testing and nothing's exposed publicly.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
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

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !expected) {
    console.error("[cron] CRON_SECRET missing in production — refusing.");
    return NextResponse.json({ error: "MISCONFIGURED" }, { status: 500 });
  }

  if (expected) {
    const got = request.headers.get("authorization");
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  // "Tomorrow" in Asia/Taipei. We compute the date string in JS — Postgres
  // would also work but the cron runs on Vercel's UTC machine, so do the
  // tz math here for clarity.
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowTW = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);  // "2026-04-20"

  const admin = createAdminSupabase();

  // First find slots that fall on tomorrow (TW), then pull appointments whose
  // slot is in that set + status booked + not yet reminded.
  const { data: slotIds, error: slotErr } = await admin
    .from("appointment_slots")
    .select("id")
    .eq("date", tomorrowTW);

  if (slotErr) {
    console.error("[cron] slot lookup failed:", slotErr);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  const ids = (slotIds ?? []).map((s) => s.id);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, reminders_sent: 0, date: tomorrowTW });
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
    console.error("[cron] appointment query failed:", apptErr);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  const appointments = (rows ?? []) as unknown as AppointmentRow[];
  let sent = 0;

  for (const a of appointments) {
    if (!a.slot) continue;
    const cancelUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/appointment/${a.cancel_token}`;
    // Send + mark in parallel. Mark even if email logically failed (sendEmail
    // never throws) to avoid retry storms; Resend's own retry handles flakes.
    await sendEmail(
      appointmentReminderEmail({
        to: a.customer_email,
        customerName: a.customer_name,
        appointmentDate: formatDate(a.slot.date),
        appointmentTime: `${formatTime(a.slot.start_time)} – ${formatTime(a.slot.end_time)}`,
        frameName: a.frame?.name ?? null,
        cancelUrl,
      }),
    );
    const { error: markErr } = await admin
      .from("appointments")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", a.id);
    if (markErr) {
      console.error(`[cron] mark reminder_sent_at for ${a.id} failed:`, markErr);
      continue;
    }
    sent += 1;
  }

  return NextResponse.json({
    ok: true,
    date: tomorrowTW,
    candidates: appointments.length,
    reminders_sent: sent,
  });
}
