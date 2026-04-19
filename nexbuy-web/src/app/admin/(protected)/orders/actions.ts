"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

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
    .select("id");

  if (error) {
    console.error("advanceOrderStatus failed:", error);
    throw new Error("UPDATE_FAILED");
  }
  if (!data || data.length === 0) {
    throw new Error("STATE_CHANGED"); // 其他 admin 已更新過
  }

  revalidatePath("/admin/orders");
}
