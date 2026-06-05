import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatDate, formatTime, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { StoreInfoCard } from "@/components/site/StoreInfoCard";
import { CancelForm } from "./CancelForm";

type Params = Promise<{ token: string }>;

const TOKEN_RE = /^[0-9a-f]{32}$/;

export default async function AppointmentCancelPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;

  if (!TOKEN_RE.test(token)) {
    return <Invalid />;
  }

  // 用 service role 讀,因為 guest appointment 不在 RLS 可讀範圍。
  // 這裡已經用 32-char hex token 驗身份了,service role 只是繞 RLS。
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("appointments")
    .select(
      `
      id,
      status,
      customer_name,
      customer_email,
      cancel_token,
      slot:appointment_slots ( date, start_time, end_time ),
      frame:products ( name, price_cents )
    `,
    )
    .eq("cancel_token", token)
    .maybeSingle();

  if (error) {
    console.error("cancel page query failed:", error);
    throw new Error("Failed to load appointment");
  }

  if (!data) return <Invalid />;

  const slot = data.slot as unknown as {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  const frame = data.frame as unknown as {
    name: string;
    price_cents: number | null;
  } | null;

  const isBooked = data.status === "booked";
  const isCancelled = data.status === "cancelled";

  return (
    <div className="container py-10 md:py-14">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Page heading */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            預約確認
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-foreground">
            {isCancelled ? "此預約已取消" : "預約詳情"}
          </h1>
        </div>

        {/* Appointment summary card */}
        <div className="rounded-xl border border-border bg-card text-foreground shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              預約資訊
            </p>
          </div>
          <div className="space-y-3 px-5 py-4 text-sm">
            <Row label="預約人">{data.customer_name}</Row>
            <Row label="Email">{data.customer_email}</Row>
            {slot && (
              <Row label="時段">
                {formatDate(slot.date)}{" "}
                {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
              </Row>
            )}
            <Row label="狀態">
              <StatusBadge status={data.status} />
            </Row>
          </div>
        </div>

        {/* Frame summary block */}
        {frame && (
          <div className="rounded-xl border border-border bg-card text-foreground shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                鏡框摘要
              </p>
            </div>
            <div className="space-y-2 px-5 py-4 text-sm">
              <Row label="鏡框名稱">{frame.name}</Row>
              {frame.price_cents != null && (
                <Row label="鏡框價格">
                  {formatPrice(frame.price_cents)}
                </Row>
              )}
              <p className="pt-1 text-xs text-muted-foreground">
                鏡片現場另計（鏡片費用依度數與功能於到店配鏡時報價）
              </p>
            </div>
          </div>
        )}

        {/* T-24h reminder note */}
        <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          我們會在預約前 24 小時以 Email 提醒你；如需更改時段，請先取消後重新預約。
        </div>

        {/* Status-conditional action area */}
        {isBooked ? (
          <CancelForm token={token} />
        ) : isCancelled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              此預約已取消。如需重新預約,請回到商品頁。
            </p>
            <Link
              href="/products?kind=prescription_frame"
              className="inline-flex items-center text-sm text-primary underline-offset-2 hover:underline"
            >
              → 選其他鏡架預約
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            此預約狀態為「{data.status}」,無法於此頁面取消。請洽門市。
          </p>
        )}

        {/* Store info + map */}
        <StoreInfoCard />

      </div>
    </div>
  );
}

function Invalid() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="mb-3 text-3xl font-semibold tracking-tight">
        找不到預約
      </h1>
      <p className="text-muted-foreground">
        這個連結無效或已過期。如有疑問請直接聯絡門市。
      </p>
      <div className="mt-6">
        <Link href="/" className="text-primary underline-offset-2 hover:underline">
          回首頁
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    booked: { label: "已預約", variant: "default" },
    completed: { label: "已完成", variant: "secondary" },
    noshow: { label: "未到", variant: "destructive" },
    cancelled: { label: "已取消", variant: "outline" },
  };
  const entry = map[status];
  if (!entry) return <span>{status}</span>;
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
