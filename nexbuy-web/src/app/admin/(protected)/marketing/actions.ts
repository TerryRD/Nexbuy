"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { dispatchCampaign } from "./dispatch";

interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const campaignSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(50_000),
});

const idSchema = z.uuid();

function parseForm(formData: FormData) {
  return {
    subject: (formData.get("subject") ?? "").toString(),
    body: (formData.get("body") ?? "").toString(),
  };
}

export async function createCampaignAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = campaignSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { error: "格式錯誤", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data, error } = await sb
    .from("marketing_campaigns")
    .insert({
      subject: parsed.data.subject,
      body: parsed.data.body,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createCampaign failed:", error);
    return { error: "建立失敗：" + (error?.message ?? "") };
  }

  revalidatePath("/admin/marketing");
  redirect(`/admin/marketing/${data.id}`);
}

export async function updateCampaignAction(
  campaignId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!idSchema.safeParse(campaignId).success) return { error: "INVALID_ID" };
  const parsed = campaignSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { error: "格式錯誤", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("marketing_campaigns")
    .update({ subject: parsed.data.subject, body: parsed.data.body })
    .eq("id", campaignId)
    .in("status", ["draft", "scheduled"]); // 只有未送出狀態可改

  if (error) {
    console.error("updateCampaign failed:", error);
    return { error: "更新失敗：" + error.message };
  }

  revalidatePath("/admin/marketing");
  revalidatePath(`/admin/marketing/${campaignId}`);
  redirect(`/admin/marketing/${campaignId}`);
}

const scheduleSchema = z.object({
  id: z.uuid(),
  scheduled_at: z.iso.datetime({ local: true }),
});

export async function scheduleCampaignAction(formData: FormData): Promise<void> {
  const parsed = scheduleSchema.safeParse({
    id: formData.get("id"),
    scheduled_at: formData.get("scheduled_at"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("marketing_campaigns")
    .update({
      status: "scheduled",
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("status", "draft");
  if (error) throw new Error("UPDATE_FAILED");

  revalidatePath(`/admin/marketing/${parsed.data.id}`);
}

const idOnlySchema = z.object({ id: z.uuid() });

export async function cancelCampaignAction(formData: FormData): Promise<void> {
  const parsed = idOnlySchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const sb = await createServerSupabase();
  const { error } = await sb
    .from("marketing_campaigns")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.id)
    .in("status", ["draft", "scheduled"]);
  if (error) throw new Error("UPDATE_FAILED");

  revalidatePath(`/admin/marketing/${parsed.data.id}`);
}

export async function sendNowAction(formData: FormData): Promise<void> {
  const parsed = idOnlySchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  // dispatchCampaign 處理鎖 + 寄信 + 結果寫回
  const res = await dispatchCampaign(parsed.data.id);
  if (!res.ok) {
    console.error("sendNow failed:", res.reason);
  }

  revalidatePath(`/admin/marketing/${parsed.data.id}`);
  revalidatePath("/admin/marketing");
}
