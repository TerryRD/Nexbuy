// Shared constants — must NOT live in actions.ts because that file has
// "use server" and Next.js 16 rejects non-async exports from server-action
// files at build time.

export const SHIPPING_STATUSES = [
  "not_shipped",
  "preparing",
  "shipped",
  "delivered",
  "returned",
] as const;

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];
