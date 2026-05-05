import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWishlistProductIds } from "@/lib/wishlist";
import { AddToCartButton } from "./AddToCartButton";
import { CompareToggle } from "./CompareToggle";
import { ProductImageCarousel } from "./ProductImageCarousel";
import { WishlistToggle } from "../WishlistToggle";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema } from "@/lib/seo/schema";

type Params = Promise<{ slug: string }>;

// 動態 metadata：title / description 帶商品名 + 主要屬性，OG image 用商品圖。
// generateMetadata 跑在 page render 之前，但 Next.js 會 dedupe 同一 request
// 內的重複 fetch（同一個 slug query 不會重打兩次）。
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  // 用 admin client 繞 RLS — 我們只 select 公開欄位給 metadata 用
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("products")
    .select("name, description, image_urls, kind, brand, is_online_available, deleted_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!data || !data.is_online_available || data.deleted_at) {
    return { title: "找不到商品" };
  }

  const kindText = data.kind === "finished" ? "成品眼鏡" : "處方鏡架";
  const desc =
    (data.description as string | null) ??
    `${kindText}${data.brand ? ` · ${data.brand}` : ""}`;
  const ogImage = (data.image_urls as string[])?.[0];

  return {
    title: data.name as string,
    description: desc,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: "website",
      url: `/products/${slug}`,
      title: data.name as string,
      description: desc,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: data.name as string,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  const sb = await createServerSupabase();
  const [{ data, error }, wishlistSet, { data: { user } }] = await Promise.all([
    sb
      .from("products")
      .select(
        "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_size, material, color",
      )
      .eq("slug", slug)
      .eq("is_online_available", true)
      .maybeSingle(),
    getWishlistProductIds(),
    sb.auth.getUser(),
  ]);

  if (error) {
    console.error("product query failed:", error);
    throw new Error("Failed to load product");
  }

  if (!data) notFound();
  const product = data as Product;
  const inWishlist = wishlistSet.has(product.id);

  const soldOut =
    product.kind === "finished" &&
    (product.finished_stock ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd
        data={productSchema({
          slug: product.slug,
          name: product.name,
          description: product.description,
          priceCents: product.price_cents,
          imageUrl: product.image_urls[0],
          kind: product.kind,
          brand: product.brand,
          finishedStock: product.finished_stock,
          isOnlineAvailable: product.is_online_available,
        })}
      />
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

          <div className="flex flex-wrap gap-2 pt-2">
            <CompareToggle productId={product.id} />
            <WishlistToggle
              productId={product.id}
              initialInWishlist={inWishlist}
              isLoggedIn={!!user}
            />
          </div>

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
