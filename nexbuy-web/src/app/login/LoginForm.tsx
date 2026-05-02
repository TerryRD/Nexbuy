"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);

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
          autoComplete="current-password"
        />
      </div>

      {state?.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? "登入中..." : "登入"}
      </Button>
    </form>
  );
}
