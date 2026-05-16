// Pure draw: clears canvas, paints selfie as base layer, paints glasses
// rotated/scaled/positioned on top.

import type { Placement } from "./glasses-placer";

export interface RenderInput {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  selfie: ImageBitmap | HTMLImageElement;
  glasses: HTMLImageElement | null;
  placement: Placement | null;
}

export function renderTryOn({
  ctx,
  canvas,
  selfie,
  glasses,
  placement,
}: RenderInput): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Layer 1: selfie (fills canvas, preserving aspect via cover-fit)
  ctx.drawImage(selfie, 0, 0, canvas.width, canvas.height);

  // Layer 2: glasses (skip if not ready)
  if (!glasses || !placement) return;
  if (!glasses.complete || glasses.naturalWidth === 0) return;

  ctx.save();
  ctx.translate(placement.cx, placement.cy);
  ctx.rotate(placement.angle);
  ctx.drawImage(
    glasses,
    -placement.w / 2,
    -placement.h / 2,
    placement.w,
    placement.h,
  );
  ctx.restore();
}

/**
 * Compute average luma (0..255) of an ImageBitmap, by downscaling to 64x64
 * onto an offscreen canvas. Used by the quality-check.
 */
export function computeAverageLuma(
  selfie: ImageBitmap,
): number {
  const SAMPLE = 64;
  const offscreen = document.createElement("canvas");
  offscreen.width = SAMPLE;
  offscreen.height = SAMPLE;
  const ctx = offscreen.getContext("2d");
  if (!ctx) return 255; // optimistic — don't trigger too-dark on env weirdness
  ctx.drawImage(selfie, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (SAMPLE * SAMPLE);
}

/**
 * Trigger a download of the current canvas content as PNG.
 */
export async function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("無法產生圖片");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
