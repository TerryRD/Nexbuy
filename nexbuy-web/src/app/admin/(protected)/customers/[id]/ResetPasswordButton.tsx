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

  // 已寄出 — 顯示「寄到 ○○○」確認訊息
  if (state?.sentTo) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 text-sm">
        <div className="font-semibold">已寄重設連結</div>
        <p className="mt-1 text-muted-foreground">
          已寄到{" "}
          <span className="font-mono text-foreground">{state.sentTo}</span>。
          客戶點信內連結後可以自己設新密碼，admin 不會看到明文密碼。
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          連結 1 小時內有效。客戶說沒收到 → 看垃圾信、或再按一次重新寄。
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border bg-card/50 p-5">
      <input type="hidden" name="id" value={id} />
      <div className="text-sm">
        <div className="font-semibold">寄重設密碼連結</div>
        <p className="mt-1 text-muted-foreground">
          寄一封含重設連結的信到客戶註冊 email，客戶點連結自己設新密碼。
          admin 不會碰到明文密碼。
        </p>
      </div>

      {state?.error && (
        <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {confirming ? (
        <div className="mt-4 flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "寄送中..." : "確認寄出"}
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
          寄重設連結
        </Button>
      )}
    </form>
  );
}
