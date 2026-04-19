"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { useCart, computeShippingCents } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotalCents, totalQuantity, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  // useSyncExternalStore returns EMPTY during SSR via getServerSnapshot.
  // Without this hydration flag, users with a non-empty localStorage cart
  // would see a misleading "empty cart" flash on first paint. This is the
  // pattern React docs recommend for this case, the lint rule's generic
  // advice doesn't apply here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // SSR 一開始 items 是 EMPTY,要等 client hydrate 完才知道真實 cart。
  if (!hydrated) {
    return (
      <p className="py-12 text-center text-muted-foreground">載入中...</p>
    );
  }

  if (totalQuantity === 0) {
    return (
      <div className="space-y-4 rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">購物車是空的,無法結帳。</p>
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

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            })),
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            shipping_address: address.trim(),
            note: note.trim() || null,
          }),
        });

        if (res.status === 409) {
          setError("有商品庫存不足了,請回購物車調整或移除。");
          return;
        }
        if (res.status === 400) {
          setError("輸入格式有誤,請檢查姓名、電話、地址。");
          return;
        }
        if (!res.ok) {
          setError("系統錯誤,請稍後再試。");
          return;
        }

        const body = (await res.json()) as {
          order_no: string;
          success_url: string;
        };
        clear();
        router.push(`/orders/${body.order_no}`);
      } catch (err) {
        console.error(err);
        setError("網路異常,請重試。");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">收件人資訊</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="co-name">姓名</Label>
              <Input
                id="co-name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-phone">手機</Label>
              <Input
                id="co-phone"
                type="tel"
                required
                placeholder="09xxxxxxxx"
                pattern="0\d{8,9}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="co-address">寄送地址</Label>
              <Input
                id="co-address"
                required
                maxLength={500}
                placeholder="例:台北市中山區測試路 1 號 2 樓"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="co-note">備註(選填)</Label>
              <Input
                id="co-note"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">付款方式</h2>
          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <p className="font-medium">ATM 轉帳(人工確認)</p>
            <p className="mt-1 text-muted-foreground">
              下單後會顯示匯款資訊。匯完款店家會核對後手動標記為已付款,
              出貨前再通知您。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">訂購商品</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.product_id} className="flex justify-between">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{formatPrice(i.price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <aside className="rounded-lg border bg-muted/20 p-5 text-sm h-fit md:sticky md:top-6">
        <h2 className="mb-4 text-base font-semibold">結帳摘要</h2>
        <dl className="space-y-2">
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">商品小計</dt>
            <dd>{formatPrice(subtotalCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">運費</dt>
            <dd>{shipping === 0 ? "免運" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t pt-2">
            <dt className="font-semibold">總計</dt>
            <dd className="text-lg font-semibold">{formatPrice(total)}</dd>
          </div>
        </dl>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="mt-5 w-full"
        >
          {isPending ? "送出中..." : "送出訂單"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          送出即同意為 ATM 轉帳方式。不會當下扣款。
        </p>
      </aside>
    </form>
  );
}
