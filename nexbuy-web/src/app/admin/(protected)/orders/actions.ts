"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { orderPaidEmail } from "@/lib/email/templates";
import { publicEnv, getServerEnv } from "@/lib/env";

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
    .select("id, order_no, recipient_name, customer_email");

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
    const { RESEND_API_KEY } = getServerEnv();
    const to = [o.customer_email];
    if (!RESEND_API_KEY || to.length === 0) {
      console.warn("[orders/admin] 未寄 email (缺 RESEND_API_KEY 或收件人)");
    } else {
      const content = orderPaidEmail({
        customerName: o.recipient_name,
        orderNo: o.order_no,
        successUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/orders/${o.order_no}`,
      });
      sendEmail({ to, ...content }).catch((err) => {
        console.error("[orders/admin] 寄信失敗:", err);
      });
    }
  }

  revalidatePath("/admin/orders");
}
