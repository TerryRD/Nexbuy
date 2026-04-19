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

  // 確認這位使用者是 admin (app_metadata.role)。
  // 非 admin 就立刻登出,避免他拿到 session 跳過前端檢查。
  const role = (data.user?.app_metadata as { role?: string } | null)?.role;
  if (role !== "admin") {
    await sb.auth.signOut();
    return { error: "此帳號不是管理員。" };
  }

  redirect("/admin/appointments");
}
