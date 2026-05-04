// Server-only wishlist helpers. Server actions live in
// app/account/wishlist/actions.ts.

import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export async function getWishlistProductIds(): Promise<Set<string>> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await sb
    .from("wishlist_items")
    .select("product_id")
    .eq("customer_id", user.id);

  if (error) {
    console.error("wishlist fetch failed:", error);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.product_id as string));
}
