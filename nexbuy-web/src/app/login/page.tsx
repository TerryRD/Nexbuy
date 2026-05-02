import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "登入 — 精鋐眼鏡行",
};

export default async function LoginPage() {
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
            登入
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            還沒有帳號？{" "}
            <Link href="/signup" className="text-primary hover:underline">
              建立一個
            </Link>
          </p>
        </div>

        <GoogleSignInButton />

        <div className="relative text-center">
          <span className="relative z-10 bg-background px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            或使用 Email
          </span>
          <span className="absolute inset-x-0 top-1/2 -z-0 border-t border-border" />
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
