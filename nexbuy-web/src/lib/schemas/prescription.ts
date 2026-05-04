import { z } from "zod";

// 0.25 step 校驗：度數慣例每階 0.25
const quarterStep = (max: number, min: number) =>
  z.coerce
    .number()
    .min(min)
    .max(max)
    .refine((v) => Math.round(v * 4) === v * 4, {
      message: "度數需為 0.25 的倍數",
    });

const optionalNumber = <T extends z.ZodType>(schema: T) =>
  z
    .union([z.literal(""), schema])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

export const prescriptionSchema = z
  .object({
    exam_date: z.iso.date(),
    right_sphere: optionalNumber(quarterStep(30, -30)),
    right_cylinder: optionalNumber(quarterStep(10, -10)),
    right_axis: optionalNumber(z.coerce.number().int().min(0).max(180)),
    right_add: optionalNumber(quarterStep(5, 0)),
    left_sphere: optionalNumber(quarterStep(30, -30)),
    left_cylinder: optionalNumber(quarterStep(10, -10)),
    left_axis: optionalNumber(z.coerce.number().int().min(0).max(180)),
    left_add: optionalNumber(quarterStep(5, 0)),
    pd: optionalNumber(z.coerce.number().int().min(40).max(90)),
    notes: z
      .string()
      .max(2000)
      .optional()
      .transform((v) => (v && v.trim() !== "" ? v : null)),
  })
  .superRefine((d, ctx) => {
    // 散光有值就要軸度
    if (d.right_cylinder !== null && d.right_axis === null) {
      ctx.addIssue({
        code: "custom",
        message: "右眼有散光時要填軸度",
        path: ["right_axis"],
      });
    }
    if (d.left_cylinder !== null && d.left_axis === null) {
      ctx.addIssue({
        code: "custom",
        message: "左眼有散光時要填軸度",
        path: ["left_axis"],
      });
    }
  });

export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
