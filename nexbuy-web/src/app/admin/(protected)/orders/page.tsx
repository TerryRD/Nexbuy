import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { advanceOrderStatus, cancelOrder, refundOrder, updateShipping } from "./actions";
import { SHIPPING_STATUSES, type ShippingStatus } from "./shipping-status";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_BORDER,
  ORDER_STATUS_CHIP_ACTIVE,
  type OrderStatus,
} from "@/lib/order-status";

type OrderRow = {
  id: string;
  order_no: string;
  payment_code: string;
  status: OrderStatus;
  shipping_status: ShippingStatus;
  tracking_number: string | null;
  tracking_carrier: string | null;
  total_cents: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  note: string | null;
  created_at: string;
  items: { product_name: string; quantity: number }[];
  refund_amount_cents: number | null;
  refund_method: string | null;
  refund_note: string | null;
  refunded_at: string | null;
  cancelled_at: string | null;
};

const shippingLabels: Record<ShippingStatus, string> = {
  not_shipped: "尚未出貨",
  preparing: "備貨中",
  shipped: "已出貨",
  delivered: "已送達",
  returned: "已退貨",
};

const nextActionLabel: Partial<Record<OrderStatus, string>> = {
  pending_payment: "標記已付款",
  paid: "標記已出貨",
  shipped: "標記已完成",
};

// URL ?sort= 接受的值
const SORTS = {
  created_desc: { label: "新到舊", col: "created_at", asc: false },
  created_asc: { label: "舊到新", col: "created_at", asc: true },
  total_desc: { label: "金額高到低", col: "total_cents", asc: false },
  total_asc: { label: "金額低到高", col: "total_cents", asc: true },
} as const;
type SortKey = keyof typeof SORTS;

const isSortKey = (v: string | undefined): v is SortKey =>
  !!v && v in SORTS;

const isStatus = (v: string | undefined): v is OrderStatus =>
  !!v && (ORDER_STATUSES as readonly string[]).includes(v);

