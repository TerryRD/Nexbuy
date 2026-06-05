"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

const MAX_QTY = 10;
const MIN_QTY = 1;

interface Props {
  product: Pick<
    CartItem,
    "product_id" | "slug" | "name" | "price_cents" | "image_url"
  >;
  disabled?: boolean;
  disabledReason?: string;
}

export function AddToCartButton({ product, disabled, disabledReason }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  function decrement() {
    setQty((q) => Math.max(MIN_QTY, q - 1));
  }

  function increment() {
    setQty((q) => Math.min(MAX_QTY, q + 1));
  }

  function onAdd() {
    startTransition(() => {
      add({ ...product, quantity: qty });
      setAdded(true);
      setTimeout(() => {
        router.push("/cart");
      }, 400);
    });
  }

  if (disabled) {
    return (
      <div className="space-y-2">
        <Button size="lg" disabled className="w-full sm:w-auto">
          {disabledReason ?? "不可購買"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quantity stepper */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="減少數量"
          onClick={decrement}
          disabled={qty <= MIN_QTY || isPending || added}
          className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>

        <span
          className="min-w-[2rem] text-center text-sm font-medium tabular-nums"
          aria-live="polite"
          aria-label={`數量 ${qty}`}
        >
          {qty}
        </span>

        <button
          type="button"
          aria-label="增加數量"
          onClick={increment}
          disabled={qty >= MAX_QTY || isPending || added}
          className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Add to cart button */}
      <Button
        onClick={onAdd}
        disabled={isPending || added}
        size="lg"
        className="w-full sm:w-auto"
      >
        {added
          ? "已加入，前往購物車..."
          : `加入購物車 · ${formatPrice(product.price_cents * qty)}`}
      </Button>
    </div>
  );
}
