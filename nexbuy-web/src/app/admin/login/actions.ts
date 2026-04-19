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
    console.log("[login] zod parse failed");
    return { error: "Email / 密碼格式不正確" };
  }

  console.log("[login] attempting signin for", parsed.data.email);
  const sb = await createServerSupabase();
  const { data, error } = await sb.auth.signInWithPassword(parsed.data);

  if (error) {
    console.log("[login] signin error:", error.message, "status:", error.status);
    return { error: "登入失敗:" + error.message };
  }

  // app_metadata 是 system-controlled 的角色容器
  const appMeta = data.user?.app_metadata as Record<string, unknown> | undefined;
  const role = (appMeta?.role as string | undefined) ?? null;
  console.log(
    "[login] signin ok. user_id=",
    data.user?.id,
    "role=",
    role,
    "app_metadata=",
    JSON.stringify(appMeta),
  );

  if (role !== "admin") {
    await sb.auth.signOut();
    console.log("[login] role check failed, signed out");
    return { error: "此帳號不是管理員。" };
  }

  console.log("[login] redirecting to /admin/appointments");
  redirect("/admin/appointments");
}
