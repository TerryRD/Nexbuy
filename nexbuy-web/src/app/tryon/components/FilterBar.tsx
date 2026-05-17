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
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">篩選</p>
        {hasActiveFilter && (
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

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mr-1">
          價格
        </span>
        <Input
          type="number"
          placeholder="最低"
          min={0}
          value={value.priceMin ?? ""}
          onChange={(e) =>
            patch({ priceMin: e.target.value ? Number(e.target.value) : null })
          }
          className="h-6 w-20 px-2 py-0 text-xs"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="最高"
          min={0}
          value={value.priceMax ?? ""}
          onChange={(e) =>
            patch({ priceMax: e.target.value ? Number(e.target.value) : null })
          }
          className="h-6 w-20 px-2 py-0 text-xs"
        />
        <span className="text-xs text-muted-foreground">元</span>
      </div>
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
