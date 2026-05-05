"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

const schema = z.object({
  email: z.email("請輸入正確的 email"),
});

export type ForgotPasswordState = {
  ok?: boolean;
  error?: string;
  email?: string;
} | null;

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const rawEmail = (formData.get("email") ?? "").toString();
  const parsed = schema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "格式錯誤",
      email: rawEmail,
    };
  }

  const sb = await createServerSupabase();
  // 重要：Supabase 預設不洩漏「這個 email 有沒有註冊」— 不論存不存在都回 200。
  // 我們也跟著一律回 ok。攻擊者只能 DoS（被 Supabase 內建 rate limit 擋）。
  // redirectTo 走我們既有 /auth/callback?next=/auth/reset-password 流程，
  // 客戶點 email 連結會落在 /auth/callback，code exchange 後跳 reset-password 頁。
  const redirectTo = `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/reset-password`;
  const { error } = await sb.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });
  if (error) {
    console.error("[forgot-password] resetPasswordForEmail failed:", error);
    // 仍然回 ok 避免 enumeration；只 log。除非是配置問題，那 admin 應該看得到 log。
  }

  return { ok: true, email: parsed.data.email };
}
