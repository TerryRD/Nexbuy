"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

interface Props {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProductCarousel({ products, selectedId, onSelect }: Props) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        目前還沒有可試戴的款式
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 pb-2">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "shrink-0 w-24 rounded-lg border-2 bg-card p-2 text-left transition",
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
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-xs">{p.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
