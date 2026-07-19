import { z } from "zod";

export const recordPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  method: z.string().trim().nullable(),
  paid_date: z.string().trim().min(1, "Paid date is required"),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
