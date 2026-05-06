"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

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

type SingleKey = "frameShape" | "frameSize" | "material" | "color";

interface ActiveTag {
  key: string;
  label: string;
  onRemove: () => void;
}

export function AttributeFilters({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggleFaceShape = (s: string) => {
    const has = value.faceShapes.includes(s);
    onChange({
      ...value,
      faceShapes: has
        ? value.faceShapes.filter((x) => x !== s)
        : [...value.faceShapes, s],
    });
  };

  const setSingle = <K extends SingleKey>(key: K, next: string) => {
    // 點同個 chip 再次 = 取消
    onChange({
      ...value,
      [key]: value[key] === next ? null : next,
    });
  };

  const activeTags: ActiveTag[] = [
    ...value.faceShapes.map<ActiveTag>((s) => ({
      key: `face-${s}`,
      label: `臉型 · ${s}`,
      onRemove: () => toggleFaceShape(s),
    })),
    ...(value.frameShape
      ? [
          {
            key: `frame-${value.frameShape}`,
            label: `框形 · ${value.frameShape}`,
            onRemove: () => onChange({ ...value, frameShape: null }),
          },
        ]
      : []),
    ...(value.frameSize
      ? [
          {
            key: `size-${value.frameSize}`,
            label: `尺寸 · ${value.frameSize}`,
            onRemove: () => onChange({ ...value, frameSize: null }),
          },
        ]
      : []),
    ...(value.material
      ? [
          {
            key: `material-${value.material}`,
            label: `材質 · ${value.material}`,
            onRemove: () => onChange({ ...value, material: null }),
          },
        ]
      : []),
    ...(value.color
      ? [
          {
            key: `color-${value.color}`,
            label: `主色 · ${value.color}`,
            onRemove: () => onChange({ ...value, color: null }),
          },
        ]
      : []),
  ];

  const count = activeTags.length;

  return (
    <div className="rounded-lg border bg-card/40">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="attribute-filter-panel"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-background"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
          篩選
          {count > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">
              {count}
            </span>
          )}
        </button>

        {!open && count > 0 && (
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {activeTags.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={t.onRemove}
                aria-label={`移除篩選：${t.label}`}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-foreground transition hover:bg-primary/20"
              >
                {t.label}
                <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
          </div>
        )}

        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTER)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            清除
          </button>
        )}
      </div>

      {open && (
        <div
          id="attribute-filter-panel"
          className="space-y-2 border-t border-border/60 px-3 py-3"
        >
          <ChipRow
            label="框形"
            options={FRAME_SHAPES}
            isActive={(o) => value.frameShape === o}
            onClick={(o) => setSingle("frameShape", o)}
          />
          <ChipRow
            label="臉型"
            options={FACE_SHAPES}
            isActive={(o) => value.faceShapes.includes(o)}
            onClick={toggleFaceShape}
            hint="可複選"
          />
          <ChipRow
            label="尺寸"
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
      )}
    </div>
  );
}

function ChipRow({
  label,
  options,
  isActive,
  onClick,
  hint,
}: {
  label: string;
  options: readonly string[];
  isActive: (option: string) => boolean;
  onClick: (option: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex w-12 shrink-0 flex-col pt-1 text-xs text-muted-foreground">
        <span>{label}</span>
        {hint && (
          <span className="text-[10px] leading-tight text-muted-foreground/70">
            {hint}
          </span>
        )}
      </span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {options.map((o) => {
          const active = isActive(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onClick(o)}
              aria-pressed={active}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
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
