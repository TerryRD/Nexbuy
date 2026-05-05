"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

interface Props {
  initial: { subject: string; body: string };
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  submitLabel: string;
  cancelHref: string;
}

export function CampaignForm({ initial, action, submitLabel, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  const fieldErr = (k: string) => state?.fieldErrors?.[k]?.[0];

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="cmp-subject">主旨</Label>
        <Input
          id="cmp-subject"
          name="subject"
          required
          maxLength={200}
          defaultValue={initial.subject}
          placeholder="春日新款上架，限定 9 折"
        />
        <p className="text-xs text-muted-foreground">
          寄出時會自動加上「[精鋐眼鏡行] 」前綴。
        </p>
        {fieldErr("subject") && (
          <p className="text-xs text-destructive">{fieldErr("subject")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cmp-body">內容（HTML 或純文字）</Label>
        <Textarea
          id="cmp-body"
          name="body"
          required
          rows={14}
          maxLength={50_000}
          defaultValue={initial.body}
          placeholder={`<p>嗨，</p>\n<p>春日新款上架了，這個月來店配鏡享 9 折…</p>\n<p><a href="https://...">看更多</a></p>`}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          寄出時自動套 wrapper（標題 / 退訂提示）。允許 tag：
          &lt;p&gt; &lt;br&gt; &lt;a&gt; &lt;strong&gt; &lt;em&gt; &lt;ul&gt; &lt;ol&gt; &lt;li&gt; &lt;h1&gt;~&lt;h4&gt; &lt;blockquote&gt; &lt;hr&gt;。
          其他 tag、所有 attribute（除了 a 的 href）會被剝掉，連結強制 http(s) / mailto。
        </p>
        {fieldErr("body") && (
          <p className="text-xs text-destructive">{fieldErr("body")}</p>
        )}
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : submitLabel}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          取消
        </Link>
      </div>
    </form>
  );
}
