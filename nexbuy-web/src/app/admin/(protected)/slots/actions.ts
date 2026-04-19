"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const createSchema = z
  .object({
    date: z.iso.date(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    capacity: z.coerce.number().int().min(1).max(20),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: "end_time must be after start_time",
    path: ["end_time"],
  });

export async function createSlot(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = createSchema.safeParse({
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `格式錯誤:${first?.message ?? "檢查欄位"}` };
  }

  const sb = await createServerSupabase();
  const { error } = await sb.from("appointment_slots").insert({
    date: parsed.data.date,
    start_time: `${parsed.data.start_time}:00`,
    end_time: `${parsed.data.end_time}:00`,
    capacity: parsed.data.capacity,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "這個日期 + 開始時間的 slot 已經存在。" };
    }
    console.error("createSlot failed:", error);
    return { error: "新增失敗:" + error.message };
  }

  revalidatePath("/admin/slots");
  return {};
}

const toggleSchema = z.object({
  id: z.uuid(),
  is_active: z.enum(["true", "false"]),
});

export async function toggleSlotActive(formData: FormData): Promise<void> {
  const parsed = toggleSchema.safeParse({
    id: formData.get("id"),
    is_active: formData.get("is_active"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("appointment_slots")
    .update({ is_active: parsed.data.is_active === "true" })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("toggleSlotActive failed:", error);
    throw new Error("UPDATE_FAILED");
  }
  revalidatePath("/admin/slots");
}
