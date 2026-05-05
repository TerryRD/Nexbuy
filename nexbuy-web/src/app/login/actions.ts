"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/safe-next";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
  email?: string; // 失敗後回填，避免使用者重打
} | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = (formData.get("email") ?? "").toString();
  const parsed = schema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Email / 密碼格式不正確", email: rawEmail };
  }

  const sb = await createServerSupabase();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: localizeAuthError(error.message), email: rawEmail };
  }

  const next = safeNext(formData.get("next") as string | null);
  redirect(next);
}

// Map Supabase Auth error strings to user-friendly 繁中. Anything we don't
// explicitly recognise falls through as a generic message — never leak the
// raw English message to the user.
function localizeAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("user not found")) {
    return "Email 或密碼不正確";
  }
  if (m.includes("email not confirmed")) {
    return "請先點 email 裡的確認連結再登入";
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "嘗試太多次了，請稍後再試";
  }
  return "登入失敗，請稍後再試";
}
