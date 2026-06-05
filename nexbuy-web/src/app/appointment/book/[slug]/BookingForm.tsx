"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { AppointmentSlot } from "@/lib/types/database";
import { formatDate, formatTime, formatPrice } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/site/Stepper";
import { Check } from "lucide-react";

interface Defaults {
  name: string;
  email: string;
  phone: string;
}

interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
}

interface Props {
  product: ProductSummary;
  slots: AppointmentSlot[];
  defaults?: Defaults;
}

interface BookingSuccess {
  appointment_id: string;
  cancel_token: string;
  cancel_url: string;
}

const STEPS = ["選擇時段", "聯絡資訊", "預約完成"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{8,9}$/;

export function BookingForm({ product, slots, defaults }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Step 0 state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Step 1 state
  const [name, setName] = useState(defaults?.name ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [note, setNote] = useState("");

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Submission state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingSuccess | null>(null);
  const [isPending, startTransition] = useTransition();

  // Derive distinct dates (sorted, cap 14) and slot map
  const { dateEntries, slotsByDate } = useMemo(() => {
    const map = new Map<string, AppointmentSlot[]>();
    for (const s of slots) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    // All slots passed in are already filtered booked_count < capacity in page.tsx,
    // but we still show all dates and compute remaining per date.
    // We rebuild from the original unfiltered logic: slots prop contains only available ones.
    const sorted = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 14);
    return { dateEntries: sorted, slotsByDate: map };
  }, [slots]);

  // All slots for the selected date (from original slots list — may include full ones
  // if we later accept full-slot display; for now slots prop only has available ones)
  const allSlotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return slotsByDate.get(selectedDate) ?? [];
  }, [selectedDate, slotsByDate]);

  // Selected slot object
  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );

  // Validate step 1 fields; returns true if valid
  function validateStep1(): boolean {
    let valid = true;

    if (!name.trim()) {
      setNameError("請輸入姓名");
      valid = false;
    } else if (name.trim().length > 100) {
      setNameError("姓名不能超過 100 字");
      valid = false;
    } else {
      setNameError(null);
    }

    if (!phone.trim()) {
      setPhoneError("請輸入手機號碼");
      valid = false;
    } else if (!PHONE_RE.test(phone.trim())) {
      setPhoneError("手機格式不正確（例：0912345678）");
      valid = false;
    } else {
      setPhoneError(null);
    }

    if (!email.trim()) {
      setEmailError("請輸入 Email");
      valid = false;
    } else if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Email 格式不正確");
      valid = false;
    } else {
      setEmailError(null);
    }

    return valid;
  }

  function handleSubmit() {
    if (!validateStep1()) return;
    setSubmitError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot_id: selectedSlotId,
            customer_name: name.trim(),
            customer_email: email.trim(),
            customer_phone: phone.trim(),
            frame_product_id: product.id,
            note: note.trim() || null,
          }),
        });

        if (res.status === 409) {
          setSubmitError(
            "這個時段剛被別人預約走。請回到上一步選其他時段。",
          );
          return;
        }
        if (res.status === 400) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setSubmitError(
            `輸入格式有誤 (${body?.error ?? "INVALID_INPUT"})，請檢查欄位。`,
          );
          return;
        }
        if (!res.ok) {
          setSubmitError("系統錯誤，請稍後再試。");
          return;
        }

        const body = (await res.json()) as BookingSuccess;
        setResult(body);
        setStep(2);
      } catch (err) {
        console.error(err);
        setSubmitError("網路異常，請重試。");
      }
    });
  }

  return (
    <div className="space-y-8">
      <Stepper steps={[...STEPS]} current={step} />

      {/* ── Step 0: 選擇時段 ────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Date picker */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">選擇日期</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {dateEntries.map(([date, daySlots]) => {
                const remaining = daySlots.reduce(
                  (acc, s) => acc + (s.capacity - s.booked_count),
                  0,
                );
                const isFull = remaining <= 0;
                const isSelected = selectedDate === date;

                return (
                  <button
                    key={date}
                    type="button"
                    disabled={isFull}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSlotId(null);
                    }}
                    className={[
                      "rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                      isFull
                        ? "cursor-not-allowed opacity-40 border-border"
                        : isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-foreground",
                    ].join(" ")}
                  >
                    <span className="block font-medium leading-snug">
                      {formatDate(date)}
                    </span>
                    <span
                      className={[
                        "block text-xs mt-0.5",
                        isSelected
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {isFull ? "額滿" : `剩 ${remaining} 個位置`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slot grid */}
          {selectedDate && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">
                選擇時段 — {formatDate(selectedDate)}
              </h2>
              <div className="flex flex-wrap gap-2">
                {allSlotsForDate.map((s) => {
                  const isFull = s.booked_count >= s.capacity;
                  const isSelected = selectedSlotId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedSlotId(s.id)}
                      className={[
                        "rounded-md border px-4 py-2 text-sm transition-colors",
                        isFull
                          ? "cursor-not-allowed opacity-40 border-border"
                          : isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-foreground",
                      ].join(" ")}
                    >
                      {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!selectedSlotId && (
            <p className="font-mono text-xs text-muted-foreground">
              請選擇預約時段
            </p>
          )}

          <div className="pt-2">
            <Button
              disabled={!selectedSlotId}
              onClick={() => setStep(1)}
              size="lg"
            >
              下一步
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 1: 聯絡資訊 ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Left: contact form */}
            <div className="space-y-5">
              <h2 className="text-base font-semibold">聯絡資訊</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    姓名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    maxLength={100}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? "name-error" : undefined}
                  />
                  {nameError && (
                    <p
                      id="name-error"
                      role="alert"
                      className="font-mono text-xs text-destructive"
                    >
                      {nameError}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    手機 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09xxxxxxxx"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    aria-invalid={!!phoneError}
                    aria-describedby={phoneError ? "phone-error" : undefined}
                  />
                  {phoneError && (
                    <p
                      id="phone-error"
                      role="alert"
                      className="font-mono text-xs text-destructive"
                    >
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                  />
                  {emailError && (
                    <p
                      id="email-error"
                      role="alert"
                      className="font-mono text-xs text-destructive"
                    >
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Note */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="note">備註（選填）</Label>
                  <Input
                    id="note"
                    maxLength={500}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right: booking summary card */}
            <div>
              <div className="rounded-lg border bg-card p-5 space-y-4 sticky top-6">
                <h3 className="font-semibold text-sm">預約摘要</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">鏡框</span>
                    <span className="font-medium text-right">{product.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">鏡框價</span>
                    <span className="font-medium">
                      {formatPrice(product.price_cents)}
                    </span>
                  </div>
                  {selectedSlot && (
                    <>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">日期</span>
                        <span className="font-medium text-right">
                          {formatDate(selectedSlot.date)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">時段</span>
                        <span className="font-medium">
                          {formatTime(selectedSlot.start_time)}–
                          {formatTime(selectedSlot.end_time)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  鏡片現場另計
                </p>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSubmitError(null);
                setStep(0);
              }}
            >
              上一步
            </Button>
            <Button
              disabled={isPending}
              onClick={handleSubmit}
              size="lg"
            >
              {isPending ? "送出中..." : "送出預約"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: 預約完成 ────────────────────────────────────────── */}
      {step === 2 && result && (
        <div className="space-y-6 rounded-lg border bg-card p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">預約成功</h2>
              <p className="text-sm text-muted-foreground">
                確認信已寄至 <span className="font-medium text-foreground">{email}</span>。
                請於預約時間到店，我們會備好鏡架。
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-md border bg-background p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">鏡框</span>
              <span className="font-medium">{product.name}</span>
            </div>
            {selectedSlot && (
              <>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">日期</span>
                  <span className="font-medium">{formatDate(selectedSlot.date)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">時段</span>
                  <span className="font-medium">
                    {formatTime(selectedSlot.start_time)}–
                    {formatTime(selectedSlot.end_time)}
                  </span>
                </div>
              </>
            )}
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-muted-foreground text-xs">預約編號</p>
              <p className="font-mono text-xs">{result.appointment_id}</p>
            </div>
          </div>

          {/* Cancel / manage link */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">如需取消或查看預約詳情：</p>
            <Link
              href={result.cancel_url}
              className="inline-flex items-center gap-1 text-sm underline underline-offset-4 hover:text-muted-foreground"
            >
              查看 / 管理預約
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/products?kind=prescription_frame"
              className={buttonVariants({ variant: "outline" })}
            >
              逛其他鏡框
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
