// 臉型 → 適合的框形 mapping + 商品推薦排序。
// Mapping 來自光學業界常見規則。臉型/框形字串對應 src/lib/schemas/product.ts
// 的 FACE_SHAPES / FRAME_SHAPES 集合（同名 enum、不另外定義避免漂移）。

import type { Product } from "@/lib/types/database";
import { FACE_SHAPES } from "@/lib/schemas/product";

export type FaceShape = (typeof FACE_SHAPES)[number];

const RECOMMENDATIONS: Record<FaceShape, readonly string[]> = {
  圓形: ["方框", "飛行員", "雷朋"],
  方形: ["圓框", "橢圓", "飛行員"],
  橢圓: ["圓框", "方框", "橢圓", "飛行員", "貓眼", "雷朋"], // oval = 百搭
  心型: ["圓框", "橢圓", "貓眼"],
  倒三角: ["圓框", "貓眼", "橢圓"],
};

export function getRecommendedFrames(faceShape: FaceShape): readonly string[] {
  return RECOMMENDATIONS[faceShape];
}

/**
 * Score a product's fit for a face shape. Higher = better fit.
 *   - +3 if admin explicitly tagged the product as suiting this face shape
 *     (face_shape array on products contains user's shape)
 *   - +2 if the product's frame_shape is in the recommendation list for this
 *     face shape
 * Returns 0 if neither — product still appears, just sorted to the bottom.
 */
export function scoreProduct(
  product: Pick<Product, "face_shape" | "frame_shape">,
  faceShape: FaceShape,
): number {
  let score = 0;
  if (product.face_shape?.includes(faceShape)) score += 3;
  const recommended = RECOMMENDATIONS[faceShape];
  if (product.frame_shape && recommended.includes(product.frame_shape)) {
    score += 2;
  }
  return score;
}
