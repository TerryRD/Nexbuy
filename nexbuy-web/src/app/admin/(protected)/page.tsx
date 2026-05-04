import Link from "next/link";
import { AlertTriangle, CalendarClock, ShoppingBag } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice, formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

// Phase 5 PR 1：店家後台 dashboard。今日預約 / 今日訂單 / 低庫存（hardcoded
// 警戒值 3）。低庫存 email 提醒留給 Phase 5 PR 2。

const LOW_STOCK_THRESHOLD = 3;

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: "booked" | "completed" | "noshow" | "cancelled";
  slot: { date: string; start_time: string; end_time: string } | null;
  frame: { name: string } | null;
};

type Order = {
  id: string;
  order_no: string;
  status: string;
  total_cents: number;
  recipient_name: string;
  created_at: string;
};

type LowStockProduct = {
  id: string;
  slug: string;
  name: string;
  finished_stock: number;
};

function todayInTaipei(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function taipeiDayBoundsUtc(date: string): { start: string; end: string } {
  // Asia/Taipei 是 UTC+8 — 沒 DST，直接拼字串扣 8 小時就是 UTC。
  const start = new Date(`${date}T00:00:00+08:00`).toISOString();
  const end = new Date(`${date}T24:00:00+08:00`).toISOString();
  return { start, end };
}

export default async function AdminDashboardPage() {
  const sb = await createServerSupabase();
  const today = todayInTaipei();
  const { start: dayStart, end: dayEnd } = taipeiDayBoundsUtc(today);

  // 今日預約：跑兩段 query（slot.date 不能直接在 nested 過濾），先找今日 slot，
  // 再撈那些 slot 的 appointments。
  const { data: slotsToday } = await sb
    .from("appointment_slots")
    .select("id")
    .eq("date", today);

  const slotIds = (slotsToday ?? []).map((s) => s.id);

  const [
    { data: appointments },
    { data: ordersToday },
    { count: pendingPaymentCount },
    { data: lowStock },
  ] = await Promise.all([
    slotIds.length > 0
      ? sb
          .from("appointments")
          .select(
            `id, customer_name, customer_phone, status,
             slot:appointment_slots ( date, start_time, end_time ),
             frame:products ( name )`,
          )
          .in("slot_id", slotIds)
          .order("slot_id", { ascending: true })
      : Promise.resolve({ data: [] as Appointment[] }),
    sb
      .from("orders")
      .select(
        "id, order_no, status, total_cents, recipient_name, created_at",
      )
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd)
      .order("created_at", { ascending: false }),
    sb
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_payment"),
    sb
      .from("products")
      .select("id, slug, name, finished_stock")
      .eq("kind", "finished")
      .eq("is_online_available", true)
      .lt("finished_stock", LOW_STOCK_THRESHOLD)
      .order("finished_stock", { ascending: true })
      .limit(20),
  ]);

  const appts = (appointments ?? []) as unknown as Appointment[];
  const orders = (ordersToday ?? []) as Order[];
  const lows = (lowStock ?? []) as LowStockProduct[];

  const upcomingToday = appts
    .filter((a) => a.status === "booked" && a.slot)
    .sort((a, b) =>
      (a.slot?.start_time ?? "").localeCompare(b.slot?.start_time ?? ""),
    );

  const todayOrdersTotal = orders.reduce((s, o) => s + o.total_cents, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">總覽</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {today}（Asia/Taipei）— 今日要關注的事都在這裡。
        </p>
      </header>

      {/* KPI row */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="今日預約"
          value={upcomingToday.length}
          suffix="筆 booked"
          href="/admin/appointments"
        />
        <Stat
          label="今日訂單"
          value={orders.length}
          suffix={orders.length > 0 ? formatPrice(todayOrdersTotal) : "—"}
          href="/admin/orders"
        />
        <Stat
          label="待付款"
          value={pendingPaymentCount ?? 0}
          suffix="筆等對帳"
          href="/admin/orders"
          highlight={(pendingPaymentCount ?? 0) > 0}
        />
      </section>

      {/* 今日預約清單 */}
      <Section
        icon={<CalendarClock className="size-4" />}
        title="今日預約"
        empty="今天沒有預約。"
        emptyLink={{ href: "/admin/slots", label: "去設定時段 →" }}
      >
        {upcomingToday.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {upcomingToday.map((a) => {
              const slot = a.slot!;
              const frame = Array.isArray(a.frame) ? a.frame[0] : a.frame;
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 p-3 text-sm"
                >
                  <span className="font-mono text-base font-medium">
                    {formatTime(slot.start_time)}
                  </span>
                  <span className="text-muted-foreground">
                    {a.customer_name}
                  </span>
                  <a
                    href={`tel:${a.customer_phone}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {a.customer_phone}
                  </a>
                  {frame && (
                    <span className="text-xs text-muted-foreground">
                      鏡架：{frame.name}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* 今日訂單 */}
      <Section
        icon={<ShoppingBag className="size-4" />}
        title="今日訂單"
        empty="今天還沒有訂單。"
      >
        {orders.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center gap-3 p-3 text-sm"
              >
                <Link
                  href={`/admin/orders`}
                  className="font-mono text-sm hover:underline"
                >
                  {o.order_no}
                </Link>
                <Badge
                  variant={
                    o.status === "pending_payment" ? "default" : "outline"
                  }
                >
                  {o.status === "pending_payment" ? "待付款" : o.status}
                </Badge>
                <span className="text-muted-foreground">{o.recipient_name}</span>
                <span className="ml-auto font-medium">
                  {formatPrice(o.total_cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 低庫存警示 */}
      <Section
        icon={<AlertTriangle className="size-4 text-amber-600" />}
        title={`低庫存（< ${LOW_STOCK_THRESHOLD}）`}
        empty="所有上架成品庫存都足夠。"
      >
        {lows.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {lows.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 p-3 text-sm"
              >
                <Link
                  href={`/admin/products`}
                  className="font-medium hover:underline"
                >
                  {p.name}
                </Link>
                <span
                  className={
                    p.finished_stock === 0
                      ? "rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                      : "rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
                  }
                >
                  庫存 {p.finished_stock}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  href,
  highlight,
}: {
  label: string;
  value: number;
  suffix?: string;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div
      className={
        "rounded-lg border p-4 transition-colors " +
        (highlight ? "border-primary/40 bg-primary/5" : "bg-card") +
        (href ? " hover:bg-muted/50" : "")
      }
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {suffix && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function Section({
  icon,
  title,
  empty,
  emptyLink,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  emptyLink?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  const hasContent = Boolean(children);
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-medium">
        {icon}
        <span>{title}</span>
      </h2>
      {hasContent ? (
        children
      ) : (
        <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          {empty}
          {emptyLink && (
            <Link
              href={emptyLink.href}
              className="ml-1 text-primary hover:underline"
            >
              {emptyLink.label}
            </Link>
          )}
        </p>
      )}
    </section>
  );
}
