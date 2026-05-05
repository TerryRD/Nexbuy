import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/safe-next";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";
import { SignupForm } from "./SignupForm";

export const metadata = {
  title: "註冊",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safe = safeNext(next);

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user) {
    redirect(safe);
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
            <Link
              href={`/login?next=${encodeURIComponent(safe)}`}
              className="text-primary hover:underline"
            >
              登入
            </Link>
          </p>
        </div>

        <GoogleSignInButton next={safe} />

        <div className="relative text-center">
          <span className="relative z-10 bg-background px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            或使用 Email
          </span>
          <span className="absolute inset-x-0 top-1/2 -z-0 border-t border-border" />
        </div>

        <SignupForm next={safe} />
      </div>
    </div>
  );
}
