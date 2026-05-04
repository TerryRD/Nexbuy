// 低庫存 digest 的純邏輯。被 /api/cron/low-stock-alert 與 /api/cron/daily 共用。

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

export interface LowStockAlertResult {
  ok: true;
  date: string;
  low_stock_count: number;
  sent: boolean;
  recipients?: number;
  reason?: string;
}

export async function runLowStockAlert(): Promise<
  LowStockAlertResult | { ok: false; error: string }
> {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const admin = createAdminSupabase();

  const { data, error } = await admin
    .from("products")
    .select("id, slug, name, finished_stock, low_stock_threshold")
    .eq("kind", "finished")
    .eq("is_online_available", true)
    .order("finished_stock", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[cron/low-stock] product query failed:", error);
    return { ok: false, error: "INTERNAL" };
  }

  const products = (data ?? []) as ProductRow[];
  const lows = products.filter(
    (p) => p.finished_stock < p.low_stock_threshold,
  );

  if (lows.length === 0) {
    return { ok: true, date: today, low_stock_count: 0, sent: false };
  }

  const { ADMIN_EMAIL } = getServerEnv();
  const recipients = parseEmailList(ADMIN_EMAIL);

  if (!isEmailConfigured() || recipients.length === 0) {
    console.warn(
      `[cron/low-stock] 找到 ${lows.length} 項低庫存，但缺 email 設定或 ADMIN_EMAIL — skip 寄信`,
    );
    return {
      ok: true,
      date: today,
      low_stock_count: lows.length,
      sent: false,
      reason: "email-not-configured",
    };
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
    return { ok: false, error: "EMAIL_SEND_FAILED" };
  }

  return {
    ok: true,
    date: today,
    low_stock_count: lows.length,
    sent: true,
    recipients: recipients.length,
  };
}
