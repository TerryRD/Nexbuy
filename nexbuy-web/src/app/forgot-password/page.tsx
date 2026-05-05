import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = {
  title: "忘記密碼",
};

type SearchParams = Promise<{ err?: string }>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user) {
    redirect("/account");
  }

  const sp = await searchParams;
  const expired = sp.err === "expired";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center px-4 py-10">
      <div className="w-full space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            忘記密碼
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            輸入註冊用的 email，我們會寄一封含重設連結的信給你。
            點連結後直接設新密碼，登入即可。
          </p>
        </div>

        {expired && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            重設連結已過期或失效，請重新申請一次。
          </p>
        )}

        <ForgotPasswordForm />

        <p className="text-sm text-muted-foreground">
          想起來了？{" "}
          <Link href="/login" className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary">
            回到登入
          </Link>
        </p>
      </div>
    </div>
  );
}
