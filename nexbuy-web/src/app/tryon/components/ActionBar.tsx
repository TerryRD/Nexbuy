"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Download, ShoppingCart, Calendar, X, ExternalLink, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/database";
import { downloadCanvasAsPng } from "../lib/canvas-renderer";

interface Props {
  product: Product;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function ActionBar({ product, canvasRef }: Props) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

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
    // Brief confirmation; user can keep trying on other frames without
    // leaving the page (they often want to compare/buy multiple).
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
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

        {/* 看詳情 — Dialog */}
        <Dialog.Root>
          <Dialog.Trigger
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ExternalLink className="size-4 mr-1" />
            看詳情
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
            <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background shadow-lg max-h-[90vh]">
              {/* 關閉按鈕 */}
              <div className="flex items-center justify-between p-4 pb-0">
                <Dialog.Title className="font-semibold">商品詳情</Dialog.Title>
                <Dialog.Close className="rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="size-4" />
                </Dialog.Close>
              </div>

              <div className="p-4 space-y-4">
                {/* 商品圖 */}
                {product.image_urls[0] && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={product.image_urls[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 448px) calc(100vw - 2rem), 448px"
                      className="object-contain"
                    />
                  </div>
                )}

                {/* 基本資訊 */}
                <div>
                  <p className="font-semibold text-lg leading-snug">{product.name}</p>
                  {product.brand && (
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  )}
                  <p className="mt-1 text-base font-medium">
                    {formatPrice(product.price_cents)}
                  </p>
                </div>

                {/* 描述 */}
                {product.description && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* 屬性 */}
                {(product.frame_shape ||
                  product.face_shape.length > 0 ||
                  product.material ||
                  product.color) && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    {product.frame_shape && (
                      <>
                        <dt className="text-muted-foreground">鏡架形狀</dt>
                        <dd>{product.frame_shape}</dd>
                      </>
                    )}
                    {product.face_shape.length > 0 && (
                      <>
                        <dt className="text-muted-foreground">適合臉型</dt>
                        <dd>{product.face_shape.join("、")}</dd>
                      </>
                    )}
                    {product.material && (
                      <>
                        <dt className="text-muted-foreground">材質</dt>
                        <dd>{product.material}</dd>
                      </>
                    )}
                    {product.color && (
                      <>
                        <dt className="text-muted-foreground">顏色</dt>
                        <dd>{product.color}</dd>
                      </>
                    )}
                  </dl>
                )}

                {/* CTA */}
                <div className="flex flex-col gap-2 pt-1">
                  {product.kind === "finished" ? (
                    <Button
                      className={cn(
                        "transition-colors",
                        justAdded && "bg-emerald-600 hover:bg-emerald-600 text-white",
                      )}
                      onClick={handleAddToCart}
                      disabled={(product.finished_stock ?? 0) <= 0 || justAdded}
                    >
                      {justAdded ? (
                        <>
                          <Check className="size-4 mr-1" />
                          已加入購物車
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="size-4 mr-1" />
                          {(product.finished_stock ?? 0) <= 0 ? "已售完" : "加入購物車"}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link
                      href={`/appointment/book/${product.slug}`}
                      className={buttonVariants()}
                    >
                      <Calendar className="size-4 mr-1" />
                      預約到店配鏡
                    </Link>
                  )}
                  <Link
                    href={`/products/${product.slug}`}
                    target="_blank"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <ExternalLink className="size-4 mr-1" />
                    前往商品頁
                  </Link>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        {product.kind === "finished" ? (
          <Button
            className={cn(
              "col-span-2 transition-colors",
              justAdded && "bg-emerald-600 hover:bg-emerald-600 text-white",
            )}
            onClick={handleAddToCart}
            disabled={(product.finished_stock ?? 0) <= 0 || justAdded}
          >
            {justAdded ? (
              <>
                <Check className="size-4 mr-1" />
                已加入購物車
              </>
            ) : (
              <>
                <ShoppingCart className="size-4 mr-1" />
                {(product.finished_stock ?? 0) <= 0 ? "已售完" : "加入購物車"}
              </>
            )}
          </Button>
        ) : (
          <Link
            href={`/appointment/book/${product.slug}`}
            className={buttonVariants({ className: "col-span-2" })}
          >
            <Calendar className="size-4 mr-1" />
            預約到店配鏡
          </Link>
        )}
      </div>
    </div>
  );
}
