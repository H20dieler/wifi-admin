import { z } from "zod";

export const planSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  speed_mbps: z.coerce.number().int().positive("Must be a positive number"),
  price: z.coerce.number().nonnegative("Must be zero or more"),
});

export type PlanInput = z.infer<typeof planSchema>;
