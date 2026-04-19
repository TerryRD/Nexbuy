import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product, ProductKind } from "@/lib/types/database";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SearchParams = Promise<{ kind?: string }>;

const isValidKind = (v: string | undefined): v is ProductKind =>
  v === "finished" || v === "prescription_frame";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { kind: kindParam } = await searchParams;
  if (kindParam && !isValidKind(kindParam)) {
    notFound();
  }
  const kind: ProductKind | null = isValidKind(kindParam) ? kindParam : null;

  const sb = await createServerSupabase();
  let query = sb
    .from("products")
    .select(
      "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available",
    )
    .eq("is_online_available", true)
    .order("created_at", { ascending: false });

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;

  if (error) {
    console.error("products query failed:", error);
    throw new Error("Failed to load products");
  }

  const products = (data ?? []) as Product[];

  const title = kind === "finished"
    ? "成品眼鏡"
    : kind === "prescription_frame"
      ? "處方鏡架"
      : "全部商品";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <nav className="flex gap-2 text-sm">
          <Link
            href="/products"
            className={
              !kind ? "font-medium" : "text-muted-foreground hover:text-foreground"
            }
          >
            全部
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href="/products?kind=finished"
            className={
              kind === "finished"
                ? "font-medium"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            成品
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href="/products?kind=prescription_frame"
            className={
              kind === "prescription_frame"
                ? "font-medium"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            處方鏡架
          </Link>
        </nav>
      </header>

      {products.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          目前沒有商品。
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-muted" />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">
                        {p.name}
                      </CardTitle>
                      <Badge
                        variant={p.kind === "finished" ? "default" : "outline"}
                        className="shrink-0"
                      >
                        {p.kind === "finished" ? "成品" : "預約配鏡"}
                      </Badge>
                    </div>
                    {p.brand && (
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    )}
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground line-clamp-2">
                    {p.description ?? " "}
                  </CardContent>
                  <CardFooter>
                    <span className="text-lg font-semibold">
                      {formatPrice(p.price_cents)}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
