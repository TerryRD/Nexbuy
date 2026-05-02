import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";
import { SignupForm } from "./SignupForm";

export const metadata = {
  title: "註冊 — 精鋐眼鏡行",
};

export default async function SignupPage() {
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
            建立帳號
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            已經有帳號了？{" "}
            <Link href="/login" className="text-primary hover:underline">
              登入
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

        <SignupForm />
      </div>
    </div>
  );
}
