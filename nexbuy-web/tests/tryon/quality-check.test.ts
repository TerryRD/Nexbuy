import { describe, it, expect } from "vitest";
import { checkQuality, type Landmark } from "@/app/tryon/lib/quality-check";

// Helper to build a fake landmark
const lm = (x: number, y: number): Landmark => ({ x, y, z: 0 });

// A minimal 264-element landmark array (MediaPipe FaceLandmarker returns 478,
// but the quality check only reads indices 1, 33, 263, so we fill 264 entries
// to make access at 263 valid).
function buildFrontalLandmarks(): Landmark[] {
  const arr: Landmark[] = new Array(264).fill(lm(0.5, 0.5));
  arr[1] = lm(0.5, 0.5);     // nose tip (centered)
  arr[33] = lm(0.4, 0.45);   // left eye outer corner
  arr[263] = lm(0.6, 0.45);  // right eye outer corner — symmetric
  return arr;
}

function buildSideLandmarks(): Landmark[] {
  const arr = buildFrontalLandmarks();
  // Push the nose far to one side so left eye is much closer to nose than right
  arr[1] = lm(0.43, 0.5);
  arr[33] = lm(0.4, 0.45);
  arr[263] = lm(0.7, 0.45);
  return arr;
}

describe("checkQuality", () => {
  it("returns no-face when landmarks empty", () => {
    expect(checkQuality([], 200)).toEqual({ ok: false, reason: "no-face" });
  });

  it("returns too-dark when luma below 60", () => {
    expect(checkQuality(buildFrontalLandmarks(), 30)).toEqual({
      ok: false,
      reason: "too-dark",
    });
  });

  it("returns side-face when nose is asymmetric", () => {
    expect(checkQuality(buildSideLandmarks(), 200)).toEqual({
      ok: false,
      reason: "side-face",
    });
  });

  it("returns ok on frontal well-lit face", () => {
    expect(checkQuality(buildFrontalLandmarks(), 200)).toEqual({ ok: true });
  });

  it("brightness check runs even with no face (no-face wins)", () => {
    // no-face short-circuits before brightness
    expect(checkQuality([], 10)).toEqual({ ok: false, reason: "no-face" });
  });
});
