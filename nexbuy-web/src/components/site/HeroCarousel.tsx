"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/products";

const ROTATE_MS = 5500;

export function HeroCarousel({ products }: { products: readonly ProductCardData[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (products.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % products.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [products.length, paused]);

  if (products.length === 0) return null;

  return (
    // role="region" + aria-roledescription 讓 screen reader 知道這是「輪播」。
    // onMouseEnter/Leave 只是 hover 暫停的視覺輔助；鍵盤使用者看不到自動切換
    // 動畫所以不會錯過資訊、無需鍵盤等價，故 disable 此規則。
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="region"
      aria-roledescription="輪播"
      aria-label="精選鏡框"
      className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60 shadow-2xl shadow-primary/15 ring-1 ring-foreground/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {products.map((p, i) => (
        <Link
          key={p.id}
          href={`/products/${p.slug}`}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
        >
          {p.image_urls[0] && (
            <Image
              src={p.image_urls[0]}
              alt={p.name}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
          />
          <div className="absolute inset-x-5 bottom-5 font-heading md:inset-x-7 md:bottom-7">
            <div className="text-xl font-medium leading-tight tracking-tight text-white md:text-2xl">
              {p.name}
            </div>
            <div className="mt-1 font-serif text-lg text-white/90">
              {formatPrice(p.price_cents)}
            </div>
          </div>
        </Link>
      ))}

      {products.length > 1 && (
        <div className="absolute right-5 top-5 flex gap-1.5 md:right-7 md:top-7">
          {products.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`第 ${i + 1} 張，共 ${products.length} 張`}
              aria-current={i === index}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
