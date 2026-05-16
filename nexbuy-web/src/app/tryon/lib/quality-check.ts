// Pure quality gates for try-on selfies. No browser APIs — caller computes
// average luma from canvas and passes it in.

export interface Landmark {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  z: number;
}

export type QualityResult =
  | { ok: true }
  | { ok: false; reason: "no-face" | "too-dark" | "side-face" };

const BRIGHTNESS_MIN = 60; // 0..255 luma
const FRONTALITY_RATIO_MAX = 1.3; // max(L,R)/min(L,R) — bigger = more profile

/**
 * Gate ordering (short-circuit on first fail):
 *   1. no-face: landmarks empty
 *   2. too-dark: avg luma < BRIGHTNESS_MIN
 *   3. side-face: asymmetry between left-eye-to-nose vs right-eye-to-nose
 *      horizontal distances exceeds FRONTALITY_RATIO_MAX
 *
 * Landmark indices follow MediaPipe FaceLandmarker convention:
 *   1   = nose tip
 *   33  = left eye outer corner (viewer's left)
 *   263 = right eye outer corner
 */
export function checkQuality(
  landmarks: Landmark[],
  avgLuma: number,
): QualityResult {
  if (landmarks.length === 0) {
    return { ok: false, reason: "no-face" };
  }
  if (avgLuma < BRIGHTNESS_MIN) {
    return { ok: false, reason: "too-dark" };
  }

  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const leftDist = Math.abs(nose.x - leftEye.x);
  const rightDist = Math.abs(rightEye.x - nose.x);

  // Guard against degenerate (both zero) cases
  if (leftDist === 0 || rightDist === 0) {
    return { ok: false, reason: "side-face" };
  }

  const ratio = Math.max(leftDist, rightDist) / Math.min(leftDist, rightDist);
  if (ratio > FRONTALITY_RATIO_MAX) {
    return { ok: false, reason: "side-face" };
  }

  return { ok: true };
}
