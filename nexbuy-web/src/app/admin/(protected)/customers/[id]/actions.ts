"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

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

const resetSchema = z.object({
  id: z.uuid(),
});

// Admin client (service role) bypasses RLS — must explicitly verify admin role.
async function requireAdminSession() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | null)?.role;
  if (!user || role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// Generate a 12-char temp password using crypto random — easy to read aloud
// (no l/I/0/O ambiguity), safe-enough as a one-time temp.
function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => alphabet[b % alphabet.length]).join("");
}

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

export type ResetCustomerPasswordState = {
  error?: string;
  tempPassword?: string;
} | null;

/**
 * Generate a temp password for the customer and overwrite via Supabase admin
 * API. Admin gives the temp password to the customer (LINE / phone / email);
 * customer logs in and is expected to change it via /account.
 */
export async function resetCustomerPasswordAction(
  _prev: ResetCustomerPasswordState,
  formData: FormData,
): Promise<ResetCustomerPasswordState> {
  try {
    await requireAdminSession();
  } catch {
    return { error: "未授權" };
  }

  const parsed = resetSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "客戶 ID 格式錯誤" };
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminSupabase();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.id, {
    password: tempPassword,
  });
  if (error) {
    return { error: "重設失敗：" + error.message };
  }

  // Don't revalidate — we want to keep the tempPassword visible in the same
  // server action response without a page rerender wiping it.
  return { tempPassword };
}
