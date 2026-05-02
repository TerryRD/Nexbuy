import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
import { CustomerEditForm } from "./EditForm";

export const metadata = {
  title: "客戶詳情 — 管理後台",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  preparing: "備貨中",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  booked: "已預約",
  completed: "已完成",
  noshow: "未到",
  cancelled: "已取消",
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminSupabase();

  const [
    { data: customer },
    { data: orders },
    { data: appointments },
    userResp,
  ] = await Promise.all([
    admin
      .from("customers")
      .select("id, display_name, phone, marketing_opt_in, created_at")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("orders")
      .select(
        "id, order_no, status, total_cents, created_at, items:order_items(product_name, quantity)",
      )
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("appointments")
      .select(
        "id, status, cancel_token, created_at, slot:appointment_slots(date, start_time), frame:products(name)",
      )
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    admin.auth.admin.getUserById(id),
  ]);

  if (!customer) {
    notFound();
  }

  const email = userResp.data?.user?.email ?? "—";
  const totalSpent = (orders ?? []).reduce(
    (sum, o) => sum + (o.total_cents ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/customers"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          ← 客戶清單
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {customer.display_name ?? email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="總訂單" value={`${(orders ?? []).length} 筆`} />
        <KPI label="總消費" value={formatPrice(totalSpent)} />
        <KPI label="總預約" value={`${(appointments ?? []).length} 次`} />
      </div>

      {/* Profile / edit */}
      <Section title="基本資料">
        <CustomerEditForm
          id={customer.id}
          initial={{
            display_name: customer.display_name ?? "",
            phone: customer.phone ?? "",
            marketing_opt_in: customer.marketing_opt_in,
          }}
          email={email}
          createdAt={customer.created_at}
        />
      </Section>

      {/* Appointments */}
      <Section title="預約紀錄">
        {appointments && appointments.length > 0 ? (
          <ul className="space-y-2">
            {appointments.map((a) => {
              const slot = Array.isArray(a.slot) ? a.slot[0] : a.slot;
              const frame = Array.isArray(a.frame) ? a.frame[0] : a.frame;
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-1 rounded-md border bg-card/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {slot
                        ? `${formatDate(slot.date)} ${formatTime(slot.start_time)}`
                        : "(時段資料缺失)"}
                    </div>
                    {frame && (
                      <div className="text-xs text-muted-foreground">
                        鏡架：{frame.name}
                      </div>
                    )}
                  </div>
                  <StatusPill>
                    {APPOINTMENT_STATUS_LABEL[a.status] ?? a.status}
                  </StatusPill>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>沒有預約紀錄</Empty>
        )}
      </Section>

      {/* Orders */}
      <Section title="訂單紀錄">
        {orders && orders.length > 0 ? (
          <ul className="space-y-2">
            {orders.map((o) => {
              const items = Array.isArray(o.items) ? o.items : [];
              const summary =
                items
                  .map((i) => `${i.product_name} × ${i.quantity}`)
                  .join("、") || "—";
              return (
                <li
                  key={o.id}
                  className="rounded-md border bg-card/50 p-4 text-sm"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        href={`/admin/orders`}
                        className="font-medium hover:underline"
                      >
                        {o.order_no}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("zh-TW")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill>
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </StatusPill>
                      <span className="font-medium">
                        {formatPrice(o.total_cents)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {summary}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>沒有訂單紀錄</Empty>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/50 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-heading text-xl font-semibold">{value}</div>
    </div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-background/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
