"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function logoutAction() {
  const sb = await createServerSupabase();
  await sb.auth.signOut();
  redirect("/admin/login");
}
