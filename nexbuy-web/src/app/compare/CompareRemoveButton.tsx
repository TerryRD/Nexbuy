"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "@/lib/compare";

/**
 * 比較頁每個商品 column 上的「移除」按鈕。
 * 點下後從 localStorage 移除 + 用新的 ids URL 替換頁面（讓 server
 * 重新 fetch 並渲染剩下的商品）。
 */
export function CompareRemoveButton({ id }: { id: string }) {
  const { remove, ids } = useCompare();
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const handleClick = () => {
    remove(id);
    const remaining = ids.filter((x) => x !== id);
    if (remaining.length === 0) {
      router.push("/products");
    } else {
      router.push(`/compare?ids=${remaining.join(",")}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-0.5 text-xs text-muted-foreground transition hover:border-border hover:text-foreground"
      aria-label="從比較移除"
    >
      <X className="size-3" />
      移除
    </button>
  );
}
