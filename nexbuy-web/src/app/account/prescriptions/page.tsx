import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  PrescriptionsTable,
  type PrescriptionRow,
} from "@/components/site/PrescriptionsTable";

export const metadata = {
  title: "我的驗光紀錄 — 精鋐眼鏡行",
};

export default async function MyPrescriptionsPage() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/prescriptions");
  }

  const { data, error } = await sb
    .from("prescriptions")
    .select(
      "id, exam_date, right_sphere, right_cylinder, right_axis, right_add, left_sphere, left_cylinder, left_axis, left_add, pd, notes",
    )
    .eq("customer_id", user.id)
    .order("exam_date", { ascending: false });

  if (error) {
    console.error("[account/prescriptions] query failed:", error);
    throw new Error("Failed to load prescriptions");
  }

  const rows = (data ?? []) as PrescriptionRow[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            我的驗光紀錄
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            到店驗光後，由我們把度數紀錄輸入這裡。
          </p>
        </div>
        <Link
          href="/account"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← 回到我的帳號
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          還沒有驗光紀錄。
          <br />
          歡迎
          <Link
            href="/products?kind=prescription_frame"
            className="ml-1 text-primary hover:underline"
          >
            預約到店驗光配鏡
          </Link>
          。
        </div>
      ) : (
        <PrescriptionsTable rows={rows} />
      )}
    </div>
  );
}
