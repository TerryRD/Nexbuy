import { createServerSupabase } from "@/lib/supabase/server";

// 首頁商品卡需要的欄位（比列表頁精簡，省 payload）。
export const PRODUCT_CARD_COLUMNS =
  "id, slug, name, price_cents, image_urls, kind, finished_stock, is_online_available";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_urls: string[];
  kind: "finished" | "prescription_frame";
  finished_stock: number | null;
  is_online_available: boolean;
};

/** 本季新品：依 created_at 由新到舊。 */
export async function getNewArrivals(limit = 8): Promise<ProductCardData[]> {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(PRODUCT_CARD_COLUMNS)
    .eq("is_online_available", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getNewArrivals failed:", error);
    return [];
  }
  return (data ?? []) as ProductCardData[];
}

/**
 * 精選商品：is_featured = true。
 * 防禦性：is_featured migration 尚未套用時查詢會報錯 → 回空陣列，
 * 首頁該區塊自行隱藏，不可讓整頁壞掉。
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(PRODUCT_CARD_COLUMNS)
    .eq("is_online_available", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("getFeaturedProducts unavailable (is_featured migration applied?):", error.message);
    return [];
  }
  return (data ?? []) as ProductCardData[];
}
