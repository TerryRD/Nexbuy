"use client";

import { useEffect, useRef } from "react";
import { renderTryOn } from "../lib/canvas-renderer";
import type { Placement } from "../lib/glasses-placer";

interface Props {
  selfie: ImageBitmap;
  glasses: HTMLImageElement | null;
  placement: Placement | null;
  /** Exposed so the parent can call canvas.toBlob for download. */
  canvasRef?: React.Ref<HTMLCanvasElement>;
}

export function TryOnCanvas({ selfie, glasses, placement, canvasRef }: Props) {
  const localRef = useRef<HTMLCanvasElement | null>(null);

  // Forward to parent ref
  useEffect(() => {
    if (!canvasRef) return;
    if (typeof canvasRef === "function") canvasRef(localRef.current);
    else (canvasRef as React.RefObject<HTMLCanvasElement | null>).current = localRef.current;
  }, [canvasRef]);

  useEffect(() => {
    const canvas = localRef.current;
    if (!canvas) return;

    // Match canvas resolution to selfie (preserves quality on download)
    canvas.width = selfie.width;
    canvas.height = selfie.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderTryOn({ ctx, canvas, selfie, glasses, placement });
  }, [selfie, glasses, placement]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-muted">
      <canvas
        ref={localRef}
        className="block w-full h-auto"
      />
    </div>
  );
}
