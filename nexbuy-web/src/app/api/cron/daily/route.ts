// 每日合併 cron — Vercel Hobby 方案 cron 限額 2 顆，所以把
// appointment-reminder + low-stock-alert 合進這支單一 daily 入口。
//
// Cron schedule（vercel.json）：
//   { "path": "/api/cron/daily", "schedule": "0 2 * * *" }
// 02:00 UTC = 10:00 Asia/Taipei.
//
// Auth：跟其他 cron route 一致 — `Authorization: Bearer ${CRON_SECRET}`。

import { NextResponse, type NextRequest } from "next/server";
import { runAppointmentReminder } from "@/lib/cron/appointment-reminder";
import { runLowStockAlert } from "@/lib/cron/low-stock-alert";
import { withCronLogging } from "@/lib/cron/log";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !expected) {
    console.error("[cron/daily] CRON_SECRET missing in production — refusing.");
    return NextResponse.json({ error: "MISCONFIGURED" }, { status: 500 });
  }
  if (expected) {
    const got = request.headers.get("authorization");
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  // 兩個任務獨立、不互相依賴 — 並行跑省時間。
  // allSettled：一支 throw 不會把另一支拖下水，個別在 Vercel logs 看得到。
  const [appointmentRes, lowStockRes] = await Promise.allSettled([
    withCronLogging("appointment-reminder", () => runAppointmentReminder()),
    withCronLogging("low-stock-alert", () => runLowStockAlert()),
  ]);

  const anyFailed =
    appointmentRes.status === "rejected" || lowStockRes.status === "rejected";

  return NextResponse.json(
    {
      ok: !anyFailed,
      appointment_reminder:
        appointmentRes.status === "fulfilled"
          ? appointmentRes.value
          : { error: String(appointmentRes.reason) },
      low_stock_alert:
        lowStockRes.status === "fulfilled"
          ? lowStockRes.value
          : { error: String(lowStockRes.reason) },
    },
    { status: anyFailed ? 500 : 200 },
  );
}
