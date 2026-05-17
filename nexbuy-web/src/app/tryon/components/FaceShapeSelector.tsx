"use client";

import { cn } from "@/lib/utils";
import { FACE_SHAPES } from "@/lib/schemas/product";
import {
  type FaceShape,
  getRecommendedFrames,
} from "../lib/face-recommendations";

// "心型" stays in the schema so existing products that were tagged with it
// (rx-kids-flexible) keep validating, but we hide it from the user-facing
// face-shape picker — it's not a face shape customers naturally identify with.
const DISPLAY_FACE_SHAPES = FACE_SHAPES.filter((s) => s !== "心型");

interface Props {
  value: FaceShape | null;
  onChange: (next: FaceShape | null) => void;
}

export function FaceShapeSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-semibold">我的臉型</p>
      <div className="flex flex-wrap gap-1.5">
        <Chip
          active={value === null}
          onClick={() => onChange(null)}
        >
          全部
        </Chip>
        {DISPLAY_FACE_SHAPES.map((shape) => (
          <Chip
            key={shape}
            active={value === shape}
            onClick={() => onChange(shape)}
          >
            {shape}
          </Chip>
        ))}
      </div>
      {value && (
        <p className="text-sm text-foreground/80 pt-1">
          <span className="font-medium">{value}臉</span>適合：
          {getRecommendedFrames(value).join(" / ")}
        </p>
      )}
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
