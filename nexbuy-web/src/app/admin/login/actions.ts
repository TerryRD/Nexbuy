"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Email / 密碼格式不正確" };
  }

  const sb = await createServerSupabase();
  const { data, error } = await sb.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "登入失敗:" + error.message };
  }

  // app_metadata.role 是 system-controlled 的角色欄位 (使用者改不了)
  const appMeta = data.user?.app_metadata as Record<string, unknown> | undefined;
  const role = (appMeta?.role as string | undefined) ?? null;
  if (role !== "admin") {
    await sb.auth.signOut();
    return { error: "此帳號不是管理員。" };
  }

  redirect("/admin/appointments");
}
