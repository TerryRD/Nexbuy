import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Product, ProductKind } from "@/lib/types/database";
import { ProductsList } from "./ProductsList";

type SearchParams = Promise<{ kind?: string }>;

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
  const { kind: kindParam } = await searchParams;
  if (kindParam && !isValidKind(kindParam)) {
    notFound();
  }
  const initialKind: ProductKind | null = isValidKind(kindParam)
    ? kindParam
    : null;

  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(
      "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available",
    )
    .eq("is_online_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("products query failed:", error);
    throw new Error("Failed to load products");
  }

  const products = (data ?? []) as Product[];

  return <ProductsList products={products} initialKind={initialKind} />;
}
