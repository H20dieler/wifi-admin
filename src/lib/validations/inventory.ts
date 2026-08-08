import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  quantity: z.coerce
    .number()
    .int("Must be a whole number")
    .min(0, "Can't be negative"),
  unit: z.string().trim().min(1, "Unit is required"),
  low_stock_threshold: z.coerce
    .number()
    .int("Must be a whole number")
    .min(0, "Can't be negative"),
  category: z.string().trim().nullable(),
  // Optional -- not every item needs a cost recorded. Blank input is
  // normalized to null by the caller (readOptional) before this schema
  // ever sees it, so `.nullable()` short-circuits past the number
  // coercion instead of trying to parse an empty string.
  unit_cost: z.coerce.number().positive("Must be greater than zero").nullable(),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
