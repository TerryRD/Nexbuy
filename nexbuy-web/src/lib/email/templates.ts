import "server-only";

// 純文字 transactional email 內容生成器。
// 各 helper 回傳 { subject, text }；caller 自行包成 sendEmail({ to: [...], ... }).

export interface EmailContent {
  subject: string;
  text: string;
}

const FOOTER = `\n--\n精鋐眼鏡行 Jing Hong Optical\n`;

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
  customerName: string;
  orderNo: string;
  paymentCode: string;
  totalCents: number;
  items: { productName: string; quantity: number }[];
  successUrl: string;
}

export function orderPlacedEmail(d: OrderPlacedInput): EmailContent {
  const itemsText = d.items
    .map((i) => `  - ${i.productName} × ${i.quantity}`)
    .join("\n");

  const text =
    `${d.customerName} 您好，\n` +
    `\n` +
    `謝謝你的訂購。請於 3 日內完成 ATM 轉帳，把下列 5 碼填到匯款備註，我們收到款項就會手動標記、開始備貨。\n` +
    `\n` +
    `訂單編號：${d.orderNo}\n` +
    `匯款備註（請填這 5 碼）：${d.paymentCode}\n` +
    `\n` +
    `商品：\n${itemsText}\n` +
    `\n` +
    `總計：${formatPrice(d.totalCents)}\n` +
    `\n` +
    `查看訂單詳情：${d.successUrl}\n` +
    FOOTER;

  return {
    subject: `[精鋐眼鏡行] 訂單成立 ${d.orderNo}`,
    text,
  };
}

// ---------------------------------------------------------------------------
// Order paid (admin confirmed transfer)
// ---------------------------------------------------------------------------

export interface OrderPaidInput {
  customerName: string;
  orderNo: string;
  successUrl: string;
}

export function orderPaidEmail(d: OrderPaidInput): EmailContent {
  const text =
    `${d.customerName} 您好，\n` +
    `\n` +
    `已確認收到訂單 ${d.orderNo} 的款項，目前正在備貨中。出貨後會再以 email 通知你。\n` +
    `\n` +
    `查看訂單：${d.successUrl}\n` +
    FOOTER;

  return {
    subject: `[精鋐眼鏡行] 已收到您的款項 ${d.orderNo}`,
    text,
  };
}

// ---------------------------------------------------------------------------
// Appointment booked
// ---------------------------------------------------------------------------

export interface AppointmentBookedInput {
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  frameName: string | null;
  cancelUrl: string;
}

export function appointmentBookedEmail(d: AppointmentBookedInput): EmailContent {
  const text =
    `${d.customerName} 您好，\n` +
    `\n` +
    `已為你預約到店配鏡，請於下方時間光臨，我們會把鏡架準備好。\n` +
    `\n` +
    `時間：${d.appointmentDate} ${d.appointmentTime}\n` +
    (d.frameName ? `鏡架：${d.frameName}\n` : "") +
    `\n` +
    `管理 / 取消預約：${d.cancelUrl}\n` +
    FOOTER;

  return {
    subject: `[精鋐眼鏡行] 預約成功 ${d.appointmentDate} ${d.appointmentTime}`,
    text,
  };
}

// ---------------------------------------------------------------------------
// Appointment T-24h reminder
// ---------------------------------------------------------------------------

export interface AppointmentReminderInput {
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  frameName: string | null;
  cancelUrl: string;
}

export function appointmentReminderEmail(
  d: AppointmentReminderInput,
): EmailContent {
  const text =
    `${d.customerName} 您好，\n` +
    `\n` +
    `提醒一下，明天有預約。請準時到店，我們已將鏡架準備好。\n` +
    `\n` +
    `時間：${d.appointmentDate} ${d.appointmentTime}\n` +
    (d.frameName ? `鏡架：${d.frameName}\n` : "") +
    `\n` +
    `臨時無法到 → 取消預約：${d.cancelUrl}\n` +
    FOOTER;

  return {
    subject: `[精鋐眼鏡行] 明天 ${d.appointmentTime} 別忘了到店配鏡`,
    text,
  };
}
