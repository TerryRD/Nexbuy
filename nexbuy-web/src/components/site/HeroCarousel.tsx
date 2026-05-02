"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Slide {
  src: string;
  alt: string;
}

const ROTATE_MS = 5500;

export function HeroCarousel({ slides }: { slides: readonly Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused]);

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60 shadow-2xl shadow-primary/15 ring-1 ring-foreground/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={s.src}
            alt={s.alt}
            fill
            priority={i === 0}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
      />
      <div className="bg-grain absolute inset-0" aria-hidden />

      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 font-heading md:inset-x-7 md:bottom-7">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/75">
            Est · 在地
          </div>
          <div className="mt-1 text-xl font-medium leading-[1.05] tracking-tight text-white md:text-3xl">
            Jing Hong Optical
          </div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[0.2em] text-white/55">
          25.0173°N
          <br />
          121.2956°E
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute right-5 top-5 flex gap-1.5 md:right-7 md:top-7">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`第 ${i + 1} 張，共 ${slides.length} 張`}
              aria-current={i === index}
              className={`h-1 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
