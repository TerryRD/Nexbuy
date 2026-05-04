import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendEmail, isEmailConfigured } from "@/lib/email/send";

// 共用：把指定 campaign 寄給所有 marketing_opt_in=true 的客戶。
// 由 sendNowAction 與 cron 兩個入口呼叫。
//
// 重要：用 admin client（service role）— marketing_campaigns 表有 admin-only
// RLS，但 cron 跑時沒 user session，必須繞過。

export interface DispatchResult {
  ok: boolean;
  recipient_count: number;
  success_count: number;
  error_count: number;
  reason?: string;
}

const SUBJECT_PREFIX = "[精鋐眼鏡行] ";

const HTML_WRAPPER_OPEN = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  </head>
  <body style="margin:0;padding:0;background:#f6f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Noto Sans TC',sans-serif;color:#2b231b;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f1ea;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#fffcf7;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0;font-size:14px;color:#7a6856;letter-spacing:0.04em;">精鋐眼鏡行</td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;font-size:15px;line-height:1.7;color:#2b231b;">`;

const HTML_WRAPPER_CLOSE = `              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;border-top:1px solid #ece4d6;font-size:12px;color:#9a8c79;">
                你會收到這封信是因為你在訂購 / 預約時選擇接收電子報。
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export async function dispatchCampaign(campaignId: string): Promise<DispatchResult> {
  const admin = createAdminSupabase();

  // 取出 campaign，並把狀態切到 'sending' 防止 race（cron + sendNow 同時點）
  const { data: campaign, error: fetchErr } = await admin
    .from("marketing_campaigns")
    .select("id, subject, body, status")
    .eq("id", campaignId)
    .maybeSingle();

  if (fetchErr || !campaign) {
    return {
      ok: false,
      recipient_count: 0,
      success_count: 0,
      error_count: 0,
      reason: "campaign-not-found",
    };
  }
  if (campaign.status === "sending" || campaign.status === "sent") {
    return {
      ok: false,
      recipient_count: 0,
      success_count: 0,
      error_count: 0,
      reason: "already-dispatched-or-in-progress",
    };
  }
  if (campaign.status === "cancelled") {
    return {
      ok: false,
      recipient_count: 0,
      success_count: 0,
      error_count: 0,
      reason: "campaign-cancelled",
    };
  }

  // 狀態鎖定（CAS：where status 仍是進入時的值）
  const { data: locked, error: lockErr } = await admin
    .from("marketing_campaigns")
    .update({ status: "sending" })
    .eq("id", campaign.id)
    .eq("status", campaign.status)
    .select("id");
  if (lockErr || !locked || locked.length === 0) {
    return {
      ok: false,
      recipient_count: 0,
      success_count: 0,
      error_count: 0,
      reason: "race-condition",
    };
  }

  if (!isEmailConfigured()) {
    await admin
      .from("marketing_campaigns")
      .update({
        status: "draft",
        recipient_count: 0,
        success_count: 0,
        error_count: 0,
      })
      .eq("id", campaign.id);
    return {
      ok: false,
      recipient_count: 0,
      success_count: 0,
      error_count: 0,
      reason: "email-not-configured",
    };
  }

  // 撈所有 opt-in 客戶。customers 沒有 email — 要從 auth.users 拿。
  // 兩段式：先取 customers ids（with opt_in=true），再 admin.auth.admin.listUsers
  // batch 取 email。
  const { data: customers } = await admin
    .from("customers")
    .select("id")
    .eq("marketing_opt_in", true);

  const customerIds = (customers ?? []).map((c) => c.id as string);
  const recipientIdSet = new Set(customerIds);

  // listUsers 一次最多 1000 筆，pagination
  const recipients: { id: string; email: string }[] = [];
  let page = 1;
  const PER_PAGE = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) break;
    for (const u of data.users) {
      if (recipientIdSet.has(u.id) && u.email) {
        recipients.push({ id: u.id, email: u.email });
      }
    }
    if (data.users.length < PER_PAGE) break;
    page += 1;
  }

  let success = 0;
  let errCount = 0;

  const html = HTML_WRAPPER_OPEN + campaign.body + HTML_WRAPPER_CLOSE;
  const text = htmlToText(campaign.body);
  const subject = SUBJECT_PREFIX + campaign.subject;

  for (const r of recipients) {
    try {
      await sendEmail({ to: [r.email], subject, text, html });
      success += 1;
    } catch (err) {
      errCount += 1;
      console.error(`[marketing] 寄信給 ${r.email} 失敗:`, err);
    }
  }

  await admin
    .from("marketing_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_count: recipients.length,
      success_count: success,
      error_count: errCount,
    })
    .eq("id", campaign.id);

  return {
    ok: true,
    recipient_count: recipients.length,
    success_count: success,
    error_count: errCount,
  };
}
