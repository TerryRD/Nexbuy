import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Product, ProductKind } from "@/lib/types/database";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductsList } from "./ProductsList";
import { filterFromSearchParams } from "./attribute-filter";

type SearchParams = Promise<{
  kind?: string;
  face_shape?: string | string[];
  frame_shape?: string;
  frame_size?: string;
  material?: string;
  color?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  if (sp.kind === "finished") {
    return {
      title: "成品眼鏡",
      description:
        "精鋐眼鏡行：太陽眼鏡、平光眼鏡、抗藍光等成品眼鏡。線上下單到家。",
      alternates: { canonical: "/products?kind=finished" },
    };
  }
  if (sp.kind === "prescription_frame") {
    return {
      title: "處方鏡架",
      description:
        "精鋐眼鏡行：醋酸纖維、鈦金屬、TR90 等處方鏡架。線上挑款，到店驗光配鏡。",
      alternates: { canonical: "/products?kind=prescription_frame" },
    };
  }
  return {
    title: "全部眼鏡",
    description:
      "精鋐眼鏡行：成品眼鏡可線上直購；處方鏡架線上挑款、到店配鏡。",
    alternates: { canonical: "/products" },
  };
}

const isValidKind = (v: string | undefined): v is ProductKind =>
  v === "finished" || v === "prescription_frame";

// 規模化策略：
// MVP 階段（< 50 件商品）一次撈全部、client 端做篩選 — pill 切換瞬間 0
// roundtrip。代價是 HTML payload 隨商品數線性成長（每件 ~1KB JSON）。
//
// 為了 future-proof：硬 LIMIT 500 件。超過上限：
//   1. ProductsList 顯示「目前只列出最新 500 件」hint
//   2. 改成 server-side filter / pagination（搬 attribute filter 到 SQL，
//      用 ?kind=&material=&page= URL 帶狀態，client 變 SSR shell）
//
// 監控訊號：每筆 product row JSON 約 1KB；250 件 = 250KB HTML，行動 4G
// 邊緣可接受。500 件 = 500KB 該動手。完整策略 → docs/scaling.md
const PRODUCT_LIST_LIMIT = 500;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const { kind: kindParam } = sp;
  if (kindParam && !isValidKind(kindParam)) {
    notFound();
  }
  const initialKind: ProductKind | null = isValidKind(kindParam)
    ? kindParam
    : null;
  const initialFilter = filterFromSearchParams(sp);

  const sb = await createServerSupabase();
  const [{ data, error, count }, wishlistSet, { data: { user } }] =
    await Promise.all([
      sb
        .from("products")
        .select(
          "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_shape, frame_size, material, color",
          { count: "exact" },
        )
        .eq("is_online_available", true)
        .order("created_at", { ascending: false })
        .limit(PRODUCT_LIST_LIMIT),
      getWishlistProductIds(),
      sb.auth.getUser(),
    ]);

  if (error) {
    console.error("products query failed:", error);
    throw new Error("Failed to load products");
  }

  const products = (data ?? []) as Product[];
  const totalCount = count ?? products.length;
  const truncated = totalCount > products.length;

  return (
    <ProductsList
      products={products}
      totalCount={totalCount}
      truncated={truncated}
      initialKind={initialKind}
      initialFilter={initialFilter}
      wishlistIds={Array.from(wishlistSet)}
      isLoggedIn={!!user}
    />
  );
}
