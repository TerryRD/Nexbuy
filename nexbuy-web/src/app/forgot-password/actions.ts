"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
});

export type ForgotPasswordState = {
  error?: string;
  sent?: boolean;
} | null;

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: "Email 格式不正確" };
  }

  // Build absolute redirect URL from the incoming request's host.
  // Falls back to undefined → Supabase uses the first configured Site URL.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  const redirectTo = host
    ? `${proto}://${host}/auth/callback?next=${encodeURIComponent("/reset-password")}`
    : undefined;

  const sb = await createServerSupabase();
  await sb.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  // Don't leak whether the email exists — always claim success.
  return { sent: true };
}
