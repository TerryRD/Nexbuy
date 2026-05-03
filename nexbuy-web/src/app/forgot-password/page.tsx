import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = {
  title: "忘記密碼 — 精鋐眼鏡行",
};

export default async function ForgotPasswordPage() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user) {
    redirect("/account");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center px-4 py-10">
      <div className="w-full space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            忘記密碼
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            輸入註冊時用的 email，我們會寄一封重設密碼的連結給你。
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="text-sm text-muted-foreground">
          想起來了？{" "}
          <Link href="/login" className="text-primary hover:underline">
            回到登入
          </Link>
        </p>
      </div>
    </div>
  );
}
