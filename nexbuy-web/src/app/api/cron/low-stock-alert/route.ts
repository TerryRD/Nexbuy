// Daily low-stock digest — invoked by Vercel Cron.
//
// Cron schedule lives in nexbuy-web/vercel.json:
//   { "path": "/api/cron/low-stock-alert", "schedule": "30 2 * * *" }
// 02:30 UTC = 10:30 Asia/Taipei. 比 appointment-reminder 晚 30 分鐘，避開
// 同一時刻 cold-start 競爭。
//
// 寄一封 digest 給 ADMIN_EMAIL（comma-separated）列出所有
// finished_stock < low_stock_threshold 的上架成品。
//
// Auth：跟 appointment-reminder 同一套 — Vercel 設 CRON_SECRET 後
// `Authorization: Bearer ${CRON_SECRET}` 才放行；prod 缺 CRON_SECRET 直接
// 500 (fail-closed)；dev 沒設可以裸打方便本機驗證。

import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  sendEmail,
  isEmailConfigured,
  parseEmailList,
} from "@/lib/email/send";
import { lowStockAlertEmail } from "@/lib/email/templates";
import { getServerEnv, publicEnv } from "@/lib/env";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  finished_stock: number;
  low_stock_threshold: number;
}

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

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const admin = createAdminSupabase();

  // 撈所有上架成品鏡架，JS 端篩 finished_stock < low_stock_threshold。
  // 商品數小（MVP 量級），SQL 端做欄位 vs 欄位比較需要 RPC，此 trade-off
  // 偏向簡單。
  const { data, error } = await admin
    .from("products")
    .select("id, slug, name, finished_stock, low_stock_threshold")
    .eq("kind", "finished")
    .eq("is_online_available", true)
    .order("finished_stock", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[cron/low-stock] product query failed:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }

  const products = (data ?? []) as ProductRow[];
  const lows = products.filter(
    (p) => p.finished_stock < p.low_stock_threshold,
  );

  if (lows.length === 0) {
    return NextResponse.json({ ok: true, date: today, low_stock_count: 0 });
  }

  const { ADMIN_EMAIL } = getServerEnv();
  const recipients = parseEmailList(ADMIN_EMAIL);

  if (!isEmailConfigured() || recipients.length === 0) {
    console.warn(
      `[cron/low-stock] 找到 ${lows.length} 項低庫存，但缺 email 設定 (RESEND/SMTP) 或 ADMIN_EMAIL — skip 寄信`,
    );
    return NextResponse.json({
      ok: true,
      date: today,
      low_stock_count: lows.length,
      sent: false,
      reason: "email-not-configured",
    });
  }

  const content = lowStockAlertEmail({
    date: today,
    items: lows.map((p) => ({
      name: p.name,
      finishedStock: p.finished_stock,
      threshold: p.low_stock_threshold,
      adminUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/admin/products`,
    })),
  });

  try {
    await sendEmail({ to: recipients, ...content });
  } catch (err) {
    console.error("[cron/low-stock] 寄信失敗:", err);
    return NextResponse.json(
      { ok: false, error: "EMAIL_SEND_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    date: today,
    low_stock_count: lows.length,
    sent: true,
    recipients: recipients.length,
  });
}
