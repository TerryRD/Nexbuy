"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductFilter } from "@/components/site/ProductFilter";
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
import { AttributeFilters } from "./AttributeFilters";
import {
  filterToQueryString,
  type AttributeFilterState,
} from "./attribute-filter";
import { WishlistToggle } from "./WishlistToggle";

const TITLE: Record<"all" | ProductKind, string> = {
  all: "全部商品",
  finished: "成品眼鏡",
  prescription_frame: "處方鏡架",
};

export function ProductsList({
  products,
  initialKind,
  initialFilter,
  wishlistIds,
  isLoggedIn,
}: {
  products: Product[];
  initialKind: ProductKind | null;
  initialFilter: AttributeFilterState;
  wishlistIds: string[];
  isLoggedIn: boolean;
}) {
  const [active, setActive] = useState<ProductKind | null>(initialKind);
  const [attrFilter, setAttrFilter] =
    useState<AttributeFilterState>(initialFilter);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (active && p.kind !== active) return false;
      // face_shape：多選 OR — 商品任一適合臉型符合就算
      if (attrFilter.faceShapes.length > 0) {
        const match = attrFilter.faceShapes.some((s) =>
          (p.face_shape ?? []).includes(s),
        );
        if (!match) return false;
      }
      if (attrFilter.frameSize && p.frame_size !== attrFilter.frameSize) {
        return false;
      }
      if (attrFilter.material && p.material !== attrFilter.material) {
        return false;
      }
      if (attrFilter.color && p.color !== attrFilter.color) {
        return false;
      }
      return true;
    });
  }, [products, active, attrFilter]);
  const title = TITLE[active ?? "all"];

  const syncUrl = (kind: ProductKind | null, filter: AttributeFilterState) => {
    const qs = filterToQueryString(kind, filter);
    const url = qs ? `/products?${qs}` : "/products";
    window.history.replaceState(null, "", url);
  };

  const handleChange = (next: ProductKind | null) => {
    setActive(next);
    syncUrl(next, attrFilter);
  };

  const handleAttrChange = (next: AttributeFilterState) => {
    setAttrFilter(next);
    syncUrl(active, next);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <ProductFilter active={active} onChange={handleChange} />
      </header>

      <div className="mb-8">
        <AttributeFilters value={attrFilter} onChange={handleAttrChange} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          目前沒有商品。
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, idx) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="group block">
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                    {p.image_urls[0] ? (
                      <Image
                        src={p.image_urls[0]}
                        alt={p.name}
                        fill
                        // 桌面 grid 第 1 row（lg 3 欄、sm 2 欄）跟 LCP 競爭，
                        // 先 3 張 priority 預載；後面卡片 lazy 由 next/image 預設處理。
                        priority={idx < 3}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
                    <WishlistToggle
                      productId={p.id}
                      initialInWishlist={wishlistIds.includes(p.id)}
                      isLoggedIn={isLoggedIn}
                      variant="heart"
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
