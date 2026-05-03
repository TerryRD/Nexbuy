import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImageCarousel } from "./ProductImageCarousel";

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
      "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_size, material, color",
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
        {product.image_urls.length > 0 ? (
          <ProductImageCarousel
            images={product.image_urls}
            alt={product.name}
          />
        ) : (
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/50" />
        )}
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
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
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

          <ProductAttributes product={product} />

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
                <AddToCartButton
                  product={{
                    product_id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price_cents: product.price_cents,
                    image_url: product.image_urls?.[0],
                  }}
                  disabled={soldOut}
                  disabledReason={soldOut ? "已售完" : undefined}
                />
                <p className="text-sm text-muted-foreground">
                  {soldOut
                    ? "請選擇其他款式或預約配處方鏡片。"
                    : `庫存剩 ${product.finished_stock ?? 0} 副`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductAttributes({ product }: { product: Product }) {
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (product.face_shape && product.face_shape.length > 0) {
    rows.push({
      label: "適合臉型",
      value: (
        <div className="flex flex-wrap gap-1.5">
          {product.face_shape.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-xs"
            >
              {s}
            </span>
          ))}
        </div>
      ),
    });
  }
  if (product.frame_size) {
    rows.push({ label: "鏡架尺寸", value: product.frame_size });
  }
  if (product.material) {
    rows.push({ label: "材質", value: product.material });
  }
  if (product.color) {
    rows.push({ label: "主色", value: product.color });
  }
  if (rows.length === 0) return null;

  return (
    <dl className="space-y-2 rounded-lg border bg-card/40 p-4 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted-foreground">{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
