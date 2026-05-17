"use client";

import Image from "next/image";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

interface Props {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onInfoClick?: (id: string) => void;
}

export function ProductCarousel({
  products,
  selectedId,
  onSelect,
  onInfoClick,
}: Props) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        目前還沒有可試戴的款式
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 pb-2">
        {products.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative shrink-0 w-24 rounded-lg border-2 bg-card transition",
              selectedId === p.id
                ? "border-primary"
                : "border-transparent hover:border-muted-foreground/30",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={selectedId === p.id}
              className="block w-full p-2 text-left"
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
            {onInfoClick && (
              <button
                type="button"
                onClick={() => onInfoClick(p.id)}
                aria-label={`查看 ${p.name} 詳細資訊`}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/85 text-muted-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm transition hover:bg-background hover:text-foreground"
              >
                <Info className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
