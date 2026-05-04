import "server-only";

// Transactional email 內容生成器。
// 各 helper 回傳 { subject, text, html }；caller 自行包成
// sendEmail({ to: [...], ...content }).
//
// HTML 設計取捨：
// - 純 inline style + 單欄置中，最大相容性（Outlook / Gmail / iOS Mail）
// - 不引外部字型 / 圖片，避免 Gmail 隱私截圖屏蔽
// - 顏色取暖色系（與品牌「慢工細活」基調一致），不用冷藍

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

const SENDER_NAME = "精鋐眼鏡行";

const FOOTER_TEXT = `\n--\n${SENDER_NAME} Jing Hong Optical\n`;

const formatPrice = (cents: number): string =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

// 簡單防 HTML injection — transactional content 都來自我們的 DB，但
// customer_name / order note 等仍是使用者輸入。
function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface WrapHtmlInput {
  preheader?: string;
  body: string; // 已 escape 過的 HTML 片段
}

function wrapHtml({ preheader, body }: WrapHtmlInput): string {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${escape(SENDER_NAME)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Noto Sans TC',sans-serif;color:#2b231b;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escape(preheader)}</div>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f1ea;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#fffcf7;border-radius:16px;box-shadow:0 1px 0 rgba(0,0,0,0.04);overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0;">
                <div style="font-size:14px;color:#7a6856;letter-spacing:0.04em;">${escape(SENDER_NAME)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;font-size:15px;line-height:1.7;color:#2b231b;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;border-top:1px solid #ece4d6;font-size:12px;color:#9a8c79;">
                ${escape(SENDER_NAME)} Jing Hong Optical
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// 統一的按鈕樣式
function htmlButton(label: string, href: string): string {
  return `<a href="${escape(href)}" style="display:inline-block;background:#5b3b1f;color:#fffcf7;text-decoration:none;padding:10px 20px;border-radius:999px;font-weight:500;font-size:14px;">${escape(label)}</a>`;
}

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
    FOOTER_TEXT;

  const itemsHtml = d.items
    .map(
      (i) =>
        `<li style="margin:0;padding:2px 0;">${escape(i.productName)} × ${i.quantity}</li>`,
    )
    .join("");

  const body = `
    <p style="margin:0 0 12px;">${escape(d.customerName)} 您好，</p>
    <p style="margin:0 0 16px;">謝謝你的訂購。請於 <strong>3 日內</strong>完成 ATM 轉帳，把下列 5 碼填到匯款備註，我們收到款項就會手動標記、開始備貨。</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;background:#f6f1ea;border-radius:10px;">
      <tr>
        <td style="padding:14px 16px;">
          <div style="font-size:12px;color:#7a6856;">訂單編號</div>
          <div style="font-family:'Courier New',monospace;font-size:15px;margin-top:2px;">${escape(d.orderNo)}</div>
          <div style="font-size:12px;color:#7a6856;margin-top:10px;">匯款備註（請填這 5 碼）</div>
          <div style="font-family:'Courier New',monospace;font-size:20px;font-weight:600;letter-spacing:0.2em;margin-top:2px;">${escape(d.paymentCode)}</div>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 6px;font-size:13px;color:#7a6856;">商品</p>
    <ul style="margin:0 0 16px;padding-left:18px;">${itemsHtml}</ul>
    <p style="margin:0 0 18px;font-size:15px;"><strong>總計：${formatPrice(d.totalCents)}</strong></p>
    ${htmlButton("查看訂單詳情", d.successUrl)}
  `;

  return {
    subject: `[${SENDER_NAME}] 訂單成立 ${d.orderNo}`,
    text,
    html: wrapHtml({ preheader: `訂單 ${d.orderNo} 成立，請完成 ATM 匯款`, body }),
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
    FOOTER_TEXT;

  const body = `
    <p style="margin:0 0 12px;">${escape(d.customerName)} 您好，</p>
    <p style="margin:0 0 16px;">已確認收到訂單 <strong>${escape(d.orderNo)}</strong> 的款項，目前正在備貨中。出貨後會再以 email 通知你。</p>
    ${htmlButton("查看訂單", d.successUrl)}
  `;

  return {
    subject: `[${SENDER_NAME}] 已收到您的款項 ${d.orderNo}`,
    text,
    html: wrapHtml({ preheader: `${d.orderNo} 款項已收到，備貨中`, body }),
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
    FOOTER_TEXT;

  const body = `
    <p style="margin:0 0 12px;">${escape(d.customerName)} 您好，</p>
    <p style="margin:0 0 16px;">已為你預約到店配鏡，請於下方時間光臨，我們會把鏡架準備好。</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;background:#f6f1ea;border-radius:10px;">
      <tr>
        <td style="padding:14px 16px;">
          <div style="font-size:12px;color:#7a6856;">時間</div>
          <div style="font-size:16px;margin-top:2px;">${escape(d.appointmentDate)} ${escape(d.appointmentTime)}</div>
          ${d.frameName ? `<div style="font-size:12px;color:#7a6856;margin-top:10px;">鏡架</div><div style="font-size:15px;margin-top:2px;">${escape(d.frameName)}</div>` : ""}
        </td>
      </tr>
    </table>
    ${htmlButton("管理 / 取消預約", d.cancelUrl)}
  `;

  return {
    subject: `[${SENDER_NAME}] 預約成功 ${d.appointmentDate} ${d.appointmentTime}`,
    text,
    html: wrapHtml({
      preheader: `${d.appointmentDate} ${d.appointmentTime} 已為你預約到店配鏡`,
      body,
    }),
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
    FOOTER_TEXT;

  const body = `
    <p style="margin:0 0 12px;">${escape(d.customerName)} 您好，</p>
    <p style="margin:0 0 16px;">提醒一下，<strong>明天</strong>有預約。請準時到店，我們已將鏡架準備好。</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;background:#f6f1ea;border-radius:10px;">
      <tr>
        <td style="padding:14px 16px;">
          <div style="font-size:12px;color:#7a6856;">時間</div>
          <div style="font-size:16px;margin-top:2px;">${escape(d.appointmentDate)} ${escape(d.appointmentTime)}</div>
          ${d.frameName ? `<div style="font-size:12px;color:#7a6856;margin-top:10px;">鏡架</div><div style="font-size:15px;margin-top:2px;">${escape(d.frameName)}</div>` : ""}
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px;font-size:13px;color:#7a6856;">臨時無法到？</p>
    ${htmlButton("取消預約", d.cancelUrl)}
  `;

  return {
    subject: `[${SENDER_NAME}] 明天 ${d.appointmentTime} 別忘了到店配鏡`,
    text,
    html: wrapHtml({
      preheader: `明天 ${d.appointmentTime} 到店配鏡，請準時光臨`,
      body,
    }),
  };
}

// ---------------------------------------------------------------------------
// Low-stock digest (admin-facing — 每日 cron 寄一次)
// ---------------------------------------------------------------------------

export interface LowStockItem {
  name: string;
  finishedStock: number;
  threshold: number;
  adminUrl: string;
}

export interface LowStockAlertInput {
  date: string; // 寄信當天 YYYY-MM-DD (TW)
  items: LowStockItem[];
}

export function lowStockAlertEmail(d: LowStockAlertInput): EmailContent {
  const itemsText = d.items
    .map(
      (i) =>
        `  - ${i.name}：庫存 ${i.finishedStock} (警戒值 ${i.threshold})`,
    )
    .join("\n");

  const text =
    `店家您好，\n` +
    `\n` +
    `${d.date}（Asia/Taipei）庫存低於警戒值的商品如下：\n` +
    `\n` +
    `${itemsText}\n` +
    `\n` +
    `補貨後記得到 /admin/products 把庫存數量更新。\n` +
    FOOTER_TEXT;

  const itemsHtml = d.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 12px;border-top:1px solid #ece4d6;font-size:14px;">
            <a href="${escape(i.adminUrl)}" style="color:#5b3b1f;text-decoration:none;">${escape(i.name)}</a>
          </td>
          <td style="padding:8px 12px;border-top:1px solid #ece4d6;text-align:right;font-size:14px;${i.finishedStock === 0 ? "color:#b3261e;font-weight:600;" : "color:#7a4f00;"}">
            庫存 ${i.finishedStock}
          </td>
          <td style="padding:8px 12px;border-top:1px solid #ece4d6;text-align:right;font-size:12px;color:#9a8c79;">
            警戒 ${i.threshold}
          </td>
        </tr>`,
    )
    .join("");

  const body = `
    <p style="margin:0 0 12px;">店家您好，</p>
    <p style="margin:0 0 16px;"><strong>${escape(d.date)}</strong>（Asia/Taipei）庫存低於警戒值的商品共 <strong>${d.items.length}</strong> 項：</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #ece4d6;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#f6f1ea;">
          <th align="left" style="padding:8px 12px;font-size:12px;color:#7a6856;font-weight:500;">商品</th>
          <th align="right" style="padding:8px 12px;font-size:12px;color:#7a6856;font-weight:500;">庫存</th>
          <th align="right" style="padding:8px 12px;font-size:12px;color:#7a6856;font-weight:500;">警戒</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#7a6856;">補貨後到 /admin/products 更新庫存。</p>
  `;

  return {
    subject: `[${SENDER_NAME}] 低庫存警示（${d.items.length} 項）— ${d.date}`,
    text,
    html: wrapHtml({
      preheader: `${d.items.length} 項商品庫存低於警戒值`,
      body,
    }),
  };
}
