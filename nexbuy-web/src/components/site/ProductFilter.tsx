"use client";

import Link from "next/link";

type Kind = "finished" | "prescription_frame" | null;

const ITEMS: { label: string; kind: Kind; href: string }[] = [
  { label: "全部", kind: null, href: "/products" },
  { label: "成品眼鏡", kind: "finished", href: "/products?kind=finished" },
  {
    label: "處方鏡架",
    kind: "prescription_frame",
    href: "/products?kind=prescription_frame",
  },
];

export function ProductFilter({ active }: { active: Kind }) {
  const activeIndex = Math.max(
    0,
    ITEMS.findIndex((i) => i.kind === active),
  );

  return (
    <div
      role="tablist"
      aria-label="商品分類"
      className="relative inline-flex rounded-full border border-border/60 bg-card/60 p-1 backdrop-blur-sm shadow-sm"
    >
      {/* sliding active indicator — width is 1/3 of inner area, so translateX
       * by 100% / 200% of its own width snaps onto the next/last segment. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-primary shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {ITEMS.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <Link
            key={item.label}
            href={item.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            scroll={false}
            className={`relative z-10 inline-flex flex-1 min-w-20 justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
