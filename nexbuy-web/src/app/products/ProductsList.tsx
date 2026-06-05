"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product, ProductKind } from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { AttributeFilters } from "./AttributeFilters";
import { SortSelect } from "@/components/site/SortSelect";
import { sortProducts, type SortKey } from "./sort";
import { FRAME_SHAPES } from "@/lib/schemas/product";
import {
  filterToQueryString,
  EMPTY_FILTER,
  type AttributeFilterState,
} from "./attribute-filter";

const TITLE: Record<"all" | ProductKind, string> = {
  all: "全部商品",
  finished: "成品眼鏡",
  prescription_frame: "處方鏡架",
};

const chipClass = (isActive: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1 text-sm transition ${
    isActive
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
  }`;

export function ProductsList({
  products,
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
  const [sortKey, setSortKey] = useState<SortKey>("recommended");

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
  }, [products, active, attrFilter, searchQuery]);

  const sorted = useMemo(() => sortProducts(filtered, sortKey), [filtered, sortKey]);

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

  const hasActiveFilters =
    active !== null ||
    searchQuery.trim() !== "" ||
    attrFilter.faceShapes.length > 0 ||
    !!attrFilter.frameShape ||
    !!attrFilter.frameSize ||
    !!attrFilter.material ||
    !!attrFilter.color;

  const clearAll = () => {
    setActive(null);
    setAttrFilter(EMPTY_FILTER);
    setSearchQuery("");
    syncUrl(null, EMPTY_FILTER);
  };

  return (
    <div className="container py-10 md:py-14">
      {/* Header */}
      <header className="mb-8">
        <p className="eyebrow mb-2">
          {active === "prescription_frame"
            ? "PRESCRIPTION FRAMES"
            : active === "finished"
            ? "SUNGLASSES"
            : "ALL EYEWEAR"}
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          {active === "prescription_frame"
            ? "線上挑款，預約到店驗光配鏡。"
            : active === "finished"
            ? "成品太陽眼鏡，線上直接下單到家。"
            : "成品太陽眼鏡線上直購；處方鏡框線上挑款、到店配鏡。"}
        </p>
      </header>

      {/* Truncated warning */}
      {truncated && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          ⚠️ 商品數已超過頁面顯示上限，目前只列出最新 {products.length} 件 — 需要動 server-side
          分頁，請聯絡技術人員。
        </p>
      )}

      {/* Main filter row: type chips + frame-shape chips */}
      <div className="mb-5 -mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0">
        <div className="flex w-max items-center gap-2 md:w-auto md:flex-wrap">
          {(
            [
              { v: null as null | "finished" | "prescription_frame", label: "全部" },
              { v: "finished" as const, label: "成品太陽眼鏡" },
              { v: "prescription_frame" as const, label: "處方鏡框" },
            ] as const
          ).map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => handleChange(t.v)}
              aria-pressed={active === t.v}
              className={chipClass(active === t.v)}
            >
              {t.label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
          {FRAME_SHAPES.map((fs) => (
            <button
              key={fs}
              type="button"
              aria-pressed={attrFilter.frameShape === fs}
              onClick={() =>
                handleAttrChange({
                  ...attrFilter,
                  frameShape: attrFilter.frameShape === fs ? null : fs,
                })
              }
              className={chipClass(attrFilter.frameShape === fs)}
            >
              {fs}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
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

      {/* Collapsible more-filters (臉型/尺寸/材質/主色) */}
      <div className="mb-6">
        <AttributeFilters value={attrFilter} onChange={handleAttrChange} />
      </div>

      {/* Result row: count + clear + sort */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>共 {sorted.length} 副</span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <X className="size-3.5" /> 清除篩選
            </button>
          )}
        </div>
        <SortSelect value={sortKey} onChange={setSortKey} />
      </div>

      {/* Grid / empty state */}
      {sorted.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            {searchQuery.trim()
              ? `找不到「${searchQuery.trim()}」相關商品。`
              : "沒有符合條件的商品。"}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-foreground/40"
            >
              清除篩選
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-x-5 gap-y-8 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] md:gap-x-7 md:gap-y-12">
          {sorted.map((p, idx) => (
            <li key={p.id}>
              <ProductCard
                product={p}
                inWishlist={wishlistIds.includes(p.id)}
                isLoggedIn={isLoggedIn}
                priority={idx < 4}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
