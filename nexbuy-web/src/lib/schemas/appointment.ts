import { z } from "zod";

export const createAppointmentSchema = z.object({
  slot_id: z.uuid(),
  customer_name: z.string().trim().min(1).max(100),
  customer_email: z.email().toLowerCase(),
  customer_phone: z
    .string()
    .trim()
    .regex(/^0\d{8,9}$/, "台灣手機格式應為 09xxxxxxxx"),
  frame_product_id: z.uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
