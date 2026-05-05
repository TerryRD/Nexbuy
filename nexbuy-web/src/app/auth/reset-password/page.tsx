import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "設定新密碼",
};

/**
 * 完整流程：
 *   1. /forgot-password 表單 → resetPasswordForEmail
 *   2. Supabase 寄信給客戶（含 ?code=...&redirectTo=...）
 *   3. 客戶點信 → /auth/callback?code=... → exchangeCodeForSession
 *   4. callback 發現 next=/auth/reset-password → 跳這裡
 *   5. 這頁讀目前 session（recovery session，user 已存在）
 *      讓客戶設新密碼，updateUser({password})
 *   6. 完成 → /account
 *
 * 沒帶有效 session 落到這頁就直接踢回 /forgot-password。
 */
export default async function ResetPasswordPage() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    // 沒走 callback flow 就直接打網址 / 連結過期 / code 已被消耗
    redirect("/forgot-password?err=expired");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center px-4 py-10">
      <div className="w-full space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            設定新密碼
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            為帳號 <span className="font-mono text-foreground">{user.email}</span>{" "}
            設一組新密碼。設好之後直接帶你去「我的帳號」。
          </p>
        </div>

        <ResetPasswordForm />

        <p className="text-sm text-muted-foreground">
          想取消？{" "}
          <Link href="/login" className="text-primary hover:underline">
            回到登入
          </Link>
        </p>
      </div>
    </div>
  );
}
