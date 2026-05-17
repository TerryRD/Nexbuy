"use client";

import { cn } from "@/lib/utils";
import type { Product, ProductKind } from "@/lib/types/database";
import { FRAME_SHAPES } from "@/lib/schemas/product";
import { Input } from "@/components/ui/input";

export interface Filters {
  kind: "all" | ProductKind;
  frameShape: string | null;
  priceMin: number | null; // 元（非 cents）
  priceMax: number | null; // 元（非 cents）
}

export const DEFAULT_FILTERS: Filters = {
  kind: "all",
  frameShape: null,
  priceMin: null,
  priceMax: null,
};

interface Props {
  products: Product[];
  value: Filters;
  onChange: (next: Filters) => void;
}

export function FilterBar({ products: _products, value, onChange }: Props) {
  function patch(partial: Partial<Filters>) {
    onChange({ ...value, ...partial });
  }

  const hasActiveFilter =
    value.kind !== "all" ||
    value.frameShape !== null ||
    value.priceMin !== null ||
    value.priceMax !== null;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">篩選</h3>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="rounded-md border border-red-500/60 px-2 py-0.5 text-xs text-red-600 transition-colors hover:bg-red-50 hover:border-red-500 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
          >
            清除
          </button>
        )}
      </div>

      <Row label="類型">
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
      </Row>

      <Row label="鏡框形狀">
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
      </Row>

      <Row label="價格">
        <div className="flex flex-wrap items-center gap-1.5">
          <Input
            type="number"
            placeholder="最低"
            min={0}
            value={value.priceMin ?? ""}
            onChange={(e) =>
              patch({ priceMin: e.target.value ? Number(e.target.value) : null })
            }
            className="h-8 w-24 px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="最高"
            min={0}
            value={value.priceMax ?? ""}
            onChange={(e) =>
              patch({ priceMax: e.target.value ? Number(e.target.value) : null })
            }
            className="h-8 w-24 px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">元</span>
        </div>
      </Row>
    </div>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
}

/**
 * 2-column layout: fixed-width label on the left + flexible content area on
 * the right. Keeps every row's options aligned vertically; chip rows wrap
 * within their own column so 鏡框形狀 chips don't fall under the label.
 */
function Row({ label, children }: RowProps) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2">
      <span className="pt-1 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
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
        "rounded-full border px-3 py-1 text-sm transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function applyFilters(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    if (filters.kind !== "all" && p.kind !== filters.kind) return false;
    if (filters.frameShape && p.frame_shape !== filters.frameShape) return false;
    if (filters.priceMin !== null && p.price_cents < filters.priceMin * 100)
      return false;
    if (filters.priceMax !== null && p.price_cents > filters.priceMax * 100)
      return false;
    return true;
  });
}
