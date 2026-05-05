import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata = {
  title: "客戶清單 — 管理後台",
};

interface CustomerRow {
  id: string;
  display_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  created_at: string;
  email: string;
  orderCount: number;
  orderTotalCents: number;
  lastOrderAt: string | null;
  apptCount: number;
  lastApptAt: string | null;
}

export default async function AdminCustomersPage() {
  const admin = createAdminSupabase();

  const [
    { data: customers },
    { data: orderRows },
    { data: apptRows },
    usersResp,
  ] = await Promise.all([
    admin
      .from("customers")
      .select("id, display_name, phone, marketing_opt_in, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("orders")
      .select("user_id, total_cents, created_at")
      .not("user_id", "is", null),
    admin
      .from("appointments")
      .select("user_id, created_at")
      .not("user_id", "is", null),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  // role=admin 的帳號不應該出現在客戶清單（會誤導報表 / 行銷信對象）。
  // app_metadata.role 是 server-controlled，可信。
  const adminUserIds = new Set(
    usersResp.data.users
      .filter(
        (u) =>
          (u.app_metadata as { role?: string } | null)?.role === "admin",
      )
      .map((u) => u.id),
  );

  const emailById = new Map<string, string>(
    usersResp.data.users.map((u) => [u.id, u.email ?? ""]),
  );

  type OrderStat = {
    count: number;
    totalCents: number;
    lastAt: string | null;
  };
  const orderStats = new Map<string, OrderStat>();
  for (const o of orderRows ?? []) {
    if (!o.user_id) continue;
    const e = orderStats.get(o.user_id) ?? {
      count: 0,
      totalCents: 0,
      lastAt: null,
    };
    e.count += 1;
    e.totalCents += o.total_cents;
    if (!e.lastAt || o.created_at > e.lastAt) e.lastAt = o.created_at;
    orderStats.set(o.user_id, e);
  }

  const apptStats = new Map<string, { count: number; lastAt: string | null }>();
  for (const a of apptRows ?? []) {
    if (!a.user_id) continue;
    const e = apptStats.get(a.user_id) ?? { count: 0, lastAt: null };
    e.count += 1;
    if (!e.lastAt || a.created_at > e.lastAt) e.lastAt = a.created_at;
    apptStats.set(a.user_id, e);
  }

  const rows: CustomerRow[] = (customers ?? [])
    .filter((c) => !adminUserIds.has(c.id))
    .map((c) => {
      const o = orderStats.get(c.id);
      const a = apptStats.get(c.id);
      return {
        id: c.id,
        display_name: c.display_name,
        phone: c.phone,
        marketing_opt_in: c.marketing_opt_in,
        created_at: c.created_at,
        email: emailById.get(c.id) ?? "—",
        orderCount: o?.count ?? 0,
        orderTotalCents: o?.totalCents ?? 0,
        lastOrderAt: o?.lastAt ?? null,
        apptCount: a?.count ?? 0,
        lastApptAt: a?.lastAt ?? null,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            客戶清單
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {rows.length} 位 — 新到舊排序
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          目前還沒有註冊客戶。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">客戶</th>
                <th className="px-4 py-3 font-medium">聯絡資訊</th>
                <th className="px-4 py-3 font-medium">訂單</th>
                <th className="px-4 py-3 font-medium">預約</th>
                <th className="px-4 py-3 font-medium">註冊</th>
                <th className="px-4 py-3 font-medium">行銷</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    {r.display_name ?? "(未設定)"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{r.email}</div>
                    {r.phone && <div className="text-xs">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.orderCount > 0 ? (
                      <>
                        <div>
                          {r.orderCount} 筆 · {formatPrice(r.orderTotalCents)}
                        </div>
                        {r.lastOrderAt && (
                          <div className="text-xs">
                            {new Date(r.lastOrderAt).toLocaleDateString("zh-TW")}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.apptCount > 0 ? (
                      <>
                        <div>{r.apptCount} 次</div>
                        {r.lastApptAt && (
                          <div className="text-xs">
                            {new Date(r.lastApptAt).toLocaleDateString("zh-TW")}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("zh-TW")}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.marketing_opt_in ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        訂閱
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${r.id}`}
                      className="text-xs text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                    >
                      詳情 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
