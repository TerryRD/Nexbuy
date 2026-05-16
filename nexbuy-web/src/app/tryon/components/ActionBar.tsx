"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ShoppingCart, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types/database";
import { downloadCanvasAsPng } from "../lib/canvas-renderer";

interface Props {
  product: Product;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function ActionBar({ product, canvasRef }: Props) {
  const router = useRouter();
  const { add } = useCart();

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const filename = `tryon-${product.slug}-${Date.now()}.png`;
    try {
      await downloadCanvasAsPng(canvas, filename);
    } catch (e) {
      console.error(e);
      alert("下載失敗,請重試");
    }
  }

  function handleAddToCart() {
    add({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      price_cents: product.price_cents,
      image_url: product.image_urls[0],
      quantity: 1,
    });
    router.push("/cart");
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <p className="font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(product.price_cents)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="size-4 mr-1" />
          下載
        </Button>

        <Link
          href={`/products/${product.slug}`}
          className="inline-flex items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-all hover:bg-muted h-7 gap-1"
        >
          <ExternalLink className="size-3.5" />
          看詳情
        </Link>

        {product.kind === "finished" ? (
          <Button
            className="col-span-2"
            onClick={handleAddToCart}
            disabled={(product.finished_stock ?? 0) <= 0}
          >
            <ShoppingCart className="size-4 mr-1" />
            {(product.finished_stock ?? 0) <= 0 ? "已售完" : "加入購物車"}
          </Button>
        ) : (
          <Link
            href={`/appointment/book/${product.slug}`}
            className="col-span-2 inline-flex items-center justify-center rounded-lg border border-transparent bg-clip-padding bg-primary text-primary-foreground px-2.5 text-sm font-medium transition-all hover:bg-primary/80 h-8 gap-1.5"
          >
            <Calendar className="size-4" />
            預約到店配鏡
          </Link>
        )}
      </div>
    </div>
  );
}
