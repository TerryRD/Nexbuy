"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartLink() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
      aria-label={`購物車 ${totalQuantity} 件`}
    >
      <ShoppingBag className="size-4" />
      <span className="hidden sm:inline">購物車</span>
      {totalQuantity > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
        >
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}
