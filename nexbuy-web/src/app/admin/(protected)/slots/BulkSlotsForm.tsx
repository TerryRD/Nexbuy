"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { bulkCreateSlots, type BulkCreateResult } from "./actions";

const WEEKDAYS = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 0, label: "日" },
];

interface Props {
  defaultStartDate: string; // YYYY-MM-DD
}

export function BulkSlotsForm({ defaultStartDate }: Props) {
  const [state, formAction, isPending] = useActionState<
    BulkCreateResult | null,
    FormData
  >(bulkCreateSlots, null);

  const [open, setOpen] = useState(false);
  const [times, setTimes] = useState<string[]>(["10:00", "14:00", "18:00"]);
  const [weekdays, setWeekdays] = useState<Set<number>>(
    new Set([1, 2, 3, 4, 5]),
  );

  function toggleWeekday(v: number) {
    const next = new Set(weekdays);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setWeekdays(next);
  }

  function setTime(i: number, v: string) {
    setTimes((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function addTimeRow() {
    setTimes((prev) => [...prev, "10:00"]);
  }

  function removeTimeRow(i: number) {
    setTimes((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="text-base font-semibold">批次新增時段（recurring）</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            一次塞下 N 週，避免每天手動點。已存在的（同日期 + 開始時間）會自動跳過。
          </p>
        </div>
        <span aria-hidden className="text-muted-foreground">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <form action={formAction} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="bulk-start" className="text-xs text-muted-foreground">
                起始日（含當天）
              </label>
              <input
                id="bulk-start"
                name="start_date"
                type="date"
                required
                defaultValue={defaultStartDate}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="bulk-weeks" className="text-xs text-muted-foreground">
                週數（1–12）
              </label>
              <input
                id="bulk-weeks"
                name="weeks"
                type="number"
                min={1}
                max={12}
                required
                defaultValue={4}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="bulk-cap" className="text-xs text-muted-foreground">
                每段容量
              </label>
              <input
                id="bulk-cap"
                name="capacity"
                type="number"
                min={1}
                max={20}
                required
                defaultValue={1}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">星期幾要開（多選）</span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => {
                const active = weekdays.has(w.value);
                return (
                  <label
                    key={w.value}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={w.value}
                      checked={active}
                      onChange={() => toggleWeekday(w.value)}
                      className="hidden"
                    />
                    週{w.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">每天的時段</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addTimeRow}
              >
                + 加一段
              </Button>
            </div>
            <div className="space-y-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    name="times"
                    type="time"
                    required
                    value={t}
                    onChange={(e) => setTime(i, e.target.value)}
                    className="h-9 w-32 rounded-md border bg-background px-3 text-sm"
                  />
                  {times.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTimeRow(i)}
                      className="text-destructive"
                    >
                      移除
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="bulk-duration"
              className="text-xs text-muted-foreground"
            >
              每段長度（分鐘）
            </label>
            <input
              id="bulk-duration"
              name="duration_minutes"
              type="number"
              min={15}
              max={180}
              step={5}
              required
              defaultValue={60}
              className="h-9 w-32 rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {state?.error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state && !state.error && state.inserted !== undefined && (
            <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              新增了 <strong>{state.inserted}</strong> 段
              {state.skipped ? (
                <>
                  ，跳過 <strong>{state.skipped}</strong> 段（已存在）
                </>
              ) : null}
              。
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "塞入中…" : "批次新增"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
