"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCustomerAction, type UpdateCustomerState } from "./actions";

interface Props {
  id: string;
  initial: {
    display_name: string;
    phone: string;
    marketing_opt_in: boolean;
  };
  email: string;
  createdAt: string;
}

export function CustomerEditForm({ id, initial, email, createdAt }: Props) {
  const [state, formAction, isPending] = useActionState<
    UpdateCustomerState,
    FormData
  >(updateCustomerAction, null);

  return (
    <form action={formAction} className="space-y-5 rounded-lg border bg-card/50 p-5">
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <div className="text-sm">{email}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Email 由 auth 管，這邊改不到
          </p>
        </Field>
        <Field label="註冊日期">
          <div className="text-sm">
            {new Date(createdAt).toLocaleDateString("zh-TW")}
          </div>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="display_name">顯示名稱</Label>
          <Input
            id="display_name"
            name="display_name"
            defaultValue={initial.display_name}
            placeholder="客戶顯示用名稱"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">電話</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initial.phone}
            placeholder="手機 / 市話"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="marketing_opt_in"
          defaultChecked={initial.marketing_opt_in}
          className="size-4"
        />
        <span>已訂閱行銷通訊</span>
      </label>

      {state?.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          已更新
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "儲存中..." : "儲存"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
