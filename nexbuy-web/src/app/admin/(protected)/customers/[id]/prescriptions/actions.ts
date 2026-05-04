"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { prescriptionSchema } from "@/lib/schemas/prescription";

interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function parseForm(formData: FormData) {
  return {
    exam_date: (formData.get("exam_date") ?? "").toString(),
    right_sphere: (formData.get("right_sphere") ?? "").toString(),
    right_cylinder: (formData.get("right_cylinder") ?? "").toString(),
    right_axis: (formData.get("right_axis") ?? "").toString(),
    right_add: (formData.get("right_add") ?? "").toString(),
    left_sphere: (formData.get("left_sphere") ?? "").toString(),
    left_cylinder: (formData.get("left_cylinder") ?? "").toString(),
    left_axis: (formData.get("left_axis") ?? "").toString(),
    left_add: (formData.get("left_add") ?? "").toString(),
    pd: (formData.get("pd") ?? "").toString(),
    notes: (formData.get("notes") ?? "").toString() || null,
  };
}

const customerIdSchema = z.uuid();
const rxIdSchema = z.uuid();

export async function createPrescriptionAction(
  customerId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const idParsed = customerIdSchema.safeParse(customerId);
  if (!idParsed.success) return { error: "INVALID_CUSTOMER_ID" };

  const parsed = prescriptionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { error: "格式錯誤", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("prescriptions")
    .insert({ customer_id: customerId, ...parsed.data });
  if (error) {
    console.error("createPrescription failed:", error);
    return { error: "新增失敗：" + error.message };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}`);
}

export async function updatePrescriptionAction(
  customerId: string,
  rxId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!customerIdSchema.safeParse(customerId).success) return { error: "INVALID_CUSTOMER_ID" };
  if (!rxIdSchema.safeParse(rxId).success) return { error: "INVALID_RX_ID" };

  const parsed = prescriptionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { error: "格式錯誤", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("prescriptions")
    .update(parsed.data)
    .eq("id", rxId)
    .eq("customer_id", customerId);
  if (error) {
    console.error("updatePrescription failed:", error);
    return { error: "更新失敗：" + error.message };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}`);
}

const deleteSchema = z.object({
  customer_id: z.uuid(),
  rx_id: z.uuid(),
});

export async function deletePrescriptionAction(formData: FormData): Promise<void> {
  const parsed = deleteSchema.safeParse({
    customer_id: formData.get("customer_id"),
    rx_id: formData.get("rx_id"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("prescriptions")
    .delete()
    .eq("id", parsed.data.rx_id)
    .eq("customer_id", parsed.data.customer_id);
  if (error) {
    console.error("deletePrescription failed:", error);
    throw new Error("DELETE_FAILED");
  }
  revalidatePath(`/admin/customers/${parsed.data.customer_id}`);
}
