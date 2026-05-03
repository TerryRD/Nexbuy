// 精鋐眼鏡行 — Resend transactional email templates.
//
// Visual matches the Supabase auth email templates (confirm-signup.html /
// reset-password.html): table-based layout, inline styles, system font
// stack with CJK fallbacks, 560px max width, caramel/cream palette.
//
// Email-client constraints honored:
// - Tables for layout (Outlook desktop friendliness)
// - Inline styles only (Gmail strips <style>)
// - System font stack with PingFang TC / Microsoft JhengHei fallbacks
// - SVG logo with text wordmark (Outlook strips SVG, the wordmark still reads)

import type { EmailMessage } from "./send";

const PALETTE = {
  primary: "#7a522f",
  fg: "#3a2f24",
  bg: "#faf6ee",
  card: "#fefcf6",
  border: "#e8dcc8",
  muted: "#8a7866",
  fgSoft: "#5a4a38",
  brandSoft: "#a89378",
} as const;

const FONT_SANS =
  "-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang TC','Microsoft JhengHei',Arial,sans-serif";
const FONT_SERIF =
  "Georgia,'Times New Roman','Songti TC','Noto Serif TC',serif";

const formatPrice = (cents: number): string =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

interface ShellInput {
  title: string;
  tagline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}

// Wraps email body in the brand shell. Returns full <html> document.
function shell(d: ShellInput): string {
  const cta = d.ctaLabel && d.ctaUrl
    ? `
    <tr>
      <td align="left" style="padding:32px 44px 0 44px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color:${PALETTE.primary};border-radius:10px;">
              <a href="${d.ctaUrl}" target="_blank"
                 style="display:inline-block;padding:14px 32px;font-family:${FONT_SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.02em;border-radius:10px;">
                ${escapeHtml(d.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

  const footnote = d.footnote
    ? `
    <tr>
      <td style="padding:24px 44px 40px 44px;">
        <p style="margin:0;font-size:12px;line-height:1.7;color:${PALETTE.muted};">
          ${d.footnote}
        </p>
      </td>
    </tr>`
    : `<tr><td style="padding:0 0 24px 0;font-size:0;line-height:0;">&nbsp;</td></tr>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="zh-TW">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(d.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PALETTE.bg};font-family:${FONT_SANS};color:${PALETTE.fg};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${PALETTE.bg};">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background-color:${PALETTE.card};border-radius:18px;border:1px solid ${PALETTE.border};">

    <tr>
      <td align="left" style="padding:40px 44px 0 44px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding-right:10px;vertical-align:middle;">
              <svg width="42" height="18" viewBox="0 0 48 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 5h44" stroke="${PALETTE.primary}" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M2 5v5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5" stroke="${PALETTE.primary}" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
                <path d="M30 5v5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5" stroke="${PALETTE.primary}" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
              </svg>
            </td>
            <td style="vertical-align:middle;font-family:${FONT_SERIF};font-size:20px;font-weight:600;color:${PALETTE.primary};letter-spacing:-0.005em;">
              精鋐眼鏡行
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:40px 44px 0 44px;">
        <h1 style="margin:0;font-family:${FONT_SERIF};font-size:32px;font-weight:600;line-height:1.2;color:${PALETTE.fg};letter-spacing:-0.015em;">
          ${escapeHtml(d.title)}
        </h1>
        <p style="margin:10px 0 0 0;font-family:${FONT_SERIF};font-size:18px;line-height:1.4;color:${PALETTE.fgSoft};font-style:italic;">
          ${escapeHtml(d.tagline)}
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:28px 44px 0 44px;">
        ${d.bodyHtml}
      </td>
    </tr>
${cta}
    <tr>
      <td style="padding:36px 44px 0 44px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="border-top:1px solid ${PALETTE.border};font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
${footnote}
  </table>

  <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">
    <tr>
      <td align="center" style="padding:24px 16px 8px 16px;">
        <p style="margin:0;font-family:${FONT_SERIF};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${PALETTE.brandSoft};">
          Jing Hong Optical &nbsp;·&nbsp; Est · 在地
        </p>
        <p style="margin:8px 0 0 0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.12em;color:${PALETTE.brandSoft};">
          25.0173°N &nbsp; 121.2956°E
        </p>
      </td>
    </tr>
  </table>

</td></tr>
</table>
</body>
</html>`;
}

// Branded info card (used inside body for order details / appointment slot).
function infoCard(rowsHtml: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${PALETTE.bg};border:1px solid ${PALETTE.border};border-radius:12px;margin:0;">
  <tr><td style="padding:18px 22px;">
    ${rowsHtml}
  </td></tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Order placed (waiting for ATM transfer)
// ---------------------------------------------------------------------------

export interface OrderPlacedInput {
  to: string;
  customerName: string;
  orderNo: string;
  paymentCode: string;
  totalCents: number;
  items: { productName: string; quantity: number }[];
  successUrl: string;
}

export function orderPlacedEmail(d: OrderPlacedInput): EmailMessage {
  const itemsHtml = d.items
    .map(
      (i) =>
        `<li style="margin:0 0 4px 0;font-size:14px;line-height:1.6;color:${PALETTE.fg};">${escapeHtml(i.productName)} × ${i.quantity}</li>`,
    )
    .join("");

  const card = infoCard(`
    <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">訂單編號</p>
    <p style="margin:0 0 14px 0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:15px;color:${PALETTE.fg};">${escapeHtml(d.orderNo)}</p>
    <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">匯款備註(請填這 5 碼)</p>
    <p style="margin:0 0 14px 0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:24px;font-weight:600;letter-spacing:6px;color:${PALETTE.primary};">${escapeHtml(d.paymentCode)}</p>
    <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">商品</p>
    <ul style="margin:0 0 14px 0;padding-left:18px;">${itemsHtml}</ul>
    <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">總計</p>
    <p style="margin:0;font-size:20px;font-weight:600;color:${PALETTE.fg};">${formatPrice(d.totalCents)}</p>
  `);

  const body = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      ${escapeHtml(d.customerName)} 您好,
    </p>
    <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      謝謝你的訂購。請於 <strong>3 日內</strong>完成 ATM 轉帳,並把下面這 5 碼填到匯款備註,我們收到款項就會手動標記、開始備貨。
    </p>
    ${card}`;

  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 訂單成立 ${d.orderNo}`,
    html: shell({
      title: "訂單收到囉",
      tagline: "謝謝下單,接下來換我們忙了。",
      bodyHtml: body,
      ctaLabel: "查看訂單詳情",
      ctaUrl: d.successUrl,
      footnote:
        "這封信由系統自動發送。如果你沒有在精鋐眼鏡行下單,可以直接忽略。",
    }),
    text: `訂單 ${d.orderNo} 已成立,總計 ${formatPrice(d.totalCents)}。請於 ATM 備註填上 5 碼: ${d.paymentCode}。詳情:${d.successUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Order paid (admin confirmed transfer)
// ---------------------------------------------------------------------------

export interface OrderPaidInput {
  to: string;
  customerName: string;
  orderNo: string;
  successUrl: string;
}

export function orderPaidEmail(d: OrderPaidInput): EmailMessage {
  const body = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      ${escapeHtml(d.customerName)} 您好,
    </p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      已確認收到訂單 <span style="font-family:'SF Mono',Menlo,Consolas,monospace;color:${PALETTE.primary};">${escapeHtml(d.orderNo)}</span> 的款項,目前正在備貨中。出貨後會再以這封 email 通知你。
    </p>
    <p style="margin:0;font-size:14px;line-height:1.7;color:${PALETTE.fgSoft};">
      鏡架調整、保養與配戴小提醒,出貨時會一併寄出。
    </p>`;

  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 已收到您的款項 ${d.orderNo}`,
    html: shell({
      title: "款項已確認",
      tagline: "備貨中,等等就為你打包好。",
      bodyHtml: body,
      ctaLabel: "查看訂單",
      ctaUrl: d.successUrl,
    }),
    text: `訂單 ${d.orderNo} 款項已確認,目前備貨中。詳情:${d.successUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Appointment booked
// ---------------------------------------------------------------------------

export interface AppointmentBookedInput {
  to: string;
  customerName: string;
  appointmentDate: string;   // "2026年4月20日 週一"
  appointmentTime: string;   // "10:00 – 11:00"
  frameName: string | null;
  cancelUrl: string;
}

export function appointmentBookedEmail(d: AppointmentBookedInput): EmailMessage {
  const card = infoCard(`
    <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">時間</p>
    <p style="margin:0 0 14px 0;font-size:18px;font-weight:600;color:${PALETTE.fg};">${escapeHtml(d.appointmentDate)} ${escapeHtml(d.appointmentTime)}</p>
    ${
      d.frameName
        ? `<p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">鏡架</p>
           <p style="margin:0;font-size:15px;color:${PALETTE.fg};">${escapeHtml(d.frameName)}</p>`
        : ""
    }
  `);

  const body = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      ${escapeHtml(d.customerName)} 您好,
    </p>
    <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      已為你預約到店配鏡,請於下方時間光臨,我們會把鏡架準備好。
    </p>
    ${card}`;

  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 預約成功 ${d.appointmentDate} ${d.appointmentTime}`,
    html: shell({
      title: "預約成功",
      tagline: "慢工細活,值得你親自來一趟。",
      bodyHtml: body,
      ctaLabel: "管理 / 取消預約",
      ctaUrl: d.cancelUrl,
      footnote:
        "需要改時間請點上面那顆按鈕。取消後此時段會自動釋放給其他人。",
    }),
    text: `預約成功:${d.appointmentDate} ${d.appointmentTime}。如需取消,請點:${d.cancelUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Appointment T-24h reminder
// ---------------------------------------------------------------------------

export interface AppointmentReminderInput {
  to: string;
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  frameName: string | null;
  cancelUrl: string;
}

export function appointmentReminderEmail(
  d: AppointmentReminderInput,
): EmailMessage {
  const card = infoCard(`
    <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">時間</p>
    <p style="margin:0 0 14px 0;font-size:18px;font-weight:600;color:${PALETTE.fg};">${escapeHtml(d.appointmentDate)} ${escapeHtml(d.appointmentTime)}</p>
    ${
      d.frameName
        ? `<p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.muted};">鏡架</p>
           <p style="margin:0;font-size:15px;color:${PALETTE.fg};">${escapeHtml(d.frameName)}</p>`
        : ""
    }
  `);

  const body = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      ${escapeHtml(d.customerName)} 您好,
    </p>
    <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:${PALETTE.fg};">
      提醒一下,明天有預約。請準時到店,我們已將鏡架準備好。
    </p>
    ${card}`;

  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 明天 ${d.appointmentTime} 別忘了到店配鏡`,
    html: shell({
      title: "明天到店配鏡",
      tagline: "鏡架已備好,等你來。",
      bodyHtml: body,
      ctaLabel: "臨時無法到 → 取消預約",
      ctaUrl: d.cancelUrl,
      footnote: "取消後時段會釋放給其他人,請盡早通知,謝謝。",
    }),
    text: `提醒:明天 ${d.appointmentTime} 有預約。如要取消:${d.cancelUrl}`,
  };
}

// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
