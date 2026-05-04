import Link from "next/link";
import { PrescriptionForm } from "../PrescriptionForm";
import { createPrescriptionAction } from "../actions";

type Params = Promise<{ id: string }>;

function todayInTaipei(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function NewPrescriptionPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const action = createPrescriptionAction.bind(null, id);

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
          新增驗光紀錄
        </h1>
      </div>

      <PrescriptionForm
        customerId={id}
        initial={{
          exam_date: todayInTaipei(),
          right_sphere: null,
          right_cylinder: null,
          right_axis: null,
          right_add: null,
          left_sphere: null,
          left_cylinder: null,
          left_axis: null,
          left_add: null,
          pd: null,
          notes: null,
        }}
        action={action}
        submitLabel="建立"
      />
    </div>
  );
}
