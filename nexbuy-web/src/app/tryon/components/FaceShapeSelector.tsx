"use client";

import { cn } from "@/lib/utils";
import { FACE_SHAPES } from "@/lib/schemas/product";
import {
  type FaceShape,
  getRecommendedFrames,
} from "../lib/face-recommendations";

interface Props {
  value: FaceShape | null;
  onChange: (next: FaceShape | null) => void;
}

export function FaceShapeSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">我的臉型</p>
      <div className="flex flex-wrap gap-1.5">
        <Chip
          active={value === null}
          onClick={() => onChange(null)}
        >
          全部
        </Chip>
        {FACE_SHAPES.map((shape) => (
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
        <p className="text-xs text-foreground/80 pt-1">
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
        "rounded-full border px-2.5 py-1 text-xs transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
