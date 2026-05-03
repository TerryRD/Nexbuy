import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { advanceOrderStatus } from "./actions";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

type OrderRow = {
  id: string;
  order_no: string;
  payment_code: string;
  status: OrderStatus;
  total_cents: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  note: string | null;
  created_at: string;
  items: { product_name: string; quantity: number }[];
};

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  preparing: "備貨中",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

const nextActionLabel: Partial<Record<OrderStatus, string>> = {
  pending_payment: "標記已付款",
  paid: "標記已出貨",
  shipped: "標記已完成",
};

export default async function AdminOrdersPage() {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("orders")
    .select(
      `
      id, order_no, payment_code, status, total_cents,
      recipient_name, recipient_phone, shipping_address, note, created_at,
      items:order_items ( product_name, quantity )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("orders list error:", error);
    throw new Error("Failed to load orders");
  }
  const rows = (data ?? []) as unknown as OrderRow[];

  const active = rows.filter(
    (r) => r.status === "pending_payment" || r.status === "paid" || r.status === "shipped",
  );
  const done = rows.filter((r) => !active.includes(r));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">訂單清單</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          待處理的訂單排在上面。ATM 轉帳後按「標記已付款」,出貨後按「標記已出貨」。
          顧客收到商品確認後按「標記已完成」。
        </p>
      </header>

      <Section
        title={`待處理 (${active.length})`}
        rows={active}
        empty="沒有待處理訂單。"
      />
      <Section
        title={`歷史 (${done.length})`}
        rows={done}
        empty="沒有歷史訂單。"
      />
    </div>
  );
}

function Section({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: OrderRow[];
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
            <OrderCard key={r.id} row={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function OrderCard({ row }: { row: OrderRow }) {
  const actionable =
    row.status === "pending_payment" ||
    row.status === "paid" ||
    row.status === "shipped";

  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm">{row.order_no}</span>
            <span
              className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold tracking-widest text-primary"
              title="顧客匯款備註"
            >
              {row.payment_code}
            </span>
            <Badge
              variant={actionable && row.status === "pending_payment" ? "default" : "outline"}
            >
              {statusLabels[row.status]}
            </Badge>
            <span className="font-semibold">{formatPrice(row.total_cents)}</span>
          </div>
          <div className="space-y-0.5 text-sm text-muted-foreground">
            <p>
              {row.recipient_name}{" · "}
              <a href={`tel:${row.recipient_phone}`} className="hover:underline">
                {row.recipient_phone}
              </a>
            </p>
            <p>{row.shipping_address}</p>
            {row.note && <p className="text-xs italic">備註:{row.note}</p>}
            <ul className="pt-1 text-xs">
              {row.items.map((it, i) => (
                <li key={i}>
                  · {it.product_name} × {it.quantity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {actionable && nextActionLabel[row.status] && (
          <form action={advanceOrderStatus}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="from" value={row.status} />
            <Button type="submit" size="sm">
              {nextActionLabel[row.status]}
            </Button>
          </form>
        )}
      </div>
    </li>
  );
}
