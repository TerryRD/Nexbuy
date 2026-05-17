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
        "relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="block max-h-full max-w-full"
        style={{ aspectRatio: `${selfie.width} / ${selfie.height}` }}
      />
    </div>
  );
}
