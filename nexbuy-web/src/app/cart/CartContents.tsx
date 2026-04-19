"use client";

import Link from "next/link";
import { useCart, computeShippingCents } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";

export function CartContents() {
  const { items, setQty, remove, subtotalCents, totalQuantity } = useCart();

  if (totalQuantity === 0) {
    return (
      <div className="space-y-4 rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">購物車目前是空的。</p>
        <Link
          href="/products?kind=finished"
          className={buttonVariants({ variant: "outline" })}
        >
          去逛成品眼鏡
        </Link>
      </div>
    );
  }

  const shipping = computeShippingCents(subtotalCents);
  const total = subtotalCents + shipping;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.product_id}
            className="flex gap-4 rounded-lg border p-4"
          >
            <div
              className="h-20 w-20 shrink-0 rounded-md border bg-muted/50"
              aria-hidden
            />
            <div className="flex flex-1 flex-col justify-between gap-2">
              <div>
                <Link
                  href={`/products/${item.slug}`}
                  className="font-medium hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.price_cents)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQty(item.product_id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </Button>
                  <span className="min-w-8 text-center tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQty(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= 10}
                  >
                    +
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.product_id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  移除
                </button>
              </div>
            </div>
            <p className="shrink-0 self-start font-medium">
              {formatPrice(item.price_cents * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <aside className="rounded-lg border bg-muted/20 p-5 text-sm h-fit">
        <h2 className="mb-4 text-base font-semibold">結帳摘要</h2>
        <dl className="space-y-2">
          <Row label="商品小計">{formatPrice(subtotalCents)}</Row>
          <Row label="運費">
            {shipping === 0 ? "免運" : formatPrice(shipping)}
          </Row>
          {shipping !== 0 && subtotalCents > 0 && (
            <p className="text-xs text-muted-foreground">
              滿 NT$3,000 免運;差{" "}
              <span className="font-medium">
                {formatPrice(300000 - subtotalCents)}
              </span>
            </p>
          )}
          <div className="border-t pt-2">
            <Row label="總計" strong>
              {formatPrice(total)}
            </Row>
          </div>
        </dl>

        <Link
          href="/checkout"
          className={buttonVariants({
            size: "lg",
            className: "mt-5 w-full",
          })}
        >
          前往結帳
        </Link>
      </aside>
    </div>
  );
}

function Row({
  label,
  children,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={strong ? "text-lg font-semibold" : ""}>{children}</dd>
    </div>
  );
}
