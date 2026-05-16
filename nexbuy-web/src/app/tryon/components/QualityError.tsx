"use client";

import { Button } from "@/components/ui/button";

const REASON_MESSAGES = {
  "no-face": "找不到你的臉。請拍一張正面、明亮、五官清楚的自拍。",
  "too-dark": "照片太暗了。試試明亮一點的地方再拍一次。",
  "side-face": "需要正面照才能準確試戴。請正對鏡頭拍一張。",
} as const;

type Reason = keyof typeof REASON_MESSAGES;

interface Props {
  reason: Reason;
  onRetake: () => void;
}

export function QualityError({ reason, onRetake }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-destructive/40 bg-destructive/5 px-6 py-16 text-center">
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-semibold">這張照片試戴不出來</h2>
        <p className="text-sm text-foreground/80">{REASON_MESSAGES[reason]}</p>
      </div>
      <Button size="lg" variant="secondary" onClick={onRetake}>
        重新選照片
      </Button>
    </div>
  );
}
