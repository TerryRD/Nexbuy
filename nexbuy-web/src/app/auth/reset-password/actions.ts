"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z
  .object({
    password: z.string().min(8, "密碼至少 8 個字元"),
    confirm: z.string().min(1, "請再次輸入密碼"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "兩次輸入的密碼不一致",
    path: ["confirm"],
  });

export type ResetPasswordState = {
  error?: string;
} | null;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "輸入有誤" };
  }

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    // 沒有 recovery session — code exchange 失敗或連結過期
    return { error: "重設連結無效或已過期，請重新申請。" };
  }

  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("[reset-password] updateUser failed:", error);
    return { error: "更新失敗：" + error.message };
  }

  // 走完之後直接帶到 /account，session 已是 fully authenticated
  redirect("/account");
}
