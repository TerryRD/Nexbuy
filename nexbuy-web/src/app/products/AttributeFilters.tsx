"use client";

import {
  FACE_SHAPES,
  FRAME_SHAPES,
  FRAME_SIZES,
  MATERIALS,
  COLORS,
} from "@/lib/schemas/product";
import {
  EMPTY_FILTER,
  type AttributeFilterState,
} from "./attribute-filter";

// 純函式 / 型別 / 常數住在 attribute-filter.ts，server component (page.tsx)
// 才 import 得到 — Turbopack 會把 "use client" 模組的非元件 export stub 成
// client reference，server-side 直接 call 會 runtime error。
// 為了不打斷既有 client 端的 import 路徑，這裡 re-export 型別 + EMPTY_FILTER。
export { EMPTY_FILTER, type AttributeFilterState };

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

  const setSingle = <K extends "frameShape" | "frameSize" | "material" | "color">(
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
    value.frameShape !== null ||
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
        label="框形"
        options={FRAME_SHAPES}
        isActive={(o) => value.frameShape === o}
        onClick={(o) => setSingle("frameShape", o)}
      />
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
