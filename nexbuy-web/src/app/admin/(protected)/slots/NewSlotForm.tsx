"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSlot } from "./actions";

export function NewSlotForm({ defaultDate }: { defaultDate?: string }) {
  const [state, formAction, isPending] = useActionState(createSlot, null);
  const formRef = useRef<HTMLFormElement>(null);

  // 送出成功後清空表單
  useEffect(() => {
    if (state && !state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  const date = defaultDate ?? tomorrowISO;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
    >
      <div className="space-y-1">
        <Label htmlFor="slot-date">日期</Label>
        <Input
          id="slot-date"
          name="date"
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          defaultValue={date}
          key={date}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="slot-start">開始</Label>
        <Input
          id="slot-start"
          name="start_time"
          type="time"
          required
          defaultValue="10:00"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="slot-end">結束</Label>
        <Input
          id="slot-end"
          name="end_time"
          type="time"
          required
          defaultValue="11:00"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="slot-capacity">容量</Label>
        <Input
          id="slot-capacity"
          name="capacity"
          type="number"
          min={1}
          max={20}
          required
          defaultValue={1}
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "新增中..." : "新增時段"}
        </Button>
      </div>
      {state?.error && (
        <p className="sm:col-span-5 text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
