// 預約 T-24h 提醒 — 邏輯抽到 lib/cron/appointment-reminder.ts，
// daily 合併 cron 也用同一支。本 route 保留供手動觸發 / 監控。
//
// Auth：Vercel 設 CRON_SECRET 後 `Authorization: Bearer ${CRON_SECRET}` 才放行；
// prod 缺 CRON_SECRET 直接 500 (fail-closed)。

import { NextResponse, type NextRequest } from "next/server";
import { runAppointmentReminder } from "@/lib/cron/appointment-reminder";

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

  const result = await runAppointmentReminder();
  if ("error" in result) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
