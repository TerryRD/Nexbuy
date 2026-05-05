"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendNowAction } from "../actions";

interface Props {
  campaignId: string;
  recipientCount: number;
}

export function SendNowButton({ campaignId, recipientCount }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const expected = "立即寄送";
  const canSend = confirmText.trim() === expected && !isPending;

  function onSend() {
    if (!canSend) return;
    const fd = new FormData();
    fd.set("id", campaignId);
    startTransition(async () => {
      await sendNowAction(fd);
      setIsOpen(false);
      setConfirmText("");
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)} disabled={isPending}>
        {isPending ? "寄送中…" : "立即寄送"}
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-now-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 id="send-now-title" className="text-lg font-semibold">
              確定要立即寄送？
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              這封信會寄給{" "}
              <span className="font-semibold text-foreground">
                {recipientCount}
              </span>{" "}
              位訂閱戶（marketing_opt_in=true）。寄出後無法撤回，請先確認主旨與內文是否正確。
            </p>

            {recipientCount === 0 ? (
              <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                目前沒有任何訂閱戶，按下也不會送出任何信。
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                <label
                  htmlFor="send-confirm"
                  className="text-xs text-muted-foreground"
                >
                  在下面欄位輸入「{expected}」以確認：
                </label>
                <input
                  id="send-confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText("");
                }}
                disabled={isPending}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={onSend}
                disabled={!canSend}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPending ? "寄送中…" : "確認寄送"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
