// 每日跑一次：撈出 status='scheduled' 且 scheduled_at <= now 的活動，
// 用 dispatchCampaign 寄送（內含 status CAS 鎖防止 race）。
//
// Cron schedule lives in nexbuy-web/vercel.json:
//   { "path": "/api/cron/marketing-dispatch", "schedule": "30 2 * * *" }
// 02:30 UTC = 10:30 Asia/Taipei.
//
// 注意：Vercel Hobby 方案 cron 限額 2 顆且只能 daily。「排程寄送」精度
// 因此降為 1 天。立即寄送 (sendNowAction) 不受影響。
//
// 每次最多處理 5 顆活動 — 如果 backlog 多，下一次 cron 會繼續。

import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { dispatchCampaign } from "@/app/admin/(protected)/marketing/dispatch";
import { withCronLogging } from "@/lib/cron/log";

const MAX_PER_RUN = 5;

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !expected) {
    console.error("[cron/marketing] CRON_SECRET missing in production — refusing.");
    return NextResponse.json({ error: "MISCONFIGURED" }, { status: 500 });
  }
  if (expected) {
    const got = request.headers.get("authorization");
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  try {
    const result = await withCronLogging("marketing-dispatch", async () => {
      const admin = createAdminSupabase();
      const nowIso = new Date().toISOString();

      const { data, error } = await admin
        .from("marketing_campaigns")
        .select("id")
        .eq("status", "scheduled")
        .lte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true })
        .limit(MAX_PER_RUN);

      if (error) {
        throw new Error("campaigns query failed: " + error.message);
      }

      const due = data ?? [];
      if (due.length === 0) {
        return { dispatched: 0, results: [] };
      }

      const results = [];
      for (const c of due) {
        const r = await dispatchCampaign(c.id as string);
        results.push({ id: c.id, ...r });
      }
      return { dispatched: results.length, results };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
