import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatDate, formatTime } from "@/lib/format";
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
      frame:products ( name )
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
  const frame = data.frame as unknown as { name: string } | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        {data.status === "cancelled" ? "此預約已取消" : "取消預約"}
      </h1>

      <div className="mb-6 space-y-2 rounded-lg border bg-muted/30 p-5 text-sm">
        <Row label="預約人">{data.customer_name}</Row>
        <Row label="Email">{data.customer_email}</Row>
        {frame && <Row label="鏡架">{frame.name}</Row>}
        {slot && (
          <Row label="時段">
            {formatDate(slot.date)} {formatTime(slot.start_time)} –{" "}
            {formatTime(slot.end_time)}
          </Row>
        )}
        <Row label="狀態">
          <StatusBadge status={data.status} />
        </Row>
      </div>

      {data.status === "booked" ? (
        <CancelForm token={token} />
      ) : data.status === "cancelled" ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            此預約已取消。如需重新預約,請回到商品頁。
          </p>
          <Link
            href="/products?kind=prescription_frame"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            → 選其他鏡架預約
          </Link>
        </div>
      ) : (
        <p className="text-muted-foreground">
          此預約狀態為「{data.status}」,無法於此頁面取消。請洽門市。
        </p>
      )}
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
        <Link href="/" className="text-blue-600 hover:underline">
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
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    booked: "已預約",
    completed: "已完成",
    noshow: "未到",
    cancelled: "已取消",
  };
  return <span>{map[status] ?? status}</span>;
}
