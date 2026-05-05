"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  alt: string;
}

/**
 * 商品多角度圖 carousel：
 * - 主視覺一張大圖（aspect-square）
 * - 底下橫向 thumbnail 條，點擊切換
 * - 主視覺左右箭頭（>= 2 張時才出現）
 * - 鍵盤左右鍵也能切
 * - 0 張：不渲染（caller fallback）
 * - 1 張：靜態圖、無箭頭、無 thumbnail
 */
export function ProductImageCarousel({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const total = images.length;

  const next = useCallback(
    () => setIndex((i) => (i + 1) % total),
    [total],
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total],
  );

  useEffect(() => {
    if (total <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, next, prev]);

  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/50">
        <Image
          key={images[index]}
          src={images[index]}
          alt={`${alt} — ${index + 1}/${total}`}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
          priority={index === 0}
          // SVG data URL 已是最終格式 — 跳過 Vercel image optimizer
          unoptimized={images[index]?.startsWith("data:")}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="上一張"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border/60 bg-background/80 p-2 text-foreground shadow-sm transition hover:bg-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="下一張"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border/60 bg-background/80 p-2 text-foreground shadow-sm transition hover:bg-background"
            >
              <ChevronRight className="size-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              {index + 1} / {total}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              type="button"
              key={src}
              onClick={() => setIndex(i)}
              aria-label={`切換到第 ${i + 1} 張`}
              aria-current={i === index}
              className={`relative size-20 shrink-0 overflow-hidden rounded-md border-2 bg-muted/30 transition ${
                i === index
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={src.startsWith("data:")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
