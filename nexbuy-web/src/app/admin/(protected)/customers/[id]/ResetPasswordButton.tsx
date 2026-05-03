"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  resetCustomerPasswordAction,
  type ResetCustomerPasswordState,
} from "./actions";

export function ResetPasswordButton({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState<
    ResetCustomerPasswordState,
    FormData
  >(resetCustomerPasswordAction, null);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  // 已產出臨時密碼 — 顯示給 admin 複製
  if (state?.tempPassword) {
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(state.tempPassword!);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 忽略 clipboard 權限問題；admin 還是可以手動複製
      }
    };
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 text-sm">
        <div className="font-semibold">已產生臨時密碼</div>
        <p className="mt-1 text-muted-foreground">
          請複製下方密碼透過 LINE / 電話 / Email 提供給客戶。
          客戶登入後請提醒他到「我的帳號」改成自己的新密碼。
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-base tracking-wider">
            {state.tempPassword}
          </code>
          <Button type="button" size="sm" variant="outline" onClick={copy}>
            {copied ? "已複製" : "複製"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border bg-card/50 p-5">
      <input type="hidden" name="id" value={id} />
      <div className="text-sm">
        <div className="font-semibold">重設客戶密碼</div>
        <p className="mt-1 text-muted-foreground">
          產生一組 12 字元臨時密碼覆蓋客戶現有密碼。產出後請透過 LINE /
          電話告知客戶，客戶登入後可自行修改。
        </p>
      </div>

      {state?.error && (
        <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {confirming ? (
        <div className="mt-4 flex items-center gap-2">
          <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
            {isPending ? "重設中..." : "確認重設"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(false)}
            disabled={isPending}
          >
            取消
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => setConfirming(true)}
        >
          重設密碼
        </Button>
      )}
    </form>
  );
}
