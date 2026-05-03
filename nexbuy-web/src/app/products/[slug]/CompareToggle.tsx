"use client";

import { useState, useEffect } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare, MAX_COMPARE } from "@/lib/compare";

export function CompareToggle({ productId }: { productId: string }) {
  const { has, toggle, full } = useCompare();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // SSR snapshot 永遠是空陣列，等 client hydrate 後才 render 真實狀態
    return null;
  }

  const inList = has(productId);
  const disabled = !inList && full;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => toggle(productId)}
      className="gap-1.5"
      aria-pressed={inList}
    >
      <Scale className="size-4" />
      {inList
        ? "從比較移除"
        : disabled
          ? `比較已滿 (${MAX_COMPARE})`
          : "加入比較"}
    </Button>
  );
}
