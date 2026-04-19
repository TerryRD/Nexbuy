import { CartContents } from "./CartContents";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">購物車</h1>
      <CartContents />
    </div>
  );
}
