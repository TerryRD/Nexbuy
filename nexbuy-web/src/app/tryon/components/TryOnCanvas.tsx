"use client";

import { useEffect } from "react";
import { renderTryOn } from "../lib/canvas-renderer";
import type { Placement } from "../lib/glasses-placer";

interface Props {
  selfie: ImageBitmap;
  glasses: HTMLImageElement | null;
  placement: Placement | null;
  /** Parent owns the ref so it can call canvas.toBlob() for download. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function TryOnCanvas({ selfie, glasses, placement, canvasRef }: Props) {
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
    <div className="relative w-full overflow-hidden rounded-lg bg-muted">
      <canvas
        ref={canvasRef}
        className="block w-full h-auto"
      />
    </div>
  );
}
