import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = {
  title: "忘記密碼 — 精鋐眼鏡行",
};

const SUPPORT_EMAIL = "jinghong.optical@gmail.com";

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
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            請寄信到下方店家信箱、附上你註冊用的 email，我們會手動為你重設密碼，
            重設後會把臨時密碼回傳給你。登入後可以到「我的帳號」改成新密碼。
          </p>
        </div>

        <div className="rounded-lg border bg-card/60 p-5 backdrop-blur-sm">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            店家聯絡信箱
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("重設密碼申請")}`}
            className="mt-2 inline-block font-mono text-base text-primary hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

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
