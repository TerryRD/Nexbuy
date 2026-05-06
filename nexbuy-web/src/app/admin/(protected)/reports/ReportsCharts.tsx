"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPrice } from "@/lib/format";

// 圖表色直接拉 globals.css 的 --chart-1..5（light / dark 自動切）。
const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const AXIS_STROKE = "var(--muted-foreground)";
const GRID_STROKE = "var(--border)";

interface DailyPoint {
  date: string;
  revenue: number;
  count: number;
}

interface NamedPoint {
  name: string;
  revenue: number;
  count: number;
}

function ChartFrame({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

const tooltipBaseStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  padding: "0.5rem 0.75rem",
  color: "var(--foreground)",
};

export function DailyRevenueChart({
  data,
  hint,
}: {
  data: DailyPoint[];
  hint?: string;
}) {
  if (data.length === 0) {
    return (
      <ChartFrame title="每日營收" hint={hint}>
        <p className="text-sm text-muted-foreground">這個區間沒有訂單。</p>
      </ChartFrame>
    );
  }
  return (
    <ChartFrame title="每日營收" hint={hint}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: AXIS_STROKE }}
            stroke={AXIS_STROKE}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS_STROKE }}
            stroke={AXIS_STROKE}
            tickFormatter={(v: number) =>
              v >= 1000_00 ? `${Math.round(v / 1000_00)}k` : `${Math.round(v / 100)}`
            }
            width={48}
          />
          <Tooltip
            contentStyle={tooltipBaseStyle}
            labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
            cursor={{ fill: "var(--muted)" }}
            formatter={(value, name) =>
              name === "revenue"
                ? [formatPrice(Number(value)), "營收"]
                : [String(value), "訂單數"]
            }
          />
          <Bar dataKey="revenue" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function KindBreakdownChart({
  data,
}: {
  data: { name: string; count: number; revenue: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartFrame title="成品 vs 處方鏡架">
        <p className="text-sm text-muted-foreground">這個區間沒有訂單。</p>
      </ChartFrame>
    );
  }
  return (
    <ChartFrame title="成品 vs 處方鏡架" hint="按營收佔比">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipBaseStyle}
            formatter={(value, name) => [
              formatPrice(Number(value)),
              String(name),
            ]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function TopProductsChart({ data }: { data: NamedPoint[] }) {
  if (data.length === 0) {
    return (
      <ChartFrame title="熱銷商品 Top 5" hint="按已收營收">
        <p className="text-sm text-muted-foreground">這個區間沒有訂單。</p>
      </ChartFrame>
    );
  }
  return (
    <ChartFrame title="熱銷商品 Top 5" hint="按營收（含待付款）">
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: AXIS_STROKE }}
            stroke={AXIS_STROKE}
            tickFormatter={(v: number) =>
              v >= 1000_00 ? `${Math.round(v / 1000_00)}k` : `${Math.round(v / 100)}`
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: AXIS_STROKE }}
            stroke={AXIS_STROKE}
            width={120}
            tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
          />
          <Tooltip
            contentStyle={tooltipBaseStyle}
            cursor={{ fill: "var(--muted)" }}
            formatter={(value, name) =>
              name === "revenue"
                ? [formatPrice(Number(value)), "營收"]
                : [String(value), "賣出數"]
            }
          />
          <Bar dataKey="revenue" fill={PALETTE[1]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function StatusBreakdownChart({
  data,
}: {
  data: { name: string; count: number; revenue: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartFrame title="訂單狀態分佈">
        <p className="text-sm text-muted-foreground">這個區間沒有訂單。</p>
      </ChartFrame>
    );
  }
  return (
    <ChartFrame title="訂單狀態分佈" hint="按筆數">
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 38)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: AXIS_STROKE }}
            stroke={AXIS_STROKE}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: AXIS_STROKE }}
            stroke={AXIS_STROKE}
            width={80}
          />
          <Tooltip
            contentStyle={tooltipBaseStyle}
            cursor={{ fill: "var(--muted)" }}
            formatter={(value) => [String(value), "筆數"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
