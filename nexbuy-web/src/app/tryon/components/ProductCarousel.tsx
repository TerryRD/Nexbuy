"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

interface Props {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Fixed carousel height — large enough that the thumbnail image + 2-line
// product name + horizontal scrollbar all fit without a *vertical* scrollbar
// appearing inside the strip. Also keeps the canvas height stable between
// the populated and empty states.
const CAROUSEL_HEIGHT = "h-[180px]";

export function ProductCarousel({ products, selectedId, onSelect }: Props) {
  if (products.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/20",
          CAROUSEL_HEIGHT,
        )}
      >
        <p className="text-sm text-muted-foreground">目前還沒有可試戴的款式</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", CAROUSEL_HEIGHT)}>
      <div className="flex gap-3 pb-2">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "shrink-0 w-28 rounded-lg border-2 bg-card p-2 text-left transition",
              selectedId === p.id
                ? "border-primary"
                : "border-transparent hover:border-muted-foreground/30",
            )}
          >
            <div className="relative aspect-square overflow-hidden rounded bg-muted">
              {p.image_urls[0] && (
                <Image
                  src={p.image_urls[0]}
                  alt={p.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug">{p.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
