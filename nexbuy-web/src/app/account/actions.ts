"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z
  .object({
    current_password: z.string().min(1, "請輸入目前密碼"),
    password: z.string().min(8, "新密碼至少 8 個字元"),
    confirm: z.string().min(1, "請再次輸入新密碼"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "兩次輸入的新密碼不一致",
    path: ["confirm"],
  })
  .refine((d) => d.password !== d.current_password, {
    message: "新密碼不能與目前密碼相同",
    path: ["password"],
  });

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
} | null;

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = schema.safeParse({
    current_password: formData.get("current_password"),
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
  if (!user || !user.email) {
    return { error: "請先登入" };
  }

  // Defense against session hijack: verify current password before letting the
  // user change it. signInWithPassword on a fresh client doesn't touch the
  // session cookies, so a wrong password here just returns an error without
  // logging the user out of the active session.
  const { error: verifyError } = await sb.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });
  if (verifyError) {
    return { error: "目前密碼不正確" };
  }

  const { error } = await sb.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "更新失敗：" + error.message };
  }

  return { success: true };
}
