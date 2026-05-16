// Pure computation: landmarks + glasses PNG natural size → pixel placement.
// All input landmarks are normalized [0,1]; output is in canvas pixel space.

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface Placement {
  cx: number;    // center x, pixels
  cy: number;    // center y, pixels
  w: number;     // pixels
  h: number;     // pixels
  angle: number; // radians
}

export interface Adjustment {
  widthScale: number; // 0.7 .. 1.3
  yOffset: number;    // -0.05 .. 0.05, fraction of selfie height
  angle: number;      // -0.26 .. 0.26 radians
}

export interface GlassesAspect {
  naturalWidth: number;
  naturalHeight: number;
}

export interface SelfieSize {
  width: number;
  height: number;
}

const EYE_TO_GLASSES_WIDTH_RATIO = 2.1; // empirical: adult glasses width / IPD

/**
 * Compute the auto-placed (unadjusted) glasses position from face landmarks.
 *
 * Landmark indices:
 *   33  = left eye outer corner
 *   263 = right eye outer corner
 *   168 = eyebrow center / nose bridge top
 */
export function computeBasePlacement(
  landmarks: Landmark[],
  glassesAspect: GlassesAspect,
  selfie: SelfieSize,
): Placement {
  const left = landmarks[33];
  const right = landmarks[263];
  const brow = landmarks[168];

  const cxNorm = (left.x + right.x) / 2;
  const cyNorm = brow.y;
  const eyeWidthNorm = Math.hypot(right.x - left.x, right.y - left.y);
  const wNorm = eyeWidthNorm * EYE_TO_GLASSES_WIDTH_RATIO;

  // Convert to pixel space
  const cx = cxNorm * selfie.width;
  const cy = cyNorm * selfie.height;
  const w = wNorm * selfie.width;
  const h = w * (glassesAspect.naturalHeight / glassesAspect.naturalWidth);
  const angle = Math.atan2(right.y - left.y, right.x - left.x);

  return { cx, cy, w, h, angle };
}

/**
 * Apply user slider adjustments to a base placement. yOffset is normalized
 * (fraction of selfie height) so the same slider value moves the same visual
 * distance regardless of selfie resolution.
 */
export function applyAdjustment(
  base: Placement,
  adj: Adjustment,
  selfieHeight: number,
): Placement {
  return {
    cx: base.cx,
    cy: base.cy + adj.yOffset * selfieHeight,
    w: base.w * adj.widthScale,
    h: base.h * adj.widthScale,
    angle: base.angle + adj.angle,
  };
}

export const ADJUSTMENT_DEFAULTS: Adjustment = {
  widthScale: 1,
  yOffset: 0,
  angle: 0,
};

export const ADJUSTMENT_RANGES = {
  widthScale: { min: 0.7, max: 1.3, step: 0.01 },
  yOffset: { min: -0.05, max: 0.05, step: 0.001 },
  angle: { min: -0.26, max: 0.26, step: 0.005 },
} as const;
