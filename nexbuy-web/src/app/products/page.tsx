import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Product, ProductKind } from "@/lib/types/database";
import { getWishlistProductIds } from "@/lib/wishlist";
import { ProductsList } from "./ProductsList";
import { filterFromSearchParams } from "./AttributeFilters";

type SearchParams = Promise<{
  kind?: string;
  face_shape?: string | string[];
  frame_size?: string;
  material?: string;
  color?: string;
}>;

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
