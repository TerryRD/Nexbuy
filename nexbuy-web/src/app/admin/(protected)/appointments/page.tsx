import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatus } from "./actions";
import { CancelButton } from "./CancelButton";

type AppointmentRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: "booked" | "completed" | "noshow" | "cancelled";
  note: string | null;
  created_at: string;
  slot: { date: string; start_time: string; end_time: string } | null;
  frame: { name: string } | null;
};

const statusLabels: Record<AppointmentRow["status"], string> = {
  booked: "已預約",
  completed: "已完成",
  noshow: "未到",
  cancelled: "已取消",
};

const statusVariants: Record<
  AppointmentRow["status"],
  "default" | "outline"
> = {
  booked: "default",
  completed: "outline",
  noshow: "outline",
  cancelled: "outline",
};

function taipeiToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function taipeiWeekEnd(today: string): string {
  const d = new Date(`${today}T00:00:00+08:00`);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

type ViewMode = "today" | "week" | "all";

const isViewMode = (v: string | undefined): v is ViewMode =>
  v === "today" || v === "week" || v === "all";

type SearchParams = Promise<{ view?: string }>;

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const view: ViewMode = isViewMode(sp.view) ? sp.view : "all";

  const sb = await createServerSupabase();
  const today = taipeiToday();
  const weekEnd = taipeiWeekEnd(today);

  let query = sb
    .from("appointments")
    .select(
      `
      id,
      customer_name,
      customer_email,
      customer_phone,
      status,
      note,
      created_at,
      slot:appointment_slots ( date, start_time, end_time ),
      frame:products ( name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  // 篩選依賴 appointment_slots.date 而非 appointments 自身欄位。
  // PostgREST 不支援在 nested 過濾再 join 回主表排序，所以在 JS 側過濾。
  const { data, error } = await query;

  if (error) {
    console.error("appointments list error:", error);
    throw new Error("Failed to load appointments");
  }

  let rows = (data ?? []) as unknown as AppointmentRow[];

  if (view === "today") {
    rows = rows.filter((r) => r.slot?.date === today);
  } else if (view === "week") {
    rows = rows.filter(
      (r) => r.slot && r.slot.date >= today && r.slot.date <= weekEnd,
    );
  }

  const nowMs = Date.now();
  const upcoming = rows.filter(
    (r) =>
      r.status === "booked" &&
      r.slot &&
      new Date(`${r.slot.date}T${r.slot.start_time}`).getTime() >= nowMs,
  );
  const past = rows.filter((r) => !upcoming.includes(r));

  const viewLabels: Record<ViewMode, string> = {
    today: `今天 (${today})`,
    week: `本週 (${today} – ${weekEnd})`,
    all: "全部",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">預約清單</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          未來的預約放最上面。到店後標記「已完成」或「未到」。
        </p>
      </header>

      {/* 日期篩選 tabs */}
      <nav className="flex gap-2 flex-wrap">
        {(["today", "week", "all"] as const).map((v) => (
          <Link
            key={v}
            href={v === "all" ? "/admin/appointments" : `/admin/appointments?view=${v}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              view === v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-foreground"
            }`}
          >
            {viewLabels[v]}
          </Link>
        ))}
      </nav>

      <Section title={`即將到來 (${upcoming.length})`} rows={upcoming} empty="沒有即將到來的預約。" />
      <Section title={`歷史 / 已完成 / 已取消 (${past.length})`} rows={past} empty="沒有歷史紀錄。" />
    </div>
  );
}

function Section({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: AppointmentRow[];
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <AppointmentCard key={r.id} row={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AppointmentCard({ row }: { row: AppointmentRow }) {
  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.customer_name}</span>
            <Badge variant={statusVariants[row.status]}>
              {statusLabels[row.status]}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>
              {row.slot
                ? `${formatDate(row.slot.date)} ${formatTime(row.slot.start_time)}–${formatTime(row.slot.end_time)}`
                : "(時段資料遺失)"}
            </p>
            <p>鏡架:{row.frame?.name ?? "(未指定)"}</p>
            <p>
              <a href={`tel:${row.customer_phone}`} className="hover:underline">
                {row.customer_phone}
              </a>
              {" · "}
              <a href={`mailto:${row.customer_email}`} className="hover:underline">
                {row.customer_email}
              </a>
            </p>
            {row.note && <p className="text-xs italic">備註:{row.note}</p>}
          </div>
        </div>

        {row.status === "booked" && (
          <div className="flex flex-wrap gap-2">
            <form action={updateAppointmentStatus}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="status" value="completed" />
              <Button type="submit" size="sm">
                標記已完成
              </Button>
            </form>
            <form action={updateAppointmentStatus}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="status" value="noshow" />
              <Button type="submit" size="sm" variant="outline">
                標記未到
              </Button>
            </form>
            <CancelButton
              appointmentId={row.id}
              customerName={row.customer_name}
            />
          </div>
        )}
      </div>
    </li>
  );
}
