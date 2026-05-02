import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

export const metadata = {
  title: "我的帳號 — 精鋐眼鏡行",
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

export default async function AccountPage() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: customer }, { data: orders }, { data: appointments }] =
    await Promise.all([
      sb
        .from("customers")
        .select("display_name, phone")
        .eq("id", user.id)
        .maybeSingle(),
      sb
        .from("orders")
        .select(
          "id, order_no, status, total_cents, created_at, items:order_items(product_name, quantity)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      sb
        .from("appointments")
        .select(
          "id, status, cancel_token, created_at, slot:appointment_slots(date, start_time), frame:products(name, slug)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const name = customer?.display_name ?? user.email?.split("@")[0] ?? "顧客";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          嗨，{name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          歡迎回到精鋐眼鏡行。
        </p>
      </div>

      {/* Profile */}
      <Section title="個人資料">
        <div className="space-y-4 rounded-3xl border bg-card/60 p-6 backdrop-blur-sm">
          <Field label="Email">{user.email}</Field>
          {customer?.phone && <Field label="電話">{customer.phone}</Field>}
        </div>
      </Section>

      {/* Appointments */}
      <Section title="我的預約">
        {appointments && appointments.length > 0 ? (
          <ul className="space-y-3">
            {appointments.map((a) => {
              const slot = Array.isArray(a.slot) ? a.slot[0] : a.slot;
              const frame = Array.isArray(a.frame) ? a.frame[0] : a.frame;
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 rounded-2xl border bg-card/60 p-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-heading text-base font-semibold">
                      {slot
                        ? `${formatDate(slot.date)} ${formatTime(slot.start_time)}`
                        : "時段資料缺失"}
                    </div>
                    {frame && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        鏡架：{frame.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <StatusPill>
                      {APPOINTMENT_STATUS_LABEL[a.status] ?? a.status}
                    </StatusPill>
                    {a.status === "booked" && (
                      <Link
                        href={`/appointment/${a.cancel_token}`}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        管理 →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>
            還沒有預約紀錄。
            <Link
              href="/products?kind=prescription_frame"
              className="ml-1 text-primary hover:underline"
            >
              看可預約的鏡架
            </Link>
          </Empty>
        )}
      </Section>

      {/* Orders */}
      <Section title="我的訂單">
        {orders && orders.length > 0 ? (
          <ul className="space-y-3">
            {orders.map((o) => {
              const items = Array.isArray(o.items) ? o.items : [];
              const summary =
                items
                  .map((i) => `${i.product_name} × ${i.quantity}`)
                  .join("、") || "—";
              return (
                <li
                  key={o.id}
                  className="rounded-2xl border bg-card/60 p-5 backdrop-blur-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        href={`/orders/${o.order_no}`}
                        className="font-heading text-base font-semibold hover:underline"
                      >
                        {o.order_no}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("zh-TW")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <StatusPill>
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </StatusPill>
                      <span className="font-medium">
                        {formatPrice(o.total_cents)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {summary}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>
            還沒有訂單。
            <Link
              href="/products?kind=finished"
              className="ml-1 text-primary hover:underline"
            >
              逛成品眼鏡
            </Link>
          </Empty>
        )}
      </Section>

      <div className="mt-12">
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            登出
          </Button>
        </form>
      </div>
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
    <section className="mt-10">
      <h2 className="mb-4 font-heading text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
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
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-base">{children}</div>
    </div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
