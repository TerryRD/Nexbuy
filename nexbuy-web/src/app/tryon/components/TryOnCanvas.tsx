"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { renderTryOn } from "../lib/canvas-renderer";
import type { Placement } from "../lib/glasses-placer";

interface Props {
  selfie: ImageBitmap;
  glasses: HTMLImageElement | null;
  placement: Placement | null;
  /** Parent owns the ref so it can call canvas.toBlob() for download. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  className?: string;
}

export function TryOnCanvas({ selfie, glasses, placement, canvasRef, className }: Props) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match canvas resolution to selfie (preserves quality on download)
    canvas.width = selfie.width;
    canvas.height = selfie.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderTryOn({ ctx, canvas, selfie, glasses, placement });
  }, [selfie, glasses, placement, canvasRef]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      {/* canvas stretches to fill the box; object-contain scales the bitmap
          (selfie + glasses overlay) to whichever side hits the limit first,
          so small uploads get scaled up instead of looking tiny. */}
      <canvas
        ref={canvasRef}
        className="block h-full w-full object-contain"
      />
    </div>
  );
}
