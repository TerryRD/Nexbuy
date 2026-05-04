import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Phase 3 attribute 集合 — 用 zod 校驗，不放 DB CHECK 方便日後擴充。
export const FACE_SHAPES = [
  "圓形",
  "方形",
  "橢圓",
  "心型",
  "倒三角",
] as const;
export const FRAME_SIZES = ["S", "M", "L"] as const;
export const MATERIALS = ["金屬", "醋酸纖維", "TR90", "複合"] as const;
export const COLORS = [
  "黑",
  "棕",
  "玳瑁",
  "金",
  "銀",
  "透明",
  "其他",
] as const;

const baseShape = {
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(slugRegex, "slug 只能用小寫英數字 + dash,例:rx-classic-tortoise"),
  description: z.string().max(2000).optional().nullable(),
  brand: z.string().trim().max(100).optional().nullable(),
  price_cents: z
    .coerce.number()
    .int()
    .min(0)
    .max(10_000_000), // 100,000 NTD ceiling, sanity
  kind: z.enum(["finished", "prescription_frame"]),
  finished_stock: z.coerce.number().int().min(0).max(99_999).optional().nullable(),
  low_stock_threshold: z.coerce.number().int().min(0).max(99_999).default(3),
  is_online_available: z.coerce.boolean(),
  // Phase 3 — attributes 全選填
  face_shape: z.array(z.enum(FACE_SHAPES)).default([]),
  frame_size: z.enum(FRAME_SIZES).optional().nullable(),
  material: z.enum(MATERIALS).optional().nullable(),
  color: z.enum(COLORS).optional().nullable(),
};

const refineStock = (
  data: { kind: string; finished_stock?: number | null | undefined },
  ctx: z.RefinementCtx,
) => {
  if (data.kind === "finished" && (data.finished_stock == null)) {
    ctx.addIssue({
      code: "custom",
      message: "成品眼鏡必填庫存",
      path: ["finished_stock"],
    });
  }
};

export const createProductSchema = z.object(baseShape).superRefine(refineStock);
export const updateProductSchema = z.object(baseShape).superRefine(refineStock);

export type ProductInput = z.infer<typeof createProductSchema>;

// Slugify helper for the admin form's auto-suggest.
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
