// Plain-HTML transactional email templates. Kept inline (not React Email
// components) to avoid an extra dependency for MVP.

import type { EmailMessage } from "./send";

const SHELL_STYLE =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6";
const MUTED = "color:#64748b;font-size:14px";
const CARD =
  "background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0";
const CTA =
  "display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-weight:500";

const formatPrice = (cents: number): string =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

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
        `<li>${escapeHtml(i.productName)} × ${i.quantity}</li>`,
    )
    .join("");
  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 訂單成立 ${d.orderNo}`,
    html: `<div style="${SHELL_STYLE}">
  <h2>訂單收到囉</h2>
  <p>${escapeHtml(d.customerName)} 您好,</p>
  <p>感謝您的訂購!以下是訂單明細,請於 <strong>3 日內</strong>完成 ATM 轉帳。</p>
  <div style="${CARD}">
    <p style="margin:0"><strong>訂單編號</strong></p>
    <p style="font-family:monospace;font-size:18px;margin:4px 0 12px">${d.orderNo}</p>
    <p style="margin:0"><strong>匯款備註(請填這 5 碼)</strong></p>
    <p style="font-family:monospace;font-size:22px;letter-spacing:4px;margin:4px 0 12px"><strong>${d.paymentCode}</strong></p>
    <ul style="margin:0;padding-left:20px">${itemsHtml}</ul>
    <p style="margin:12px 0 0"><strong>總計:${formatPrice(d.totalCents)}</strong></p>
  </div>
  <p>匯款資訊與訂單詳情請看訂單頁:</p>
  <p><a href="${d.successUrl}" style="${CTA}">查看訂單</a></p>
  <p style="${MUTED}">這封信由系統自動發送,如需協助請直接聯絡店家。</p>
</div>`,
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
  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 已收到您的款項 ${d.orderNo}`,
    html: `<div style="${SHELL_STYLE}">
  <h2>付款確認</h2>
  <p>${escapeHtml(d.customerName)} 您好,</p>
  <p>店家已確認收到訂單 <strong style="font-family:monospace">${d.orderNo}</strong> 的款項,
  目前正在備貨中。出貨後會再以這封 email 通知您。</p>
  <p><a href="${d.successUrl}" style="${CTA}">查看訂單</a></p>
</div>`,
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
  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 預約成功 ${d.appointmentDate} ${d.appointmentTime}`,
    html: `<div style="${SHELL_STYLE}">
  <h2>預約成功</h2>
  <p>${escapeHtml(d.customerName)} 您好,</p>
  <p>已為您預約到店配鏡,請於下方時間到店,我們會把鏡架準備好。</p>
  <div style="${CARD}">
    <p style="margin:0 0 6px"><strong>時間</strong>:${escapeHtml(d.appointmentDate)} ${escapeHtml(d.appointmentTime)}</p>
    ${d.frameName ? `<p style="margin:0"><strong>鏡架</strong>:${escapeHtml(d.frameName)}</p>` : ""}
  </div>
  <p>如需取消,點下方連結(請保留這封信):</p>
  <p><a href="${d.cancelUrl}" style="${CTA}">取消預約</a></p>
  <p style="${MUTED}">取消後此時段會釋放給其他人。</p>
</div>`,
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
  return {
    to: d.to,
    subject: `[精鋐眼鏡行] 明天 ${d.appointmentTime} 別忘了到店配鏡`,
    html: `<div style="${SHELL_STYLE}">
  <h2>明天到店配鏡提醒</h2>
  <p>${escapeHtml(d.customerName)} 您好,</p>
  <p>提醒您明天有個預約,請準時到店,我們已將鏡架準備好。</p>
  <div style="${CARD}">
    <p style="margin:0 0 6px"><strong>時間</strong>:${escapeHtml(d.appointmentDate)} ${escapeHtml(d.appointmentTime)}</p>
    ${d.frameName ? `<p style="margin:0"><strong>鏡架</strong>:${escapeHtml(d.frameName)}</p>` : ""}
  </div>
  <p>臨時無法到店的話,請點以下連結取消預約:</p>
  <p><a href="${d.cancelUrl}" style="${CTA}">取消預約</a></p>
</div>`,
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
