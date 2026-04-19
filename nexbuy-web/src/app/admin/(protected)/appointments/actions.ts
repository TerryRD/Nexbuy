"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(["completed", "noshow", "booked"]),
});

/**
 * 改 appointment 狀態。admin-only,RLS policy 已限制。
 * 注意:不會動 slot.booked_count。booked → completed/noshow 不該釋放 slot
 * (時段已經消耗掉),只有 cancelled 才會減 booked_count (走 cancel_appointment RPC)。
 */
export async function updateAppointmentStatus(
  formData: FormData,
): Promise<void> {
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("updateAppointmentStatus failed:", error);
    throw new Error("UPDATE_FAILED");
  }

  revalidatePath("/admin/appointments");
}
