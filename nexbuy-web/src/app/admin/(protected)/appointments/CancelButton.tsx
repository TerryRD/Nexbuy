"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adminCancelAppointment } from "./actions";

interface Props {
  appointmentId: string;
  customerName: string;
}

export function CancelButton({ appointmentId, customerName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    const fd = new FormData();
    fd.set("id", appointmentId);
    startTransition(async () => {
      await adminCancelAppointment(fd);
      setIsOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-destructive"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
      >
        {isPending ? "取消中…" : "代客取消"}
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-apt-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 id="cancel-apt-title" className="text-lg font-semibold">
              確定取消「{customerName}」的預約？
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              客戶端那邊不會自動寄信通知，記得用電話 / LINE 告知。
              該時段的容量會釋放回去（其他客戶可預約）。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                返回
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "取消中…" : "確認取消"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
