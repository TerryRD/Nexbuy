"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Product, ProductKind } from "@/lib/types/database";
import { FRAME_SHAPES } from "@/lib/schemas/product";

export type PriceBand = "all" | "low" | "mid" | "high";

export interface Filters {
  kind: "all" | ProductKind;
  frameShape: string | null;
  brand: string | null;
  priceBand: PriceBand;
}

export const DEFAULT_FILTERS: Filters = {
  kind: "all",
  frameShape: null,
  brand: null,
  priceBand: "all",
};

const PRICE_BANDS: { id: PriceBand; label: string }[] = [
  { id: "all", label: "全價位" },
  { id: "low", label: "≤ NT$1,000" },
  { id: "mid", label: "NT$1,000–3,000" },
  { id: "high", label: "≥ NT$3,000" },
];

interface Props {
  products: Product[];
  value: Filters;
  onChange: (next: Filters) => void;
}

export function FilterBar({ products, value, onChange }: Props) {
  // Brand list is dynamic from products; only show filter if any brand exists.
  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.brand && p.brand.trim()) set.add(p.brand.trim());
    }
    return Array.from(set).sort();
  }, [products]);

  function patch(partial: Partial<Filters>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">篩選</p>
        {(value.kind !== "all" ||
          value.frameShape !== null ||
          value.brand !== null ||
          value.priceBand !== "all") && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            清除
          </button>
        )}
      </div>

      <Group label="類型">
        <Chip active={value.kind === "all"} onClick={() => patch({ kind: "all" })}>
          全部
        </Chip>
        <Chip
          active={value.kind === "finished"}
          onClick={() => patch({ kind: "finished" })}
        >
          太陽眼鏡
        </Chip>
        <Chip
          active={value.kind === "prescription_frame"}
          onClick={() => patch({ kind: "prescription_frame" })}
        >
          處方鏡架
        </Chip>
      </Group>

      <Group label="鏡架形狀">
        <Chip
          active={value.frameShape === null}
          onClick={() => patch({ frameShape: null })}
        >
          全部
        </Chip>
        {FRAME_SHAPES.map((shape) => (
          <Chip
            key={shape}
            active={value.frameShape === shape}
            onClick={() => patch({ frameShape: shape })}
          >
            {shape}
          </Chip>
        ))}
      </Group>

      {brands.length > 0 && (
        <Group label="品牌">
          <Chip
            active={value.brand === null}
            onClick={() => patch({ brand: null })}
          >
            全部
          </Chip>
          {brands.map((b) => (
            <Chip
              key={b}
              active={value.brand === b}
              onClick={() => patch({ brand: b })}
            >
              {b}
            </Chip>
          ))}
        </Group>
      )}

      <Group label="價格帶">
        {PRICE_BANDS.map((b) => (
          <Chip
            key={b.id}
            active={value.priceBand === b.id}
            onClick={() => patch({ priceBand: b.id })}
          >
            {b.label}
          </Chip>
        ))}
      </Group>
    </div>
  );
}

interface GroupProps {
  label: string;
  children: React.ReactNode;
}

function Group({ label, children }: GroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mr-1">
        {label}
      </span>
      {children}
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Apply filters to a product list. Pure function — call in useMemo on the
 * caller side.
 */
export function applyFilters(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    if (filters.kind !== "all" && p.kind !== filters.kind) return false;
    if (filters.frameShape && p.frame_shape !== filters.frameShape) return false;
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.priceBand !== "all") {
      const c = p.price_cents;
      if (filters.priceBand === "low" && c > 100_000) return false;
      if (
        filters.priceBand === "mid" &&
        (c <= 100_000 || c > 300_000)
      )
        return false;
      if (filters.priceBand === "high" && c <= 300_000) return false;
    }
    return true;
  });
}