type SearchParams = Promise<{
  status?: string;
  sort?: string;
  q?: string;
}>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const activeStatus: OrderStatus | null = isStatus(sp.status)
    ? sp.status
    : null;
  const sort: SortKey = isSortKey(sp.sort) ? sp.sort : "created_desc";
  const q = (sp.q ?? "").trim();
  const sortDef = SORTS[sort];

  const sb = await createServerSupabase();

  // Server-side filter + sort：簡單欄位用 .eq / .or、避免拉全部到 client
  // 過濾。q 文字搜尋走 PostgREST .or 串三欄 ilike。
  let query = sb
    .from("orders")
    .select(
      `
      id, order_no, payment_code, status, shipping_status,
      tracking_number, tracking_carrier, total_cents,
      recipient_name, recipient_phone, shipping_address, note, created_at,
      refund_amount_cents, refund_method, refund_note, refunded_at, cancelled_at,
      items:order_items ( product_name, quantity )
    `,
      { count: "exact" },
    )
    .order(sortDef.col, { ascending: sortDef.asc })
    .limit(200);

  if (activeStatus) {
    query = query.eq("status", activeStatus);
  }
  if (q) {
    // ilike 用 *...* wildcard pattern（PostgREST 慣例）
    const pattern = `*${q}*`;
    query = query.or(
      `order_no.ilike.${pattern},recipient_name.ilike.${pattern},payment_code.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("orders list error:", error);
    throw new Error("Failed to load orders");
  }
  const rows = (data ?? []) as unknown as OrderRow[];

  // 各 status 計數（無條件，不受目前 filter 影響）— 用單獨 query 求 count by status
  // 走一個輕量 head request 配 count，等 N+1 嚴重時再優化。
  const statusCountsResults = await Promise.all(
    ORDER_STATUSES.map(async (s) => {
      const { count } = await sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", s);
      return [s, count ?? 0] as const;
    }),
  );
  const statusCounts = Object.fromEntries(statusCountsResults) as Record<
    OrderStatus,
    number
  >;
  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">訂單清單</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ATM 轉帳後按「標記已付款」，出貨後按「標記已出貨」。
          顧客收到商品確認後按「標記已完成」。
        </p>
      </header>

      <FilterBar
        activeStatus={activeStatus}
        statusCounts={statusCounts}
        totalCount={totalCount}
        sort={sort}
        q={q}
      />

      <Section
        rows={rows}
        count={count ?? rows.length}
        empty={
          q || activeStatus
            ? "目前篩選條件下沒有訂單。"
            : "還沒有任何訂單。"
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterBar — status chips + sort + 搜尋
// ---------------------------------------------------------------------------

function FilterBar({
  activeStatus,
  statusCounts,
  totalCount,
  sort,
  q,
}: {
  activeStatus: OrderStatus | null;
  statusCounts: Record<OrderStatus, number>;
  totalCount: number;
  sort: SortKey;
  q: string;
}) {
  // 點 chip 換 status filter（保留 sort + q）
  const chipHref = (s: OrderStatus | null) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (sort !== "created_desc") params.set("sort", sort);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div className="space-y-3">
      {/* Status chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={chipHref(null)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            activeStatus === null
              ? "bg-foreground text-background border-foreground"
              : "border-border bg-background text-muted-foreground hover:border-foreground/40"
          }`}
        >
          全部
          <span className="opacity-70">{totalCount}</span>
        </Link>
        {ORDER_STATUSES.map((s) => {
          const active = activeStatus === s;
          const count = statusCounts[s];
          return (
            <Link
              key={s}
              href={chipHref(s)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? ORDER_STATUS_CHIP_ACTIVE[s]
                  : "border-border bg-background text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {ORDER_STATUS_LABEL[s]}
              <span className="opacity-70">{count}</span>
            </Link>
          );
        })}
      </div>

      {/* Sort + 搜尋 — 同一個 form GET，submit 自動帶當前 status */}
      <form
        action="/admin/orders"
        method="get"
        className="flex flex-wrap items-end gap-2"
      >
        {activeStatus && (
          <input type="hidden" name="status" value={activeStatus} />
        )}
        <div className="space-y-1">
          <label htmlFor="orders-sort" className="text-xs text-muted-foreground">
            排序
          </label>
          <select
            id="orders-sort"
            name="sort"
            defaultValue={sort}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORTS[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1 min-w-48">
          <label htmlFor="orders-q" className="text-xs text-muted-foreground">
            搜尋（訂單編號 / 收件人 / 對帳碼）
          </label>
          <input
            id="orders-q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="NB-... / 王小美 / 12345"
            className="h-8 w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">
          套用
        </Button>
        {(q || sort !== "created_desc") && (
          <Link
            href={activeStatus ? `/admin/orders?status=${activeStatus}` : "/admin/orders"}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            重設
          </Link>
        )}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section + OrderCard
// ---------------------------------------------------------------------------

function Section({
  rows,
  count,
  empty,
}: {
  rows: OrderRow[];
  count: number;
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm text-muted-foreground">共 {count} 筆</h2>
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
    <li
      className={`rounded-lg border-l-4 border border-l-transparent p-4 transition-colors ${ORDER_STATUS_BORDER[row.status]}`}
    >
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
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE[row.status]}`}
            >
              {ORDER_STATUS_LABEL[row.status]}
            </span>
            <span className="font-semibold">{formatPrice(row.total_cents)}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleDateString("zh-TW")}
            </span>
          </div>
          <div className="space-y-0.5 text-sm text-muted-foreground">
            <p>
              {row.recipient_name}{" · "}
              <a href={`tel:${row.recipient_phone}`} className="hover:underline">
                {row.recipient_phone}
              </a>
            </p>
            <p>{row.shipping_address}</p>
            {row.note && <p className="text-xs italic">備註：{row.note}</p>}
            <ul className="pt-1 text-xs">
              {row.items.map((it, i) => (
                <li key={i}>
                  · {it.product_name} × {it.quantity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {actionable && nextActionLabel[row.status] && (
            <form action={advanceOrderStatus}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="from" value={row.status} />
              <Button type="submit" size="sm">
                {nextActionLabel[row.status]}
              </Button>
            </form>
          )}
          {row.status === "pending_payment" && (
            <form action={cancelOrder}>
              <input type="hidden" name="id" value={row.id} />
              <Button type="submit" size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10">
                取消訂單
              </Button>
            </form>
          )}
        </div>
      </div>

      {row.status === "refunded" && row.refunded_at && (
        <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-900 dark:bg-orange-950/30">
          <p className="font-medium text-orange-800 dark:text-orange-300">已退款</p>
          <div className="mt-1 space-y-0.5 text-xs text-orange-700 dark:text-orange-400">
            {row.refund_amount_cents && (
              <p>退款金額：{formatPrice(row.refund_amount_cents)}</p>
            )}
            {row.refund_method && <p>退款方式：{row.refund_method}</p>}
            {row.refund_note && <p>備註：{row.refund_note}</p>}
            <p>退款時間：{new Date(row.refunded_at).toLocaleString("zh-TW")}</p>
          </div>
        </div>
      )}

      {row.status === "cancelled" && row.cancelled_at && (
        <div className="mt-3 rounded-md border border-muted bg-muted/30 p-3 text-xs text-muted-foreground">
          已取消：{new Date(row.cancelled_at).toLocaleString("zh-TW")}
        </div>
      )}

      <ShippingForm row={row} />
      {row.status !== "cancelled" && row.status !== "refunded" && (
        <RefundForm row={row} />
      )}
    </li>
  );
}

function ShippingForm({ row }: { row: OrderRow }) {
  return (
    <details className="mt-3 rounded-md border bg-muted/20 p-3 text-sm">
      <summary className="cursor-pointer select-none text-muted-foreground">
        物流：
        <span className="ml-1 font-medium text-foreground">
          {shippingLabels[row.shipping_status]}
        </span>
        {row.tracking_number && (
          <span className="ml-2 font-mono text-xs">
            {row.tracking_carrier ? `${row.tracking_carrier} · ` : ""}
            {row.tracking_number}
          </span>
        )}
      </summary>
      <form
        action={updateShipping}
        className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto]"
      >
        <input type="hidden" name="id" value={row.id} />
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">物流狀態</span>
          <select
            name="shipping_status"
            defaultValue={row.shipping_status}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            {SHIPPING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {shippingLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">物流商</span>
          <input
            type="text"
            name="tracking_carrier"
            defaultValue={row.tracking_carrier ?? ""}
            placeholder="黑貓 / 7-11 …"
            maxLength={32}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">追蹤碼</span>
          <input
            type="text"
            name="tracking_number"
            defaultValue={row.tracking_number ?? ""}
            placeholder="出貨後填入"
            maxLength={64}
            className="h-8 rounded-md border bg-background px-2 font-mono text-sm"
          />
        </label>
        <Button type="submit" size="sm" variant="outline" className="self-end">
          更新
        </Button>
      </form>
    </details>
  );
}

function RefundForm({ row }: { row: OrderRow }) {
  return (
    <details className="mt-2 rounded-md border bg-muted/20 p-3 text-sm">
      <summary className="cursor-pointer select-none text-muted-foreground">
        退款登記
      </summary>
      <form
        action={refundOrder}
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input type="hidden" name="id" value={row.id} />
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">退款金額（NT$）</span>
          <input
            type="number"
            name="refund_amount_yuan"
            defaultValue={Math.round(row.total_cents / 100)}
            min={1}
            step={1}
            required
            className="h-8 rounded-md border bg-background px-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">退款方式</span>
          <select
            name="refund_method"
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">未指定</option>
            <option value="ATM 轉帳">ATM 轉帳</option>
            <option value="現金">現金</option>
            <option value="其他">其他</option>
          </select>
        </label>
        <Button type="submit" size="sm" variant="outline" className="self-end text-destructive border-destructive/40 hover:bg-destructive/10">
          登記退款
        </Button>
        <label className="flex flex-col gap-1 text-xs sm:col-span-3">
          <span className="text-muted-foreground">備註</span>
          <input
            type="text"
            name="refund_note"
            placeholder="退款原因（選填）"
            maxLength={500}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          />
        </label>
      </form>
    </details>
  );
}
