"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { ProductFilter } from "@/components/site/ProductFilter";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product, ProductKind } from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { AttributeFilters } from "./AttributeFilters";
import {
  filterToQueryString,
  type AttributeFilterState,
} from "./attribute-filter";

const TITLE: Record<"all" | ProductKind, string> = {
  all: "全部商品",
  finished: "成品眼鏡",
  prescription_frame: "處方鏡架",
};

export function ProductsList({
  products,
  totalCount,
  truncated,
  initialKind,
  initialFilter,
  wishlistIds,
  isLoggedIn,
}: {
  products: Product[];
  /** server count(*) — 可能 > products.length（軟 LIMIT 截斷時）*/
  totalCount: number;
  /** 是否被 LIMIT 截斷 — 截斷時提示「需要 server-side 分頁」*/
  truncated: boolean;
  initialKind: ProductKind | null;
  initialFilter: AttributeFilterState;
  wishlistIds: string[];
  isLoggedIn: boolean;
}) {
  const [active, setActive] = useState<ProductKind | null>(initialKind);
  const [attrFilter, setAttrFilter] =
    useState<AttributeFilterState>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (active && p.kind !== active) return false;
      if (q) {
        const haystack = [p.name, p.brand ?? "", p.description ?? ""]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // face_shape：多選 OR — 商品任一適合臉型符合就算
      if (attrFilter.faceShapes.length > 0) {
        const match = attrFilter.faceShapes.some((s) =>
          (p.face_shape ?? []).includes(s),
        );
        if (!match) return false;
      }
      if (attrFilter.frameShape && p.frame_shape !== attrFilter.frameShape) {
        return false;
      }
      if (attrFilter.frameSize && p.frame_size !== attrFilter.frameSize) {
        return false;
      }
      if (attrFilter.material && p.material !== attrFilter.material) {
        return false;
      }
      if (attrFilter.color && p.color !== attrFilter.color) {
        return false;
      }
      return true;
    });
  }, [products, active, attrFilter]);
  const title = TITLE[active ?? "all"];

  const syncUrl = (kind: ProductKind | null, filter: AttributeFilterState) => {
    const qs = filterToQueryString(kind, filter);
    const url = qs ? `/products?${qs}` : "/products";
    window.history.replaceState(null, "", url);
  };

  const handleChange = (next: ProductKind | null) => {
    setActive(next);
    syncUrl(next, attrFilter);
  };

  const handleAttrChange = (next: AttributeFilterState) => {
    setAttrFilter(next);
    syncUrl(active, next);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {totalCount} 件
            {filtered.length !== totalCount && (
              <> · 篩選後 {filtered.length} 件</>
            )}
          </p>
        </div>
        <ProductFilter active={active} onChange={handleChange} />
      </header>

      {truncated && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          ⚠️ 商品數已超過頁面顯示上限，目前只列出最新 {products.length} 件 — 需要動 server-side
          分頁，請聯絡技術人員。
        </p>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="搜尋商品名稱、品牌…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mb-8">
        <AttributeFilters value={attrFilter} onChange={handleAttrChange} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {searchQuery.trim()
            ? `找不到「${searchQuery.trim()}」相關商品。`
            : "目前沒有商品。"}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, idx) => (
            <li key={p.id}>
              <ProductCard
                product={p}
                inWishlist={wishlistIds.includes(p.id)}
                isLoggedIn={isLoggedIn}
                priority={idx < 3}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
