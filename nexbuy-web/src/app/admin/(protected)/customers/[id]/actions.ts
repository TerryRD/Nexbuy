"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

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
  sentTo?: string; // 寄出去的 email — 給 admin 看「寄到誰」
} | null;

/**
 * 觸發 Supabase 寄重設連結給客戶。客戶點信進 /auth/callback?code=...&next=/auth/reset-password
 * → recovery session → 自己設新密碼。admin 只看到「已寄出」訊息，不會碰到明文密碼，
 * 隱私 / PII 風險比舊版「產生臨時密碼透過 LINE 告知」更小。
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

  // 用 admin client 撈客戶 email（auth.users 不開 RLS）
  const admin = createAdminSupabase();
  const { data: userResp, error: lookupError } =
    await admin.auth.admin.getUserById(parsed.data.id);
  if (lookupError || !userResp?.user?.email) {
    console.error("[admin/reset-password] customer lookup failed:", lookupError);
    return { error: "找不到客戶 email" };
  }
  const email = userResp.user.email;

  // 用 admin client 觸發 reset email — 走 Supabase 內建寄信。
  const redirectTo = `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/reset-password`;
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) {
    console.error("[admin/reset-password] resetPasswordForEmail failed:", error);
    return { error: "寄送失敗：" + error.message };
  }

  return { sentTo: email };
}
