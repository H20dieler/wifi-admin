import { z } from "zod";

export const PAYMENT_METHODS = ["Cash", "GCash", "Bank transfer"] as const;

export const recordPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  method: z.enum(PAYMENT_METHODS),
  paid_date: z.string().trim().min(1, "Paid date is required"),
  // Compared server-side against the row's own `amount` to decide
  // paid vs. partial -- see recordPayment() in payments/actions.ts.
  amount_received: z.coerce
    .number()
    .positive("Enter an amount greater than zero"),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
