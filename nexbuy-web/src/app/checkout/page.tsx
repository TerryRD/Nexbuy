import { createServerSupabase } from "@/lib/supabase/server";
import { Stepper } from "@/components/site/Stepper";
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
    <div className="container py-10 md:py-14">
      <div className="mb-8">
        <Stepper steps={["購物車", "結帳資訊", "完成訂單"]} current={1} />
      </div>
      <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight">
        結帳資訊
      </h1>
      <CheckoutForm defaults={defaults} />
    </div>
  );
}
