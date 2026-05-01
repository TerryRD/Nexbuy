"use client";

import { useState } from "react";
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

const TITLE: Record<"all" | ProductKind, string> = {
  all: "全部商品",
  finished: "成品眼鏡",
  prescription_frame: "處方鏡架",
};

export function ProductsList({
  products,
  initialKind,
}: {
  products: Product[];
  initialKind: ProductKind | null;
}) {
  const [active, setActive] = useState<ProductKind | null>(initialKind);

  const filtered = active
    ? products.filter((p) => p.kind === active)
    : products;
  const title = TITLE[active ?? "all"];

  const handleChange = (next: ProductKind | null) => {
    setActive(next);
    // Sync URL without re-triggering the App Router (router.replace would
    // refetch the page). history.replaceState updates the address bar so
    // copy-link / refresh land back at the same filter.
    const url = next ? `/products?kind=${next}` : "/products";
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <ProductFilter active={active} onChange={handleChange} />
      </header>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          目前沒有商品。
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                    {p.image_urls[0] ? (
                      <Image
                        src={p.image_urls[0]}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
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
