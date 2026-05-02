"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/safe-next";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8, "密碼至少 8 個字元"),
});

export type SignupState = {
  error?: string;
  sent?: boolean;
} | null;

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email / 密碼格式不正確" };
  }

  // Build absolute callback URL from the request's host. Falls back to the
  // first whitelisted Site URL configured in Supabase if missing.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  const next = safeNext(formData.get("next") as string | null);
  const emailRedirectTo = host
    ? `${proto}://${host}/auth/callback?next=${encodeURIComponent(next)}`
    : undefined;

  const sb = await createServerSupabase();
  const { error } = await sb.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo },
  });

  if (error) {
    return { error: "註冊失敗：" + error.message };
  }

  return { sent: true };
}
