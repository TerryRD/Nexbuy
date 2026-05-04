import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // Auth 閘門:沒登入 → 踢去 login。登入但非 admin → 也踢走。
  if (!user) redirect("/admin/login");
  const role = (user.app_metadata as { role?: string } | null)?.role;
  if (role !== "admin") redirect("/admin/login?error=not_admin");

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-48 shrink-0 border-r bg-muted/30">
        <nav className="flex flex-col gap-1 p-3 text-sm">
          <Link
            href="/admin"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            總覽
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            訂單清單
          </Link>
          <Link
            href="/admin/appointments"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            預約清單
          </Link>
          <Link
            href="/admin/customers"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            客戶清單
          </Link>
          <Link
            href="/admin/products"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            商品管理
          </Link>
          <Link
            href="/admin/slots"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            時段維護
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-md px-3 py-2 hover:bg-muted"
          >
            銷售報表
          </Link>
        </nav>
      </aside>
      <div className="flex-1">
        <div className="flex items-center justify-between border-b px-6 py-3 text-sm">
          <span className="text-muted-foreground">{user.email}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              登出
            </Button>
          </form>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
