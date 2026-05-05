import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

type Params = Promise<{ orderNo: string }>;
type SearchParams = Promise<{ t?: string | string[] }>;

const ORDER_NO_RE = /^NB-\d{12}-\d{3}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ShippingStatus =
  | "not_shipped"
  | "preparing"
  | "shipped"
  | "delivered"
  | "returned";

type OrderRow = {
  id: string;
  order_no: string;
  payment_code: string;
  lookup_token: string;
  user_id: string | null;
  status:
    | "pending_payment"
    | "paid"
    | "preparing"
    | "shipped"
    | "completed"
    | "cancelled"
    | "refunded";
  shipping_status: ShippingStatus;
  tracking_number: string | null;
  tracking_carrier: string | null;
  subtotal_cents: number;
  shipping_fee_cents: number;
  total_cents: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  note: string | null;
  created_at: string;
  items: {
    product_name: string;
    unit_price_cents: number;
    quantity: number;
    subtotal_cents: number;
  }[];
};

const statusLabels: Record<OrderRow["status"], string> = {
  pending_payment: "待付款",
  paid: "已付款,備貨中",
  preparing: "備貨中",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

const shippingLabels: Record<ShippingStatus, string> = {
  not_shipped: "尚未出貨",
  preparing: "備貨中",
  shipped: "已出貨",
  delivered: "已送達",
  returned: "已退貨",
};

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { orderNo } = await params;
  if (!ORDER_NO_RE.test(orderNo)) notFound();

  const sp = await searchParams;
  const tokenRaw = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  const token = tokenRaw && UUID_RE.test(tokenRaw) ? tokenRaw : null;

  // 授權三條路徑：
  //   1. URL 帶有效 lookup_token → 任何人都能看（guest 收信箱裡的連結）
  //   2. 已登入且是訂單擁有者 (orders.user_id = auth.uid()) → 不需 token
  //   3. 已登入且是 admin → 不需 token
  // 三條都不通 → 一律 404，避免時序攻擊洩漏「這個 order_no 存在」。
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("orders")
    .select(
      `
      id, order_no, payment_code, lookup_token, user_id,
      status, shipping_status,
      tracking_number, tracking_carrier,
      subtotal_cents, shipping_fee_cents, total_cents,
      recipient_name, recipient_phone, shipping_address, note, created_at,
      items:order_items ( product_name, unit_price_cents, quantity, subtotal_cents )
    `,
    )
    .eq("order_no", orderNo)
    .maybeSingle();

  if (error) {
    console.error("order lookup error:", error);
    throw new Error("Failed to load order");
  }

  if (!data) notFound();
  const order = data as unknown as OrderRow;

  // token 走常數時間比對。比較簡單：UUID v4 各位元已隨機，直接 string compare 也夠。
  const tokenOk = token !== null && token.toLowerCase() === order.lookup_token.toLowerCase();
  let viewerOk = tokenOk;
  if (!viewerOk) {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      if (order.user_id === user.id) {
        viewerOk = true;
      } else {
        const role = (user.app_metadata as { role?: string } | null)?.role;
        if (role === "admin") viewerOk = true;
      }
    }
  }
  if (!viewerOk) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">訂單送出成功</h1>
        <p className="text-muted-foreground">
          請依下方匯款資訊於 3 日內完成付款。
          店家收到款項會手動標記,出貨前再通知你。
        </p>
      </header>

      <section className="mb-6 rounded-lg border bg-muted/30 p-5 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-muted-foreground">訂單編號</p>
            <p className="font-mono text-lg font-medium">{order.order_no}</p>
          </div>
          <Badge
            variant={order.status === "pending_payment" ? "default" : "outline"}
          >
            {statusLabels[order.status]}
          </Badge>
        </div>
        {order.shipping_status !== "not_shipped" && (
          <div className="mt-4 border-t pt-3">
            <p className="text-muted-foreground">物流狀態</p>
            <p className="mt-0.5 font-medium">
              {shippingLabels[order.shipping_status]}
            </p>
            {order.tracking_number && (
              <p className="mt-1 text-xs text-muted-foreground">
                {order.tracking_carrier ? `${order.tracking_carrier}　` : ""}
                追蹤碼：
                <span className="font-mono text-foreground">
                  {order.tracking_number}
                </span>
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mb-6 space-y-2 rounded-lg border p-5 text-sm">
        <h2 className="mb-2 font-semibold">匯款資訊(ATM 轉帳)</h2>
        <Row label="銀行">(範例)國泰世華銀行 013</Row>
        <Row label="戶名">眼鏡店老闆帳戶</Row>
        <Row label="帳號">000-000-000-0000</Row>
        <Row label="金額">{formatPrice(order.total_cents)}</Row>
        <Row label="備註">
          <span className="font-mono text-base font-semibold tracking-widest">
            {order.payment_code}
          </span>
          <span className="ml-2 text-muted-foreground">
            (5 碼數字,務必填上以利對帳)
          </span>
        </Row>
        <p className="mt-2 text-xs text-muted-foreground">
          ATM 備註欄通常只能填數字,請填上方 5 碼即可,訂單編號保留在這個頁面就好。
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          ⚠️ MVP 示範用的銀行資訊,上線前要換成店家實際帳戶。
        </p>
      </section>

      <section className="mb-6 space-y-3 rounded-lg border p-5 text-sm">
        <h2 className="font-semibold">訂購商品</h2>
        <ul className="space-y-2">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between">
              <span>
                {i.product_name} × {i.quantity}
              </span>
              <span>{formatPrice(i.subtotal_cents)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t pt-3">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">商品小計</dt>
            <dd>{formatPrice(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">運費</dt>
            <dd>
              {order.shipping_fee_cents === 0
                ? "免運"
                : formatPrice(order.shipping_fee_cents)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold">
            <dt>總計</dt>
            <dd className="text-lg">{formatPrice(order.total_cents)}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-6 space-y-2 rounded-lg border p-5 text-sm">
        <h2 className="mb-2 font-semibold">寄送資訊</h2>
        <Row label="收件人">{order.recipient_name}</Row>
        <Row label="手機">{order.recipient_phone}</Row>
        <Row label="地址">{order.shipping_address}</Row>
        {order.note && <Row label="備註">{order.note}</Row>}
      </section>

      <p className="text-sm text-muted-foreground">
        這個頁面的網址含訂單編號,建議加入書籤以便稍後查看。
      </p>

      <div className="mt-6">
        <Link
          href="/products?kind=finished"
          className={buttonVariants({ variant: "outline" })}
        >
          繼續購物
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
