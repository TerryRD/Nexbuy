"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/product-placeholder";
import { ProductImageCarousel } from "@/app/products/[slug]/ProductImageCarousel";
import type { Product } from "@/lib/types/database";

interface Props {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange }: Props) {
  const displayImages =
    product.image_urls.length > 0
      ? product.image_urls
      : [getProductImageUrl(product)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl lg:max-w-3xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="overflow-y-auto px-4 pt-4 pb-2">
          <DialogHeader className="sr-only">
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              {product.kind === "finished" ? "成品眼鏡" : "處方鏡架"} 商品詳情
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 md:grid-cols-2">
            <ProductImageCarousel images={displayImages} alt={product.name} />

            <div className="space-y-4">
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
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {product.name}
                </h2>
                <p className="text-xl font-semibold">
                  {formatPrice(product.price_cents)}
                </p>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              )}

              <ProductAttributes product={product} />
            </div>
          </div>
        </div>

        <DialogFooter className="m-0 rounded-none border-t-0">
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ExternalLink className="size-4 mr-1" />
            開啟完整頁面
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  if (product.frame_shape) {
    rows.push({ label: "框形", value: product.frame_shape });
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
    <dl className="space-y-2 rounded-lg border bg-card/40 p-3 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted-foreground">{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
