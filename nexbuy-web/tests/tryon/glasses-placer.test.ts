import { describe, it, expect } from "vitest";
import {
  computeBasePlacement,
  applyAdjustment,
  type Landmark,
} from "@/app/tryon/lib/glasses-placer";

const lm = (x: number, y: number): Landmark => ({ x, y, z: 0 });

function buildLandmarks(): Landmark[] {
  // Eyes at y=0.45, 30% screen-width apart, eyebrow at y=0.4
  const arr: Landmark[] = new Array(264).fill(lm(0.5, 0.5));
  arr[33] = lm(0.4, 0.45);
  arr[263] = lm(0.7, 0.45);
  arr[168] = lm(0.55, 0.4);
  return arr;
}

describe("computeBasePlacement", () => {
  it("places glasses center between eyes horizontally", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // cx = (0.4 + 0.7) / 2 * 1000 = 550
    expect(p.cx).toBeCloseTo(550, 1);
  });

  it("places glasses vertically at eyebrow", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // cy = 0.4 * 1000 = 400
    expect(p.cy).toBeCloseTo(400, 1);
  });

  it("scales glasses width to eye-distance * 2.1", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // eye distance normalized = 0.3, width = 0.3 * 1000 * 2.1 = 630
    expect(p.w).toBeCloseTo(630, 1);
  });

  it("preserves PNG aspect ratio in height", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    // h = w * (80 / 200) = 630 * 0.4 = 252
    expect(p.h).toBeCloseTo(252, 1);
  });

  it("returns angle 0 for horizontal eye line", () => {
    const p = computeBasePlacement(
      buildLandmarks(),
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    expect(p.angle).toBeCloseTo(0, 3);
  });

  it("returns positive angle when right eye is lower than left", () => {
    const arr = buildLandmarks();
    arr[263] = lm(0.7, 0.5); // right eye lower
    const p = computeBasePlacement(
      arr,
      { naturalWidth: 200, naturalHeight: 80 },
      { width: 1000, height: 1000 },
    );
    expect(p.angle).toBeGreaterThan(0);
  });
});

describe("applyAdjustment", () => {
  const base = { cx: 500, cy: 400, w: 600, h: 240, angle: 0 };

  it("widthScale scales w and h equally", () => {
    const a = applyAdjustment(base, { widthScale: 1.2, yOffset: 0, angle: 0 }, 1000);
    expect(a.w).toBeCloseTo(720, 1);
    expect(a.h).toBeCloseTo(288, 1);
    expect(a.cx).toBe(500);
    expect(a.cy).toBe(400);
  });

  it("yOffset shifts cy by normalized fraction of selfie height", () => {
    const a = applyAdjustment(base, { widthScale: 1, yOffset: 0.02, angle: 0 }, 1000);
    expect(a.cy).toBeCloseTo(420, 1); // 400 + 0.02 * 1000
  });

  it("angle adds to base angle", () => {
    const a = applyAdjustment(base, { widthScale: 1, yOffset: 0, angle: 0.1 }, 1000);
    expect(a.angle).toBeCloseTo(0.1, 3);
  });
});
