"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import { Button } from "@/components/ui/button";

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

  function onAdd() {
    startTransition(() => {
      add({ ...product, quantity: 1 });
      setAdded(true);
      // brief flash then navigate to cart
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
    <div className="space-y-2">
      <Button
        onClick={onAdd}
        disabled={isPending || added}
        size="lg"
        className="w-full sm:w-auto"
      >
        {added ? "已加入,前往購物車..." : "加入購物車"}
      </Button>
    </div>
  );
}
