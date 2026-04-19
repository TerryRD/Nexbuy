import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatus } from "./actions";

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

export default async function AdminAppointmentsPage() {
  const sb = await createServerSupabase();
  const { data, error } = await sb
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

  if (error) {
    console.error("appointments list error:", error);
    throw new Error("Failed to load appointments");
  }

  const rows = (data ?? []) as unknown as AppointmentRow[];
  // Server Component: runs once per request, Date.now() is fine here.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const upcoming = rows.filter(
    (r) =>
      r.status === "booked" &&
      r.slot &&
      new Date(`${r.slot.date}T${r.slot.start_time}`).getTime() >= nowMs,
  );
  const past = rows.filter((r) => !upcoming.includes(r));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">預約清單</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          未來的預約放最上面。到店後標記「已完成」或「未到」,
          顧客取消走自己的 email 連結(這邊看不到取消按鈕)。
        </p>
      </header>

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
          <div className="flex gap-2">
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
          </div>
        )}
      </div>
    </li>
  );
}
