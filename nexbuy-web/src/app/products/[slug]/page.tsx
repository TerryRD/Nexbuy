import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { buttonVariants } from "@/components/ui/button";
import { getWishlistProductIds } from "@/lib/wishlist";
import { AddToCartButton } from "./AddToCartButton";
import { CompareToggle } from "./CompareToggle";
import { ProductImageCarousel } from "./ProductImageCarousel";
import { WishlistToggle } from "../WishlistToggle";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema } from "@/lib/seo/schema";
import { getProductImageUrl } from "@/lib/product-placeholder";
import { Breadcrumb } from "@/components/site/Breadcrumb";
import { ProductCard } from "@/components/site/ProductCard";
import { SizeChartModal } from "./SizeChartModal";
import { PurchaseGuarantee } from "./PurchaseGuarantee";
import { ProductTabs } from "./ProductTabs";

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
        "id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_shape, frame_size, material, color, try_on_image_url",
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

  // 沒上傳真品照 → 走 SVG placeholder（每個 slug deterministic，視覺
  // 跟 kind / face_shape / color 對齊）
  const displayImages =
    product.image_urls.length > 0
      ? product.image_urls
      : [getProductImageUrl(product)];

  // Related products — same kind, exclude current, online, newest 4
  const { data: relatedRaw } = await sb
    .from("products")
    .select("id, slug, name, price_cents, image_urls, kind, finished_stock")
    .eq("is_online_available", true)
    .eq("kind", product.kind)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(4);
  const related = relatedRaw ?? [];

  const kindLabel =
    product.kind === "finished" ? "成品太陽眼鏡" : "處方鏡框";

  return (
    <div className="container py-10 md:py-14">
      <JsonLd
        data={productSchema({
          slug: product.slug,
          name: product.name,
          description: product.description,
          priceCents: product.price_cents,
          imageUrl: displayImages[0],
          kind: product.kind,
          brand: product.brand,
          finishedStock: product.finished_stock,
          isOnlineAvailable: product.is_online_available,
        })}
      />

      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "首頁", href: "/" },
            { label: kindLabel, href: `/products?kind=${product.kind}` },
            { label: product.name },
          ]}
        />
      </div>

      {/* Two-column grid */}
      <div className="grid gap-8 md:grid-cols-2 mt-6">
        {/* LEFT — image carousel + actions */}
        <div className="space-y-4">
          <ProductImageCarousel images={displayImages} alt={product.name} />

          {/* Below-image actions: try-on link + compare */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/tryon?product=${product.slug}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              虛擬試戴
            </Link>
            <CompareToggle productId={product.id} />
          </div>
        </div>

        {/* RIGHT — product info */}
        <div className="space-y-5">
          {/* Eyebrow + 編號 */}
          <div className="flex items-center justify-between">
            <p className="eyebrow">{kindLabel}</p>
            <span className="font-mono text-xs text-muted-foreground">
              NO. {product.slug}
            </span>
          </div>

          {/* Name */}
          <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
            {product.name}
          </h1>

          {/* Brand */}
          {product.brand && (
            <p className="text-sm text-muted-foreground">{product.brand}</p>
          )}

          {/* Price */}
          <p className="font-display text-3xl font-semibold text-primary">
            {formatPrice(product.price_cents)}
          </p>

          {/* Stock state — finished only */}
          {product.kind === "finished" && (
            <>
              {soldOut ? (
                <p className="text-sm text-muted-foreground">
                  暫時缺貨 · 可加入收藏
                </p>
              ) : (product.finished_stock ?? 0) <= 5 ? (
                <p className="flex items-center gap-2 text-sm text-warn">
                  <span
                    className="size-2 rounded-full bg-warn animate-pulse"
                    aria-hidden
                  />
                  僅剩 {product.finished_stock} 副
                </p>
              ) : null}
            </>
          )}

          {/* Color swatch */}
          {product.color && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">顏色</span>
              <span className="size-4 rounded-full border border-border bg-neutral-400 shrink-0" />
              <span className="text-foreground">{product.color}</span>
            </div>
          )}

          {/* Size row */}
          {product.frame_size && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">尺寸</span>
              <span className="rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
                {product.frame_size}
              </span>
              <SizeChartModal currentSize={product.frame_size ?? undefined} />
            </div>
          )}

          {/* CTA */}
          {product.kind === "finished" ? (
            <div className="space-y-2 pt-2">
              <AddToCartButton
                product={{
                  product_id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price_cents: product.price_cents,
                  image_url: displayImages[0],
                }}
                disabled={soldOut}
                disabledReason={soldOut ? "暫時缺貨" : undefined}
              />
              <WishlistToggle
                productId={product.id}
                initialInWishlist={inWishlist}
                isLoggedIn={!!user}
              />
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Link
                href={`/appointment/book/${product.slug}`}
                className={buttonVariants({
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                預約到店配鏡
              </Link>
              <div className="flex flex-wrap gap-2">
                <WishlistToggle
                  productId={product.id}
                  initialInWishlist={inWishlist}
                  isLoggedIn={!!user}
                />
              </div>
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                <p className="font-serif text-foreground mb-1">關於處方鏡框</p>
                處方鏡框需到店驗光後配鏡。線上挑款並預約時段，到店由專業驗光師為你量測、配鏡，鏡片現場另計。
              </div>
            </div>
          )}

          {/* Purchase guarantee */}
          <PurchaseGuarantee kind={product.kind} />
        </div>
      </div>

      {/* Below grid — full width */}
      <div className="mt-12">
        <ProductTabs product={product} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-medium mb-6">同系列推薦</h2>
          <ul className="grid gap-x-5 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  inWishlist={wishlistSet.has(p.id)}
                  isLoggedIn={!!user}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
