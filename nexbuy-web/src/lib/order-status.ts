// 訂單 7 種 status 的中文 label + 配色 + Tailwind class。
// admin/orders 列表、admin/orders 詳情、客戶 /orders/[orderNo] 都會用到，
// 抽出來避免每個檔自己抄一份配色。
//
// 配色思路（搭配品牌暖色系，但讓 status 一眼可辨）：
//   pending_payment 待付款 → amber  （需注意，提醒對帳）
//   paid            已付款 → emerald（錢已到）
//   preparing       備貨中 → sky    （正在處理）
//   shipped         已出貨 → violet （在路上）
//   completed       已完成 → slate  （收尾）
//   cancelled       已取消 → zinc   （灰，不會再變）
//   refunded        已退款 → rose   （需特別追蹤）

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  preparing: "備貨中",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

/**
 * Badge 用的配色 class — 浮在 card 上的小色標。
 * dark mode 反白配色避免在深色主題下對比不足。
 */
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending_payment:
    "border-amber-500/50 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
  paid:
    "border-emerald-500/50 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
  preparing:
    "border-sky-500/50 bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100",
  shipped:
    "border-violet-500/50 bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-100",
  completed:
    "border-slate-500/50 bg-slate-100 text-slate-900 dark:bg-slate-900/60 dark:text-slate-200",
  cancelled:
    "border-zinc-400/50 bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300",
  refunded:
    "border-rose-500/50 bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100",
};

/**
 * Card 的左邊框色 — 4px 厚的色條，掃 list 時一眼分得出 status。
 * 比直接給整張 card 上色低調，不會讓背景太花。
 */
export const ORDER_STATUS_BORDER: Record<OrderStatus, string> = {
  pending_payment: "border-l-amber-500",
  paid: "border-l-emerald-500",
  preparing: "border-l-sky-500",
  shipped: "border-l-violet-500",
  completed: "border-l-slate-500",
  cancelled: "border-l-zinc-400",
  refunded: "border-l-rose-500",
};

/**
 * Filter chip 用的配色 — active 時填滿、inactive 用淡色 outline。
 * 跟 BADGE 同 hue 但語意不同（chip 是按鈕，badge 是 status 標籤）。
 */
export const ORDER_STATUS_CHIP_ACTIVE: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-500 text-white border-amber-500",
  paid: "bg-emerald-500 text-white border-emerald-500",
  preparing: "bg-sky-500 text-white border-sky-500",
  shipped: "bg-violet-500 text-white border-violet-500",
  completed: "bg-slate-500 text-white border-slate-500",
  cancelled: "bg-zinc-400 text-white border-zinc-400",
  refunded: "bg-rose-500 text-white border-rose-500",
};
