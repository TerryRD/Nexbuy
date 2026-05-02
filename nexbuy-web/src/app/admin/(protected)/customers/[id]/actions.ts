"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  id: z.uuid(),
  display_name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  marketing_opt_in: z.boolean(),
});

export type UpdateCustomerState = {
  error?: string;
  success?: boolean;
} | null;

export async function updateCustomerAction(
  _prev: UpdateCustomerState,
  formData: FormData,
): Promise<UpdateCustomerState> {
  const parsed = schema.safeParse({
    id: formData.get("id"),
    display_name: formData.get("display_name"),
    phone: formData.get("phone"),
    marketing_opt_in: formData.get("marketing_opt_in") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "輸入格式錯誤" };
  }

  // Admin layout already enforces the role check; this UPDATE goes through
  // the SSR client which inherits the admin's session, so RLS allows it.
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("customers")
    .update({
      display_name: parsed.data.display_name,
      phone: parsed.data.phone,
      marketing_opt_in: parsed.data.marketing_opt_in,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: "更新失敗：" + error.message };
  }

  revalidatePath(`/admin/customers/${parsed.data.id}`);
  revalidatePath("/admin/customers");
  return { success: true };
}
