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
    return { error: "重設連結已失效，請重新申請。" };
  }

  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "重設失敗：" + error.message };
  }

  redirect("/account?password_reset=1");
}
