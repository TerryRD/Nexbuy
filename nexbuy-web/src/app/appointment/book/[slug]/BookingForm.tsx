"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { AppointmentSlot } from "@/lib/types/database";
import { formatDate, formatTime } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Defaults {
  name: string;
  email: string;
  phone: string;
}

interface Props {
  productId: string;
  productSlug: string;
  slots: AppointmentSlot[];
  defaults?: Defaults;
}

interface BookingSuccess {
  appointment_id: string;
  cancel_token: string;
  cancel_url: string;
}

export function BookingForm({ productId, slots, defaults }: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [name, setName] = useState(defaults?.name ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingSuccess | null>(null);
  const [isPending, startTransition] = useTransition();

  // 按日期 group
  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentSlot[]>();
    for (const s of slots) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return Array.from(map.entries());
  }, [slots]);

  if (result) {
    return (
      <div className="space-y-6 rounded-lg border bg-muted/30 p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">預約成功</h2>
          <p className="text-muted-foreground">
            我們會寄確認信到 <span className="font-medium">{email}</span>。
            請於預約時間到店,我們會為你準備好鏡架。
          </p>
        </div>

        <div className="rounded-md border bg-background p-4 text-sm">
          <p className="text-muted-foreground">預約編號</p>
          <p className="font-mono text-xs">{result.appointment_id}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            如需取消,點這個連結(請保留):
          </p>
          <Link
            href={result.cancel_url}
            className="block break-all rounded-md border bg-background p-3 text-sm text-blue-600 hover:underline"
          >
            {result.cancel_url}
          </Link>
        </div>

        <Link
          href="/products?kind=prescription_frame"
          className={buttonVariants({ variant: "outline" })}
        >
          繼續逛其他鏡架
        </Link>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!selectedSlotId) {
      setError("請選一個時段");
      return;
    }
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
            frame_product_id: productId,
            note: note.trim() || null,
          }),
        });

        if (res.status === 409) {
          setError("這個時段剛被別人預約走。請重新整理選其他時段。");
          return;
        }
        if (res.status === 400) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(`輸入格式有誤 (${body?.error ?? "INVALID_INPUT"}),請檢查欄位。`);
          return;
        }
        if (!res.ok) {
          setError("系統錯誤,請稍後再試。");
          return;
        }

        const body = (await res.json()) as BookingSuccess;
        setResult(body);
      } catch (err) {
        console.error(err);
        setError("網路異常,請重試。");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">選擇時段</h2>
        <div className="space-y-4">
          {grouped.map(([date, daySlots]) => (
            <div key={date}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {formatDate(date)}
              </p>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((s) => {
                  const active = selectedSlotId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSlotId(s.id)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:border-foreground"
                      }`}
                    >
                      {formatTime(s.start_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <Input
            id="name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">手機</Label>
          <Input
            id="phone"
            type="tel"
            required
            placeholder="09xxxxxxxx"
            pattern="0\d{8,9}"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="note">備註(選填)</Label>
          <Input
            id="note"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isPending} size="lg">
        {isPending ? "送出中..." : "確認預約"}
      </Button>
    </form>
  );
}
