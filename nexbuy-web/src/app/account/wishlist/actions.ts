"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  productId: z.string().uuid(),
});

export type WishlistActionResult =
  | { ok: true; inWishlist: boolean }
  | { ok: false; error: string };

export async function toggleWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  const parsed = schema.safeParse({ productId });
  if (!parsed.success) {
    return { ok: false, error: "商品 ID 格式錯誤" };
  }

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return { ok: false, error: "請先登入" };
  }

  const { data: existing, error: readErr } = await sb
    .from("wishlist_items")
    .select("product_id")
    .eq("customer_id", user.id)
    .eq("product_id", parsed.data.productId)
    .maybeSingle();
  if (readErr) {
    return { ok: false, error: "讀取收藏失敗" };
  }

  if (existing) {
    const { error } = await sb
      .from("wishlist_items")
      .delete()
      .eq("customer_id", user.id)
      .eq("product_id", parsed.data.productId);
    if (error) return { ok: false, error: "移除收藏失敗" };
    revalidatePath("/account/wishlist");
    return { ok: true, inWishlist: false };
  }

  const { error } = await sb
    .from("wishlist_items")
    .insert({ customer_id: user.id, product_id: parsed.data.productId });
  if (error) return { ok: false, error: "加入收藏失敗" };
  revalidatePath("/account/wishlist");
  return { ok: true, inWishlist: true };
}

export async function removeFromWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  const parsed = schema.safeParse({ productId });
  if (!parsed.success) return { ok: false, error: "商品 ID 格式錯誤" };

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "請先登入" };

  const { error } = await sb
    .from("wishlist_items")
    .delete()
    .eq("customer_id", user.id)
    .eq("product_id", parsed.data.productId);
  if (error) return { ok: false, error: "移除收藏失敗" };
  revalidatePath("/account/wishlist");
  return { ok: true, inWishlist: false };
}
