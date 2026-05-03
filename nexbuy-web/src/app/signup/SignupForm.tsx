"use client";

import { useActionState } from "react";
import { signupAction, type SignupState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(
    signupAction,
    null,
  );

  if (state?.sent) {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
        <div className="font-semibold">確認信已寄出</div>
        <p className="mt-1 text-muted-foreground">
          請去你的 Email 信箱點裡面的連結完成註冊。沒收到的話檢查垃圾信件夾。
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          如果這個 email 之前是用 Google 註冊的，請改用上方「使用 Google 繼續」登入即可。
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密碼</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">至少 8 個字元</p>
      </div>

      {state?.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? "註冊中..." : "建立帳號"}
      </Button>
    </form>
  );
}
