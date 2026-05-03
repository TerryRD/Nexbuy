"use client";

import {
  FACE_SHAPES,
  FRAME_SIZES,
  MATERIALS,
  COLORS,
} from "@/lib/schemas/product";

export interface AttributeFilterState {
  faceShapes: string[]; // multi
  frameSize: string | null; // single
  material: string | null; // single
  color: string | null; // single
}

export const EMPTY_FILTER: AttributeFilterState = {
  faceShapes: [],
  frameSize: null,
  material: null,
  color: null,
};

interface Props {
  value: AttributeFilterState;
  onChange: (next: AttributeFilterState) => void;
}

export function AttributeFilters({ value, onChange }: Props) {
  const toggleFaceShape = (s: string) => {
    const has = value.faceShapes.includes(s);
    onChange({
      ...value,
      faceShapes: has
        ? value.faceShapes.filter((x) => x !== s)
        : [...value.faceShapes, s],
    });
  };

  const setSingle = <K extends "frameSize" | "material" | "color">(
    key: K,
    next: string,
  ) => {
    // 點同個 chip 再次 = 取消
    onChange({
      ...value,
      [key]: value[key] === next ? null : next,
    });
  };

  const hasAny =
    value.faceShapes.length > 0 ||
    value.frameSize !== null ||
    value.material !== null ||
    value.color !== null;

  return (
    <div className="space-y-3 rounded-lg border bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          篩選
        </span>
        {hasAny && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTER)}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            清除全部
          </button>
        )}
      </div>

      <ChipRow
        label="適合臉型"
        options={FACE_SHAPES}
        isActive={(o) => value.faceShapes.includes(o)}
        onClick={toggleFaceShape}
        multi
      />
      <ChipRow
        label="鏡架尺寸"
        options={FRAME_SIZES}
        isActive={(o) => value.frameSize === o}
        onClick={(o) => setSingle("frameSize", o)}
      />
      <ChipRow
        label="材質"
        options={MATERIALS}
        isActive={(o) => value.material === o}
        onClick={(o) => setSingle("material", o)}
      />
      <ChipRow
        label="主色"
        options={COLORS}
        isActive={(o) => value.color === o}
        onClick={(o) => setSingle("color", o)}
      />
    </div>
  );
}

function ChipRow({
  label,
  options,
  isActive,
  onClick,
  multi,
}: {
  label: string;
  options: readonly string[];
  isActive: (option: string) => boolean;
  onClick: (option: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">
        {label}
        {multi && " (可複選)"}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = isActive(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onClick(o)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-background/80 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helpers shared with the page: encode/decode filter state to/from URL params.
export function filterToQueryString(
  kind: string | null,
  filter: AttributeFilterState,
): string {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  filter.faceShapes.forEach((s) => params.append("face_shape", s));
  if (filter.frameSize) params.set("frame_size", filter.frameSize);
  if (filter.material) params.set("material", filter.material);
  if (filter.color) params.set("color", filter.color);
  return params.toString();
}

export function filterFromSearchParams(sp: {
  face_shape?: string | string[];
  frame_size?: string;
  material?: string;
  color?: string;
}): AttributeFilterState {
  const fs = sp.face_shape;
  return {
    faceShapes: Array.isArray(fs) ? fs : fs ? [fs] : [],
    frameSize: sp.frame_size ?? null,
    material: sp.material ?? null,
    color: sp.color ?? null,
  };
}
