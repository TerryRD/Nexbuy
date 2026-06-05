import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import Link from "next/link";
import { getWishlistProductIds } from "@/lib/wishlist";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProductCard } from "@/components/site/ProductCard";
import type { ProductCardProduct } from "@/components/site/ProductCard";

export const metadata: Metadata = { title: "願望清單" };

type WishlistProduct = Pick<
  ProductCardProduct,
  "id" | "slug" | "name" | "price_cents" | "image_urls" | "kind" | "finished_stock" | "description"
>;

export default async function WishlistPage() {
  const ids = await getWishlistProductIds();
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect("/login?next=/wishlist");

  let products: WishlistProduct[] = [];
  if (ids.size > 0) {
    const { data } = await sb
      .from("products")
      .select(
        "id, slug, name, description, price_cents, image_urls, kind, finished_stock, is_online_available",
      )
      .in("id", Array.from(ids))
      .eq("is_online_available", true);
    products = (data ?? []) as WishlistProduct[];
  }

  return (
    <div className="container py-10 md:py-14">
      <header className="mb-8 text-center">
        <p className="eyebrow mb-2">WISHLIST</p>
        <h1 className="font-serif text-3xl font-medium md:text-4xl">願望清單</h1>
        <p className="mt-3 text-muted-foreground">共 {products.length} 副</p>
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-muted-foreground">還沒有收藏的鏡框</p>
          <Link
            href="/products"
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            逛商品
          </Link>
        </div>
      ) : (
        <ul
          className="grid gap-x-5 gap-y-8"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
        >
          {products.map((p, i) => (
            <li key={p.id}>
              <ProductCard
                product={p}
                inWishlist
                isLoggedIn
                priority={i < 4}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
