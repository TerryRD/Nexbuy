import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { PrescriptionForm, type PrescriptionInitial } from "../../PrescriptionForm";
import { updatePrescriptionAction } from "../../actions";

type Params = Promise<{ id: string; rxId: string }>;

export default async function EditPrescriptionPage({
  params,
}: {
  params: Params;
}) {
  const { id, rxId } = await params;
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("prescriptions")
    .select(
      "id, customer_id, exam_date, right_sphere, right_cylinder, right_axis, right_add, left_sphere, left_cylinder, left_axis, left_add, pd, notes",
    )
    .eq("id", rxId)
    .eq("customer_id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to load prescription");
  if (!data) notFound();

  const initial: PrescriptionInitial = {
    id: data.id,
    exam_date: data.exam_date,
    right_sphere: data.right_sphere,
    right_cylinder: data.right_cylinder,
    right_axis: data.right_axis,
    right_add: data.right_add,
    left_sphere: data.left_sphere,
    left_cylinder: data.left_cylinder,
    left_axis: data.left_axis,
    left_add: data.left_add,
    pd: data.pd,
    notes: data.notes,
  };

  const action = updatePrescriptionAction.bind(null, id, rxId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/customers/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← 回客戶詳情
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          編輯驗光紀錄
        </h1>
      </div>

      <PrescriptionForm
        customerId={id}
        initial={initial}
        action={action}
        submitLabel="儲存變更"
      />
    </div>
  );
}
