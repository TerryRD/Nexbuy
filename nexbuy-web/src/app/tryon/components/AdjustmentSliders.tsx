"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  type Adjustment,
  ADJUSTMENT_DEFAULTS,
  ADJUSTMENT_RANGES,
} from "../lib/glasses-placer";

interface Props {
  value: Adjustment;
  onChange: (next: Adjustment) => void;
}

export function AdjustmentSliders({ value, onChange }: Props) {
  const { widthScale, yOffset, angle } = ADJUSTMENT_RANGES;

  function patch(partial: Partial<Adjustment>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">微調</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(ADJUSTMENT_DEFAULTS)}
          className="h-7 border-red-500/60 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
        >
          重置
        </Button>
      </div>

      <SliderRow
        label="大小"
        leftHint="小"
        rightHint="大"
        value={value.widthScale}
        min={widthScale.min}
        max={widthScale.max}
        step={widthScale.step}
        onChange={(v) => patch({ widthScale: v })}
      />
      <SliderRow
        label="高低"
        leftHint="上"
        rightHint="下"
        value={value.yOffset}
        min={yOffset.min}
        max={yOffset.max}
        step={yOffset.step}
        onChange={(v) => patch({ yOffset: v })}
      />
      <SliderRow
        label="角度"
        leftHint="左旋"
        rightHint="右旋"
        value={value.angle}
        min={angle.min}
        max={angle.max}
        step={angle.step}
        onChange={(v) => patch({ angle: v })}
      />
    </div>
  );
}

interface RowProps {
  label: string;
  leftHint: string;
  rightHint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function SliderRow({
  label,
  leftHint,
  rightHint,
  value,
  min,
  max,
  step,
  onChange,
}: RowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-sm font-medium text-foreground/90">{label}</span>
        <span className="text-muted-foreground">
          <span>{leftHint}</span>
          <span className="mx-2 text-muted-foreground/60">←→</span>
          <span>{rightHint}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(typeof v === "number" ? v : v[0])}
      />
    </div>
  );
}
