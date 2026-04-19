import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  is_online_available: z.coerce.boolean(),
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
