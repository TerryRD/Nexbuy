import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "我的帳號 — 精鋐眼鏡行",
};

export default async function AccountPage() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: customer } = await sb
    .from("customers")
    .select("display_name, phone, marketing_opt_in")
    .eq("id", user.id)
    .maybeSingle();

  const name =
    customer?.display_name ?? user.email?.split("@")[0] ?? "顧客";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          嗨，{name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          歡迎回到精鋐眼鏡行。訂單與預約歷史下次更新會在這裡。
        </p>
      </div>

      <div className="space-y-5 rounded-3xl border bg-card/60 p-8 backdrop-blur-sm">
        <Field label="Email">{user.email}</Field>
        {customer?.phone && <Field label="電話">{customer.phone}</Field>}
      </div>

      <div className="mt-10">
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            登出
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-base">{children}</div>
    </div>
  );
}
