import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string;
  subject: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  scheduled: "已排程",
  sending: "寄送中",
  sent: "已寄出",
  cancelled: "已取消",
};

export default async function AdminMarketingPage() {
  const sb = await createServerSupabase();
  const [{ data: rows }, { count: optInCount }] = await Promise.all([
    sb
      .from("marketing_campaigns")
      .select(
        "id, subject, status, scheduled_at, sent_at, recipient_count, success_count, error_count, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    sb
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("marketing_opt_in", true),
  ]);

  const campaigns = (rows ?? []) as Campaign[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">行銷活動</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            目前可寄送名單：{optInCount ?? 0} 位（marketing_opt_in=true）
          </p>
        </div>
        <Link
          href="/admin/marketing/new"
          className={buttonVariants({ size: "default" })}
        >
          + 新增活動
        </Link>
      </header>

      {campaigns.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-6 text-sm text-muted-foreground">
          還沒有任何活動。
        </p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/marketing/${c.id}`}
                className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.subject}</span>
                      <Badge variant="outline">
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      建立 {new Date(c.created_at).toLocaleDateString("zh-TW")}
                      {c.status === "scheduled" && c.scheduled_at && (
                        <> · 排程於{" "}
                          {new Date(c.scheduled_at).toLocaleString("zh-TW")}
                        </>
                      )}
                      {c.status === "sent" && c.sent_at && (
                        <> · 寄出於{" "}
                          {new Date(c.sent_at).toLocaleString("zh-TW")} ·
                          收件 {c.recipient_count} / 成功 {c.success_count}
                          {c.error_count > 0 ? ` / 失敗 ${c.error_count}` : ""}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
