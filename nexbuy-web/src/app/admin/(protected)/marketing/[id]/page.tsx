import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CampaignForm } from "../CampaignForm";
import {
  updateCampaignAction,
  scheduleCampaignAction,
  cancelCampaignAction,
} from "../actions";
import { SendNowButton } from "./SendNowButton";

type Params = Promise<{ id: string }>;

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  scheduled: "已排程",
  sending: "寄送中",
  sent: "已寄出",
  cancelled: "已取消",
};

interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

function tomorrow10amLocalIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  // datetime-local 接受 "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const sb = await createServerSupabase();
  const [{ data, error }, { count: optInCount }] = await Promise.all([
    sb
      .from("marketing_campaigns")
      .select(
        "id, subject, body, status, scheduled_at, sent_at, recipient_count, success_count, error_count, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("marketing_opt_in", true),
  ]);

  if (error) throw new Error("Failed to load campaign");
  if (!data) notFound();
  const c = data as Campaign;
  const editable = c.status === "draft" || c.status === "scheduled";
  const recipientCount = optInCount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/marketing"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← 行銷活動清單
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{c.subject}</h1>
          <Badge variant="outline">{STATUS_LABEL[c.status] ?? c.status}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          建立 {new Date(c.created_at).toLocaleString("zh-TW")}
          {c.status === "scheduled" && c.scheduled_at && (
            <> · 排程於 {new Date(c.scheduled_at).toLocaleString("zh-TW")}</>
          )}
          {c.status === "sent" && c.sent_at && (
            <> · 寄出於 {new Date(c.sent_at).toLocaleString("zh-TW")}</>
          )}
        </p>
      </div>

      {/* 寄送結果 */}
      {(c.status === "sent" || c.status === "sending") && (
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="收件人" value={c.recipient_count} />
          <Stat label="成功" value={c.success_count} />
          <Stat label="失敗" value={c.error_count} highlight={c.error_count > 0} />
        </section>
      )}

      {/* 編輯 / 預覽 */}
      {editable ? (
        <section className="space-y-3">
          <h2 className="text-base font-medium">內容</h2>
          <CampaignForm
            initial={{ subject: c.subject, body: c.body }}
            action={updateCampaignAction.bind(null, c.id)}
            submitLabel="儲存變更"
            cancelHref="/admin/marketing"
          />
        </section>
      ) : (
        <section className="space-y-2">
          <h2 className="text-base font-medium">內容</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 font-mono text-xs">
            {c.body}
          </pre>
        </section>
      )}

      {/* Actions */}
      {editable && (
        <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <h2 className="text-base font-medium">寄送</h2>

          {c.status === "draft" && (
            <form
              action={scheduleCampaignAction}
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="id" value={c.id} />
              <div className="space-y-1">
                <label
                  htmlFor="cmp-schedule"
                  className="block text-xs text-muted-foreground"
                >
                  排程時間
                </label>
                <input
                  id="cmp-schedule"
                  name="scheduled_at"
                  type="datetime-local"
                  required
                  defaultValue={tomorrow10amLocalIso()}
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                />
              </div>
              <Button type="submit" variant="outline">
                排程寄送
              </Button>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            <SendNowButton campaignId={c.id} recipientCount={recipientCount} />
            <form action={cancelCampaignAction}>
              <input type="hidden" name="id" value={c.id} />
              <Button type="submit" variant="outline" className="text-destructive">
                取消活動
              </Button>
            </form>
          </div>

          <p className="text-xs text-muted-foreground">
            目前可寄送名單：{recipientCount} 位（marketing_opt_in=true）。
            排程後每 5 分鐘的 cron 會在到時撈出來寄；立即寄送會跳確認 dialog。
            （dispatch 用 status CAS 鎖定，避免併發雙寄）
          </p>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (highlight ? "border-destructive/40 bg-destructive/5" : "bg-card")
      }
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
