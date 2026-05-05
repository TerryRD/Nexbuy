"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, isEmailConfigured } from "@/lib/email/send";
import { orderPaidEmail } from "@/lib/email/templates";
import { publicEnv } from "@/lib/env";
import { SHIPPING_STATUSES } from "./shipping-status";

const NEXT_STATUS_MAP = {
  pending_payment: "paid",
  paid: "shipped",
  shipped: "completed",
} as const;

type Transition = keyof typeof NEXT_STATUS_MAP;

const advanceSchema = z.object({
  id: z.uuid(),
  from: z.enum(
    Object.keys(NEXT_STATUS_MAP) as [Transition, ...Transition[]],
  ),
});

const updateShippingSchema = z.object({
  id: z.uuid(),
  shipping_status: z.enum(SHIPPING_STATUSES),
  tracking_number: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => (v ? v : null)),
  tracking_carrier: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v ? v : null)),
});

/**
 * Advance order through: pending_payment → paid → shipped → completed.
 * Includes `from` as guard so a stale double-click on an outdated page
 * doesn't skip a state (e.g. pending_payment directly to completed).
 */
export async function advanceOrderStatus(formData: FormData): Promise<void> {
  const parsed = advanceSchema.safeParse({
    id: formData.get("id"),
    from: formData.get("from"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const nextStatus = NEXT_STATUS_MAP[parsed.data.from];

  const sb = await createServerSupabase();
  const { error, data } = await sb
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", parsed.data.id)
    .eq("status", parsed.data.from)
    .select("id, order_no, lookup_token, recipient_name, customer_email");

  if (error) {
    console.error("advanceOrderStatus failed:", error);
    throw new Error("UPDATE_FAILED");
  }
  if (!data || data.length === 0) {
    throw new Error("STATE_CHANGED"); // 其他 admin 已更新過
  }

  // Notify customer when payment is confirmed (pending_payment → paid).
  // Other transitions (→ shipped → completed) don't email; we'd add SMS or
  // tracking-no based notifications later.
  if (nextStatus === "paid") {
    const o = data[0];
    const to = [o.customer_email];
    if (!isEmailConfigured() || to.length === 0) {
      console.warn("[orders/admin] 未寄 email (缺 SMTP 設定 或 收件人)");
    } else {
      const content = orderPaidEmail({
        customerName: o.recipient_name,
        orderNo: o.order_no,
        // 必帶 lookup_token，否則收信人點進去會 404
        successUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/orders/${o.order_no}?t=${o.lookup_token}`,
      });
      sendEmail({ to, ...content }).catch((err) => {
        console.error("[orders/admin] 寄信失敗:", err);
      });
    }
  }

  revalidatePath("/admin/orders");
}

export async function updateShipping(formData: FormData): Promise<void> {
  const parsed = updateShippingSchema.safeParse({
    id: formData.get("id"),
    shipping_status: formData.get("shipping_status"),
    tracking_number: formData.get("tracking_number") ?? undefined,
    tracking_carrier: formData.get("tracking_carrier") ?? undefined,
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("orders")
    .update({
      shipping_status: parsed.data.shipping_status,
      tracking_number: parsed.data.tracking_number,
      tracking_carrier: parsed.data.tracking_carrier,
    })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("updateShipping failed:", error);
    throw new Error("UPDATE_FAILED");
  }

  revalidatePath("/admin/orders");
}
