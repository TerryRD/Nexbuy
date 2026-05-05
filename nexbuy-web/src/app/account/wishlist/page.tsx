import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { getProductImageUrl } from "@/lib/product-placeholder";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WishlistRemoveButton } from "./WishlistRemoveButton";

export const metadata = {
  title: "我的收藏",
};

interface WishlistRow {
  created_at: string;
  product: Product;
}

export default async function WishlistPage() {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/wishlist");
  }

  const { data, error } = await sb
    .from("wishlist_items")
    .select(
      "created_at, product:products(id, slug, name, description, price_cents, image_urls, brand, kind, finished_stock, is_online_available, face_shape, frame_size, material, color)",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("wishlist query failed:", error);
    throw new Error("Failed to load wishlist");
  }

  // Supabase 對單筆 join 會回 array — 攤平成 product 物件
  const items: WishlistRow[] = (data ?? [])
    .map((row) => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product;
      return product
        ? {
            created_at: row.created_at as string,
            product: product as Product,
          }
        : null;
    })
    .filter((x): x is WishlistRow => x !== null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            我的收藏
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            想再看一眼的鏡架都收在這裡。
          </p>
        </div>
        <Link
          href="/account"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← 回到我的帳號
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          還沒有收藏的鏡架。
          <Link
            href="/products"
            className="ml-1 text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ product: p }) => (
            <li key={p.id}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <Link href={`/products/${p.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                    <Image
                      src={getProductImageUrl(p)}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized={!p.image_urls[0]}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
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
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground line-clamp-2">
                    {p.description ?? " "}
                  </CardContent>
                </Link>
                <CardFooter className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {formatPrice(p.price_cents)}
                  </span>
                  <WishlistRemoveButton productId={p.id} />
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
