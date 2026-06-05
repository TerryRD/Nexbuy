"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import { useCart, computeShippingCents } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TW_CITIES } from "@/lib/tw-cities";

export interface CheckoutDefaults {
  name: string;
  email: string;
  phone: string;
}

// ─── Validation helpers ────────────────────────────────────────────────────

const PHONE_RE = /^0\d{8,9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;
  agree?: string;
}

function validateFields(fields: {
  name: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  agree: boolean;
}): FieldErrors {
  const errs: FieldErrors = {};
  if (!fields.name.trim() || fields.name.trim().length > 100)
    errs.name = "請填寫收件人姓名（最多 100 字）";
  if (!PHONE_RE.test(fields.phone.trim()))
    errs.phone = "手機格式不符，請填 09 開頭 09-10 位數字";
  if (!EMAIL_RE.test(fields.email.trim()))
    errs.email = "Email 格式不正確";
  if (!fields.city) errs.city = "請選擇縣市";
  if (!fields.district.trim()) errs.district = "請填寫區/鄉鎮市";
  if (!fields.address.trim() || fields.address.trim().length < 3)
    errs.address = "請填寫詳細地址（至少 3 字）";
  if (!fields.agree) errs.agree = "請勾選同意服務條款與隱私權政策";
  return errs;
}

