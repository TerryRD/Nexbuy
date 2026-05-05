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

// All products fetched once; the client component filters in-memory so pill
// switches are instant (no per-click Supabase roundtrip / server re-render).
// We still read searchParams here to 404 invalid kinds and to pass the
// initial active filter to the client (so a deep-linked ?kind= URL renders
// in the right state on first paint).
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
  const [{ data, error }, wishlistSet, { data: { user } }] = await Promise.all([
    sb
      .from("products")
      .select(
        "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_size, material, color",
      )
      .eq("is_online_available", true)
      .order("created_at", { ascending: false }),
    getWishlistProductIds(),
    sb.auth.getUser(),
  ]);

  if (error) {
    console.error("products query failed:", error);
    throw new Error("Failed to load products");
  }

  const products = (data ?? []) as Product[];

  return (
    <ProductsList
      products={products}
      initialKind={initialKind}
      initialFilter={initialFilter}
      wishlistIds={Array.from(wishlistSet)}
      isLoggedIn={!!user}
    />
  );
}
