import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ slug: string }>;

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("products")
    .select(
      "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available",
    )
    .eq("slug", slug)
    .eq("is_online_available", true)
    .maybeSingle();

  if (error) {
    console.error("product query failed:", error);
    throw new Error("Failed to load product");
  }

  if (!data) notFound();
  const product = data as Product;

  const soldOut =
    product.kind === "finished" &&
    (product.finished_stock ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square rounded-lg border bg-muted/50" aria-hidden />
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={product.kind === "finished" ? "default" : "outline"}
              >
                {product.kind === "finished" ? "成品眼鏡" : "處方鏡架"}
              </Badge>
              {product.brand && (
                <span className="text-sm text-muted-foreground">
                  {product.brand}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold">
              {formatPrice(product.price_cents)}
            </p>
          </div>

          {product.description && (
            <p className="text-muted-foreground whitespace-pre-line">
              {product.description}
            </p>
          )}

          <div className="pt-4">
            {product.kind === "prescription_frame" ? (
              <div className="space-y-2">
                <Link
                  href={`/appointment/book/${product.slug}`}
                  className={buttonVariants({
                    size: "lg",
                    className: "w-full sm:w-auto",
                  })}
                >
                  預約到店配鏡
                </Link>
                <p className="text-sm text-muted-foreground">
                  處方鏡架需到店驗光後配鏡。線上預約時段,到店由專業驗光師服務。
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Button size="lg" disabled={soldOut} className="w-full sm:w-auto">
                  {soldOut ? "已售完" : "加入購物車"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {soldOut
                    ? "請選擇其他款式或預約配處方鏡片。"
                    : `庫存剩 ${product.finished_stock ?? 0} 副;購物車 MVP 第二階段上線。`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
