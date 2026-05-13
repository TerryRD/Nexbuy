import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import {
  DailyRevenueChart,
  KindBreakdownChart,
  StatusBreakdownChart,
  TopProductsChart,
} from "./ReportsCharts";

// Phase 6 PR 1：銷售報表。SSR + URL searchParams（from / to / kind）。
// 圖表用 Recharts client-side render（reports 是 admin only / 低流量，
// 可以接受 client bundle），server 仍 SSR 數據 + 表格，圖表 hydrate 後填上。

type SearchParams = Promise<{
  from?: string;
  to?: string;
  kind?: string;
}>;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  preparing: "備貨中",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  shipping_fee_cents: number;
  created_at: string;
  items: { product_name: string; quantity: number; subtotal_cents: number }[];
}

interface ProductLookupRow {
  name: string;
  brand: string | null;
  kind: string;
}

// 從 byDay buckets 展開為連續 from~to 每日資料（沒訂單的日子補 0）。
// chart 的 X 軸需要連續日，否則一週空檔會自動 collapse 看起來假。
function expandDailySeries(
  buckets: Bucket[],
  from: string,
  to: string,
): { date: string; revenue: number; count: number }[] {
  const map = new Map<string, Bucket>();
  for (const b of buckets) map.set(b.key, b);
  const out: { date: string; revenue: number; count: number }[] = [];
  const start = new Date(`${from}T00:00:00+08:00`);
  const end = new Date(`${to}T00:00:00+08:00`);
  // 上限 90 天保險，避免極端範圍時迴圈過久
  let guard = 0;
  for (let d = new Date(start); d <= end && guard < 365; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const b = map.get(key);
    out.push({ date: key, revenue: b?.revenue ?? 0, count: b?.count ?? 0 });
    guard += 1;
  }
  return out;
}

