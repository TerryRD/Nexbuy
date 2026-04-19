"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartLink() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1 text-muted-foreground hover:text-foreground"
      aria-label={`購物車 ${totalQuantity} 件`}
    >
      <span>購物車</span>
      {totalQuantity > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}
