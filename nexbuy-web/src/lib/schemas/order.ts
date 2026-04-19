import { z } from "zod";

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "購物車是空的")
    .max(20, "一次下單最多 20 種商品"),
  customer_name: z.string().trim().min(1).max(100),
  customer_phone: z
    .string()
    .trim()
    .regex(/^0\d{8,9}$/, "台灣手機格式應為 09xxxxxxxx"),
  shipping_address: z.string().trim().min(5).max(500),
  note: z.string().max(500).optional().nullable(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
