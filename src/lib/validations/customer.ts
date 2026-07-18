import { z } from "zod";

export const customerSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().nullable(),
  address: z.string().trim().nullable(),
  plan_id: z.string().uuid().nullable(),
  billing_day: z.coerce.number().int().min(1, "1-31").max(31, "1-31"),
  status: z.enum(["active", "inactive", "overdue"]),
  start_date: z.string().trim().nullable(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
