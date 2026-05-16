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
        <h3 className="text-sm font-medium">微調</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange(ADJUSTMENT_DEFAULTS)}
          className="h-7 text-xs"
        >
          重置
        </Button>
      </div>

      <SliderRow
        label="大小"
        value={value.widthScale}
        min={widthScale.min}
        max={widthScale.max}
        step={widthScale.step}
        onChange={(v) => patch({ widthScale: v })}
      />
      <SliderRow
        label="高低"
        value={value.yOffset}
        min={yOffset.min}
        max={yOffset.max}
        step={yOffset.step}
        onChange={(v) => patch({ yOffset: v })}
      />
      <SliderRow
        label="角度"
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
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, onChange }: RowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-xs text-muted-foreground">{label}</span>
      <Slider
        className="flex-1"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(typeof v === "number" ? v : v[0])}
      />
    </div>
  );
}