// ─── Error text ────────────────────────────────────────────────────────────

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="font-mono text-xs text-destructive mt-1">
      {msg}
    </p>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function CheckoutForm({ defaults }: { defaults: CheckoutDefaults }) {
  const router = useRouter();
  const { items, subtotalCents, totalQuantity, clear } = useCart();

  // Form fields
  const [name, setName] = useState(defaults.name);
  const [email, setEmail] = useState(defaults.email);
  const [phone, setPhone] = useState(defaults.phone);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);

  // UI state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  // Individual refs for focus-on-error (not accessed during render)
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLSelectElement>(null);
  const districtRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);

  // useSyncExternalStore returns EMPTY during SSR via getServerSnapshot.
  // Without this hydration flag, users with a non-empty localStorage cart
  // would see a misleading "empty cart" flash on first paint. This is the
  // pattern React docs recommend for this case, the lint rule's generic
  // advice doesn't apply here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // SSR 一開始 items 是 EMPTY，要等 client hydrate 完才知道真實 cart。
  if (!hydrated) {
    return (
      <p className="py-12 text-center text-muted-foreground">載入中...</p>
    );
  }

  if (totalQuantity === 0) {
    return (
      <div className="space-y-4 rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">購物車是空的，無法結帳。</p>
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

  // Focus first invalid field (called only from event handlers, not render)
  function focusFirstError(errs: FieldErrors): void {
    if (errs.name) {
      nameRef.current?.focus();
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (errs.phone) {
      phoneRef.current?.focus();
      phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (errs.email) {
      emailRef.current?.focus();
      emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (errs.city) {
      cityRef.current?.focus();
      cityRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (errs.district) {
      districtRef.current?.focus();
      districtRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (errs.address) {
      addressRef.current?.focus();
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (errs.agree) {
      agreeRef.current?.focus();
      agreeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);

    const errs = validateFields({ name, phone, email, city, district, address, agree });
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      focusFirstError(errs);
      return;
    }

    startTransition(async () => {
      try {
        const shippingAddress = `${city}${district}${address.trim()}`;
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            })),
            customer_name: name.trim(),
            customer_email: email.trim(),
            customer_phone: phone.trim(),
            shipping_address: shippingAddress,
            note: note.trim() || null,
          }),
        });

        if (res.status === 409) {
          setApiError("有商品庫存不足了，請回購物車調整或移除。");
          return;
        }
        if (res.status === 400) {
          setApiError("輸入格式有誤，請檢查姓名、電話、地址。");
          return;
        }
        if (!res.ok) {
          setApiError("系統錯誤，請稍後再試。");
          return;
        }

        const body = (await res.json()) as {
          order_no: string;
          success_url: string;
          lookup_token: string;
        };
        clear();
        // lookup_token 是 IDOR 防線，guest 必帶才能看訂單
        router.push(`/orders/${body.order_no}?t=${body.lookup_token}`);
      } catch (err) {
        console.error(err);
        setApiError("網路異常，請重試。");
      }
    });
  }

  // Per-field onBlur validation
  function touchField(field: keyof FieldErrors) {
    const errs = validateFields({ name, phone, email, city, district, address, agree });
    setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-8 md:grid-cols-[1fr_22rem]">
        {/* ── Left column: form sections ──────────────────────────── */}
        <div className="space-y-8">
          {/* Recipient info */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold tracking-tight">
              收件人資訊
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="co-name">
                  收件人姓名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={nameRef}
                  id="co-name"
                  autoComplete="name"
                  maxLength={100}
                  value={name}
                  aria-invalid={!!fieldErrors.name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => touchField("name")}
                />
                <FieldErr msg={fieldErrors.name} />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="co-phone">
                  手機 <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={phoneRef}
                  id="co-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="09xxxxxxxx"
                  value={phone}
                  aria-invalid={!!fieldErrors.phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => touchField("phone")}
                />
                <FieldErr msg={fieldErrors.phone} />
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-email">
                  Email（寄送訂單通知） <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={emailRef}
                  id="co-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={!!fieldErrors.email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touchField("email")}
                />
                <FieldErr msg={fieldErrors.email} />
              </div>

              {/* City select */}
              <div className="space-y-1.5">
                <Label htmlFor="co-city">
                  縣市 <span className="text-destructive">*</span>
                </Label>
                <select
                  ref={cityRef}
                  id="co-city"
                  value={city}
                  aria-invalid={!!fieldErrors.city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => touchField("city")}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-3 aria-[invalid=true]:ring-destructive/20"
                >
                  <option value="">請選擇縣市</option>
                  {TW_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <FieldErr msg={fieldErrors.city} />
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <Label htmlFor="co-district">
                  區／鄉鎮市 <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={districtRef}
                  id="co-district"
                  autoComplete="address-level3"
                  placeholder="例：中山區"
                  value={district}
                  aria-invalid={!!fieldErrors.district}
                  onChange={(e) => setDistrict(e.target.value)}
                  onBlur={() => touchField("district")}
                />
                <FieldErr msg={fieldErrors.district} />
              </div>

              {/* Detailed address */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-address">
                  詳細地址 <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={addressRef}
                  id="co-address"
                  autoComplete="street-address"
                  maxLength={500}
                  placeholder="例：測試路 1 號 2 樓"
                  value={address}
                  aria-invalid={!!fieldErrors.address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => touchField("address")}
                />
                <FieldErr msg={fieldErrors.address} />
              </div>

              {/* Note */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-note">備註（選填）</Label>
                <Input
                  id="co-note"
                  maxLength={500}
                  placeholder="配鏡需求、到貨時間偏好…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Payment method */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-3">
            <h2 className="text-base font-semibold tracking-tight">付款方式</h2>
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm space-y-1">
              <p className="font-medium">ATM 轉帳（人工確認）</p>
              <p className="text-muted-foreground">
                下單後會顯示匯款資訊。匯完款後店家核對入帳，手動標記為已付款，
                出貨前再寄通知給您，不會在下單當下扣款。
              </p>
            </div>
          </section>

          {/* Terms checkbox */}
          <div className="space-y-1">
            <label
              htmlFor="co-agree"
              className="flex items-start gap-2.5 cursor-pointer select-none"
            >
              <input
                ref={agreeRef}
                type="checkbox"
                id="co-agree"
                checked={agree}
                aria-invalid={!!fieldErrors.agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  if (e.target.checked) {
                    setFieldErrors((prev) => ({ ...prev, agree: undefined }));
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
              />
              <span className="text-sm leading-snug text-foreground">
                我同意{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  服務條款
                </Link>
                {" "}與{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  隱私權政策
                </Link>
              </span>
            </label>
            <FieldErr msg={fieldErrors.agree} />
          </div>

          {/* API-level error */}
          {apiError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              {apiError}
            </div>
          )}
        </div>

        {/* ── Right column: order summary (sticky) ────────────────── */}
        <aside className="h-fit rounded-lg border border-border bg-card p-5 text-sm md:sticky md:top-6">
          <h2 className="mb-4 text-base font-semibold">訂單摘要</h2>

          {/* Item list */}
          <ul className="space-y-2 mb-4">
            {items.map((i) => (
              <li
                key={i.product_id}
                className="flex items-baseline justify-between gap-2"
              >
                <span className="text-foreground truncate">
                  {i.name}{" "}
                  <span className="text-muted-foreground font-mono">
                    × {i.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  {formatPrice(i.price_cents * i.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-border pt-3">
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">小計</dt>
              <dd className="font-mono tabular-nums">{formatPrice(subtotalCents)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">運費</dt>
              <dd className="font-mono tabular-nums">
                {shipping === 0 ? "免運" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <dt className="font-semibold">合計</dt>
              <dd className="font-mono tabular-nums text-lg font-semibold">
                {formatPrice(total)}
              </dd>
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
          <p className="mt-2 text-xs text-muted-foreground text-center">
            送出即同意以 ATM 轉帳付款，不會當下扣款
          </p>
        </aside>
      </div>
    </form>
  );
}
