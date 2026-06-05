import type { Product } from "@/lib/types/database";

export type SortKey = "recommended" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "推薦" },
  { value: "price_asc", label: "價格低→高" },
  { value: "price_desc", label: "價格高→低" },
];

/** finished 且無庫存 = 缺貨。處方鏡框不論庫存皆視為有貨。 */
export function isSoldOut(p: Pick<Product, "kind" | "finished_stock">): boolean {
  return p.kind === "finished" && (p.finished_stock ?? 0) <= 0;
}

/**
 * 排序：缺貨款一律沉底（不論 sortKey）；其餘依 sortKey。
 * recommended 維持傳入順序。用 index 當 tiebreaker 保持穩定。
 */
export function sortProducts<
  T extends Pick<Product, "kind" | "finished_stock" | "price_cents">,
>(items: T[], sortKey: SortKey): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const soldA = isSoldOut(a.item) ? 1 : 0;
      const soldB = isSoldOut(b.item) ? 1 : 0;
      if (soldA !== soldB) return soldA - soldB;
      if (sortKey === "price_asc") return a.item.price_cents - b.item.price_cents || a.index - b.index;
      if (sortKey === "price_desc") return b.item.price_cents - a.item.price_cents || a.index - b.index;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
