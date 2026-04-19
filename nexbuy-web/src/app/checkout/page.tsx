import Link from "next/link";
import { CheckoutForm } from "./CheckoutForm";

export default function CheckoutPage() {
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
      <CheckoutForm />
    </div>
  );
}