function todayInTaipei(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysAgoTaipei(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function taipeiDayBoundsUtc(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00+08:00`).toISOString();
  const end = new Date(`${date}T24:00:00+08:00`).toISOString();
  return { start, end };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const today = todayInTaipei();
  const from = sp.from && DAY_RE.test(sp.from) ? sp.from : daysAgoTaipei(29);
  const to = sp.to && DAY_RE.test(sp.to) ? sp.to : today;
  const kindFilter = sp.kind === "finished" || sp.kind === "prescription_frame"
    ? sp.kind
    : null;

  const fromUtc = taipeiDayBoundsUtc(from).start;
  const toUtc = taipeiDayBoundsUtc(to).end;

  const sb = await createServerSupabase();
  const [{ data: orderRows }, { data: productRows }, { data: apptRows }] =
    await Promise.all([
      sb
        .from("orders")
        .select(
          `id, status, total_cents, subtotal_cents, shipping_fee_cents, created_at,
         items:order_items ( product_name, quantity, subtotal_cents )`,
        )
        .gte("created_at", fromUtc)
        .lt("created_at", toUtc)
        .order("created_at", { ascending: false })
        .limit(2000),
      sb.from("products").select("name, brand, kind"),
      sb
        .from("appointments")
        .select("id, status, created_at")
        .gte("created_at", fromUtc)
        .lt("created_at", toUtc)
        .limit(2000),
    ]);

  const orders = (orderRows ?? []) as unknown as OrderRow[];
  const products = (productRows ?? []) as ProductLookupRow[];

  // 預約統計
  type ApptStatus = "booked" | "completed" | "noshow" | "cancelled";
  const appts = (apptRows ?? []) as { id: string; status: ApptStatus; created_at: string }[];
  const apptTotal = appts.length;
  const apptCompleted = appts.filter((a) => a.status === "completed").length;
  const apptNoshow = appts.filter((a) => a.status === "noshow").length;
  const apptCancelled = appts.filter((a) => a.status === "cancelled").length;
  const apptBooked = appts.filter((a) => a.status === "booked").length;
  const completionRate =
    apptTotal > 0 ? Math.round((apptCompleted / apptTotal) * 100) : null;

  // product_name → { brand, kind } 對照 — order_items 是快照，不見得能 join
  // 到現存商品；但歷史訂單拿不到 kind 就只能標 "unknown"
  const productLookup = new Map<string, ProductLookupRow>();
  for (const p of products) productLookup.set(p.name, p);

  // kind filter 套用到「訂單裡至少一個商品屬於該 kind」— 因為一張訂單
  // 可能混 finished + prescription_frame（雖然目前流程不太會）
  const filteredOrders = orders.filter((o) => {
    if (!kindFilter) return true;
    return o.items.some((i) => productLookup.get(i.product_name)?.kind === kindFilter);
  });

  // 預估營收（含待付款）：排除 cancelled / refunded
  // 已收營收：客戶 ATM 已到帳，status 至少 paid 起算（paid / preparing /
  //          shipped / completed）
  const PAID_STATUSES = new Set([
    "paid",
    "preparing",
    "shipped",
    "completed",
  ]);
  const projectedOrders = filteredOrders.filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded",
  );
  const collectedOrders = filteredOrders.filter((o) =>
    PAID_STATUSES.has(o.status),
  );
  const pendingOrders = filteredOrders.filter(
    (o) => o.status === "pending_payment",
  );

  const projectedRevenue = projectedOrders.reduce(
    (s, o) => s + o.total_cents,
    0,
  );
  const collectedRevenue = collectedOrders.reduce(
    (s, o) => s + o.total_cents,
    0,
  );
  const pendingRevenue = pendingOrders.reduce(
    (s, o) => s + o.total_cents,
    0,
  );
  const orderCount = filteredOrders.length;
  const collectedOrderCount = collectedOrders.length;
  const avgCollectedValue =
    collectedOrderCount > 0
      ? Math.round(collectedRevenue / collectedOrderCount)
      : 0;

  // breakdown by status
  const byStatus = aggregate(filteredOrders, (o) => o.status);

  // breakdown by kind（用 items 第一個商品的 kind 推斷）
  const byKind = aggregate(filteredOrders, (o) => {
    const first = o.items[0];
    if (!first) return "unknown";
    return productLookup.get(first.product_name)?.kind ?? "unknown";
  });

  // breakdown by brand（同上推斷）
  const byBrand = aggregate(filteredOrders, (o) => {
    const first = o.items[0];
    if (!first) return "—";
    return productLookup.get(first.product_name)?.brand ?? "—";
  });

  // breakdown by day
  const byDay = aggregate(filteredOrders, (o) => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(o.created_at));
  });

  // 圖表用：填補 from~to 之間沒訂單的天，X 軸才是連續的
  const dailySeries = expandDailySeries(byDay, from, to);

  // 熱銷商品：穿過 order_items 聚合，已退款 / 已取消的 items 不算營收
  // （但保留 count，老闆需要看「即使被退也曾賣出」的訊號可以參考；先不顯示）
  const productMap = new Map<string, { revenue: number; count: number }>();
  for (const o of filteredOrders) {
    const countable =
      o.status !== "cancelled" && o.status !== "refunded";
    for (const it of o.items) {
      const prev = productMap.get(it.product_name) ?? { revenue: 0, count: 0 };
      prev.count += it.quantity;
      if (countable) prev.revenue += it.subtotal_cents;
      productMap.set(it.product_name, prev);
    }
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, v]) => ({ name, revenue: v.revenue, count: v.count }))
    .filter((p) => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 圖表 / chart-friendly shape（中文 label 給 chart legend / axis 用）
  const KIND_LABEL: Record<string, string> = {
    finished: "成品眼鏡",
    prescription_frame: "處方鏡架",
    unknown: "（已刪商品）",
  };
  const kindChartData = byKind.map((b) => ({
    name: KIND_LABEL[b.key] ?? b.key,
    revenue: b.revenue,
    count: b.count,
  }));
  const statusChartData = byStatus.map((b) => ({
    name: ORDER_STATUS_LABEL[b.key] ?? b.key,
    count: b.count,
    revenue: b.revenue,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">銷售報表</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {from} ~ {to}（Asia/Taipei）。
          <strong>預估營收</strong>含待付款（ATM 還沒到帳），
          <strong>已收營收</strong>從 paid 起算；
          已取消 / 已退款一律不計。
        </p>
      </header>

      {/* Filter form */}
      <form
        action="/admin/reports"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4"
      >
        <div className="space-y-1">
          <label htmlFor="rep-from" className="text-xs text-muted-foreground">
            起
          </label>
          <input
            id="rep-from"
            name="from"
            type="date"
            defaultValue={from}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="rep-to" className="text-xs text-muted-foreground">
            訖
          </label>
          <input
            id="rep-to"
            name="to"
            type="date"
            defaultValue={to}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="rep-kind" className="text-xs text-muted-foreground">
            kind
          </label>
          <select
            id="rep-kind"
            name="kind"
            defaultValue={kindFilter ?? ""}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">全部</option>
            <option value="finished">成品</option>
            <option value="prescription_frame">處方鏡架</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          套用
        </button>
        <Link
          href="/admin/reports"
          className="h-8 inline-flex items-center rounded-md border bg-background px-3 text-sm hover:bg-muted"
        >
          重設
        </Link>
      </form>

      {/* KPI */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="預估營收"
          value={formatPrice(projectedRevenue)}
          suffix={`含待付款 ${pendingOrders.length} 筆`}
        />
        <Stat
          label="已收營收"
          value={formatPrice(collectedRevenue)}
          suffix={`paid 起算 ${collectedOrderCount} 筆`}
        />
        <Stat
          label="待付款"
          value={formatPrice(pendingRevenue)}
          suffix={`${pendingOrders.length} 筆等對帳`}
        />
        <Stat
          label="平均客單價（已收）"
          value={collectedOrderCount > 0 ? formatPrice(avgCollectedValue) : "—"}
          suffix={`${orderCount} 筆 / 期間總訂單`}
        />
      </section>

      {/* 預約漏斗 */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">預約漏斗（同期間建立）</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="預約總數"
            value={String(apptTotal)}
            suffix={apptBooked > 0 ? `尚有 ${apptBooked} 筆待處理` : ""}
          />
          <Stat
            label="完成到店"
            value={String(apptCompleted)}
            suffix={completionRate !== null ? `完成率 ${completionRate}%` : "—"}
          />
          <Stat
            label="未到店"
            value={String(apptNoshow)}
            suffix={
              apptTotal > 0
                ? `未到率 ${Math.round((apptNoshow / apptTotal) * 100)}%`
                : ""
            }
          />
          <Stat
            label="顧客取消"
            value={String(apptCancelled)}
            suffix={
              apptTotal > 0
                ? `取消率 ${Math.round((apptCancelled / apptTotal) * 100)}%`
                : ""
            }
          />
        </div>
        {apptTotal === 0 && (
          <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            這個期間沒有預約紀錄。
          </p>
        )}
      </section>

      {/* Charts — Recharts 在 client，server 仍 SSR 數據 + 表格 */}
      <DailyRevenueChart
        data={dailySeries}
        hint={`${from} ~ ${to}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <KindBreakdownChart data={kindChartData} />
        <TopProductsChart data={topProducts} />
      </div>
      <StatusBreakdownChart data={statusChartData} />

      {/* 細節表格 — 老闆 export Excel / 仔細對帳時用 */}
      <details className="rounded-lg border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          展開詳細表格
        </summary>
        <div className="mt-4 space-y-6">
          <Breakdown
            title="按 status 分"
            rows={byStatus}
            labelMap={ORDER_STATUS_LABEL}
          />
          <Breakdown
            title="按 kind 分"
            rows={byKind}
            labelMap={{
              finished: "成品",
              prescription_frame: "處方鏡架",
              unknown: "（已刪商品）",
            }}
          />
          <Breakdown title="按品牌分" rows={byBrand} />
          <Breakdown title="按日分" rows={byDay} sortKey="key" descKey={false} />
        </div>
      </details>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {suffix && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}

interface Bucket {
  key: string;
  count: number;
  revenue: number;
}

function aggregate<T extends { total_cents: number; status: string }>(
  rows: T[],
  keyFn: (r: T) => string,
): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const r of rows) {
    const k = keyFn(r);
    const b = map.get(k) ?? { key: k, count: 0, revenue: 0 };
    b.count += 1;
    if (r.status !== "cancelled" && r.status !== "refunded") {
      b.revenue += r.total_cents;
    }
    map.set(k, b);
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

function Breakdown({
  title,
  rows,
  labelMap,
  sortKey,
  descKey,
}: {
  title: string;
  rows: Bucket[];
  labelMap?: Record<string, string>;
  sortKey?: "key" | "revenue";
  descKey?: boolean;
}) {
  const sorted =
    sortKey === "key"
      ? [...rows].sort((a, b) =>
          descKey ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key),
        )
      : rows;

  return (
    <section className="space-y-2">
      <h2 className="text-base font-medium">{title}</h2>
      {sorted.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          這個區間沒有訂單。
        </p>
      ) : (
        <table className="w-full overflow-hidden rounded-md border text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">分類</th>
              <th className="px-3 py-2 text-right font-medium">訂單數</th>
              <th className="px-3 py-2 text-right font-medium">營收</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.key} className="border-t">
                <td className="px-3 py-2">{labelMap?.[r.key] ?? r.key}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.count}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatPrice(r.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
