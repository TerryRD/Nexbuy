"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction, type ChangePasswordState } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // 成功後清空表單，避免密碼留在 input 裡
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-3xl border bg-card/60 p-6 backdrop-blur-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="cp-current">目前密碼</Label>
        <Input
          id="cp-current"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
        />
        <p className="text-xs text-muted-foreground">
          為了安全，改密碼前要先驗證一次。
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cp-password">新密碼</Label>
          <Input
            id="cp-password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">至少 8 個字元</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-confirm">再次輸入新密碼</Label>
          <Input
            id="cp-confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          密碼已更新，下次登入請使用新密碼。
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "更新中..." : "更新密碼"}
        </Button>
      </div>
    </form>
  );
}
