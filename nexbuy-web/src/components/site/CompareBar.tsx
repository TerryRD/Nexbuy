"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, X } from "lucide-react";
import { useCompare, MAX_COMPARE } from "@/lib/compare";

/**
 * 全站底部 floating bar — 任何頁面只要有商品被加入比較就會浮現。
 * 0 副選取時隱藏。客戶可一鍵走到 /compare 看 side-by-side。
 */
export function CompareBar() {
  const { ids, clear } = useCompare();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  if (!hydrated || ids.length === 0) return null;

  const href = `/compare?ids=${ids.join(",")}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 sm:pb-6">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-card/90 px-4 py-2 shadow-lg backdrop-blur">
        <Scale className="size-4 text-primary" aria-hidden />
        <span className="text-sm">
          已選 <strong>{ids.length}</strong> / {MAX_COMPARE} 副
        </span>
        <Link
          href={href}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          比較
        </Link>
        <button
          type="button"
          onClick={clear}
          aria-label="清空比較"
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
