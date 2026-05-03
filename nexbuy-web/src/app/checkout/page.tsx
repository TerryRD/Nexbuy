import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { CheckoutForm, type CheckoutDefaults } from "./CheckoutForm";

export default async function CheckoutPage() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let defaults: CheckoutDefaults = {
    name: "",
    email: "",
    phone: "",
  };

  if (user) {
    const { data: customer } = await sb
      .from("customers")
      .select("display_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    defaults = {
      name: customer?.display_name ?? "",
      email: user.email ?? "",
      phone: customer?.phone ?? "",
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/cart"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 回購物車
        </Link>
      </div>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">結帳</h1>
      <CheckoutForm defaults={defaults} />
    </div>
  );
}
