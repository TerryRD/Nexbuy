"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ForgotPasswordState,
    FormData
  >(requestPasswordResetAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 text-sm">
        <p className="font-medium">已寄出重設連結。</p>
        <p className="mt-2 text-muted-foreground">
          如果 <span className="font-mono">{state.email}</span> 是有效的註冊 email，
          幾分鐘內你會收到一封信。點裡面的連結就能重設密碼。
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          沒收到？檢查垃圾信、確認 email 有沒有打錯。連結 1 小時內有效。
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fp-email">註冊 Email</Label>
        <Input
          id="fp-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.email ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          我們會寄一封含重設連結的信給你。
        </p>
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "寄送中..." : "寄送重設連結"}
      </Button>
    </form>
  );
}
