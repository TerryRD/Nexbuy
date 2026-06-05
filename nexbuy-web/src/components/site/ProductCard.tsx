"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistToggle } from "@/app/products/WishlistToggle";
import { getProductImageUrl } from "@/lib/product-placeholder";
import { formatPrice } from "@/lib/format";

export type ProductCardProduct = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_urls: string[];
  kind: "finished" | "prescription_frame";
  finished_stock?: number | null;
  description?: string | null;
  /** used by placeholder generator */
  face_shape?: readonly string[] | null;
  color?: string | null;
};

export function ProductCard({
  product,
  inWishlist = false,
  isLoggedIn = false,
  priority = false,
}: {
  product: ProductCardProduct;
  inWishlist?: boolean;
  isLoggedIn?: boolean;
  priority?: boolean;
}) {
  const soldOut =
    product.kind === "finished" && (product.finished_stock ?? 0) <= 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
          <Image
            src={getProductImageUrl(product)}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={!product.image_urls[0]}
            className={`object-cover transition-transform duration-300 group-hover:scale-105${soldOut ? " opacity-60 grayscale" : ""}`}
          />
          {soldOut && (
            <span className="absolute left-2 top-2 rounded-sm bg-foreground/80 px-2 py-0.5 text-[11px] font-medium text-background">
              缺貨
            </span>
          )}
          <WishlistToggle
            productId={product.id}
            initialInWishlist={inWishlist}
            isLoggedIn={isLoggedIn}
            variant="heart"
          />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-serif text-base leading-tight">
              {product.name}
            </CardTitle>
            <Badge
              variant={product.kind === "finished" ? "default" : "outline"}
              className="shrink-0"
            >
              {product.kind === "finished" ? "成品" : "預約配鏡"}
            </Badge>
          </div>
        </CardHeader>
        {product.description ? (
          <CardContent className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </CardContent>
        ) : null}
        <CardFooter>
          <span className="font-display text-lg font-semibold text-primary">
            {formatPrice(product.price_cents)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
