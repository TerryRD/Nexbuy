// 低庫存 digest — 邏輯抽到 lib/cron/low-stock-alert.ts；daily 合併 cron 也用
// 同一支。本 route 保留供手動觸發 / 監控。
//
// Auth：跟 appointment-reminder 同一套 — `Authorization: Bearer ${CRON_SECRET}`。

import { NextResponse, type NextRequest } from "next/server";
import { runLowStockAlert } from "@/lib/cron/low-stock-alert";
import { withCronLogging } from "@/lib/cron/log";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !expected) {
    console.error("[cron/low-stock] CRON_SECRET missing in production — refusing.");
    return NextResponse.json({ error: "MISCONFIGURED" }, { status: 500 });
  }
  if (expected) {
    const got = request.headers.get("authorization");
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  try {
    const result = await withCronLogging("low-stock-alert", () =>
      runLowStockAlert(),
    );
    if ("error" in result) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
