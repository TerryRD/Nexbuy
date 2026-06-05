"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart, computeShippingCents } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Stepper } from "@/components/site/Stepper";
import { FreeShippingBar } from "@/components/site/FreeShippingBar";

export function CartContents() {
  const { items, setQty, remove, subtotalCents, totalQuantity } = useCart();

  return (
    <div className="container py-10 md:py-14">
      {/* Page title */}
      <h1 className="mb-6 font-serif text-3xl tracking-tight">購物車</h1>

      {/* Step indicator */}
      <div className="mb-8">
        <Stepper steps={["購物車", "結帳資訊", "完成訂單"]} current={0} />
      </div>

      {/* Empty state */}
      {totalQuantity === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-lg text-muted-foreground">購物車是空的</p>
          <Link
            href="/products"
            className={buttonVariants({ size: "lg" })}
          >
            逛商品
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
          {/* Item list */}
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.product_id}
                className="flex gap-4 rounded-lg border border-border bg-card p-4"
              >
                {/* Thumbnail */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="96px"
                      unoptimized={item.image_url.startsWith("data:")}
                      className="object-cover"
                    />
                  ) : null}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-serif font-medium leading-snug hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatPrice(item.price_cents)}
                    </p>
                  </div>

                  {/* Qty stepper + remove */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 rounded-md border border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-md p-0"
                        onClick={() => setQty(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="減少數量"
                      >
                        −
                      </Button>
                      <span className="min-w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-md p-0"
                        onClick={() => setQty(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= 10}
                        aria-label="增加數量"
                      >
                        +
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(item.product_id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`移除 ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">移除</span>
                    </button>
                  </div>
                </div>

                {/* Line subtotal */}
                <p className="shrink-0 self-start font-medium tabular-nums">
                  {formatPrice(item.price_cents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          {/* Summary sidebar */}
          <aside className="md:sticky md:top-6 h-fit rounded-lg border border-border bg-card p-5 space-y-4">
            <FreeShippingBar subtotalCents={subtotalCents} />

            <dl className="space-y-2 text-sm border-t border-border pt-4">
              <Row label="小計">{formatPrice(subtotalCents)}</Row>
              <Row label="運費">
                {computeShippingCents(subtotalCents) === 0
                  ? "免運"
                  : formatPrice(computeShippingCents(subtotalCents))}
              </Row>
              <div className="border-t border-border pt-2">
                <Row label="合計" strong>
                  {formatPrice(subtotalCents + computeShippingCents(subtotalCents))}
                </Row>
              </div>
            </dl>

            <Link
              href="/checkout"
              className={buttonVariants({ size: "lg", className: "w-full" })}
            >
              前往結帳
            </Link>
          </aside>
        </div>
      )}
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
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "text-lg font-semibold" : ""}>{children}</dd>
    </div>
  );
}
