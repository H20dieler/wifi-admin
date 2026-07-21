import { z } from "zod";

export const expenseSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  description: z.string().trim().nullable(),
  amount: z.coerce.number().positive("Must be greater than zero"),
  expense_date: z.string().trim().min(1, "Date is required"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
