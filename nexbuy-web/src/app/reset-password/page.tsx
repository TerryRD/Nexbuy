import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "重設密碼 — 精鋐眼鏡行",
};

export default async function ResetPasswordPage() {
  // The user lands here after clicking the recovery link in their email.
  // /auth/callback already exchanged the recovery code for a session, so by
  // the time we render they should be authenticated. If not, the link is
  // stale or invalid — bounce them back to forgot-password.
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center px-4 py-10">
      <div className="w-full space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            重設密碼
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            設定一組新密碼。設定後會直接登入。
          </p>
        </div>

        <ResetPasswordForm />

        <p className="text-sm text-muted-foreground">
          不想重設了？{" "}
          <Link href="/account" className="text-primary hover:underline">
            回到我的帳號
          </Link>
        </p>
      </div>
    </div>
  );
}
