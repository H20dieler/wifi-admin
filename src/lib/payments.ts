import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getNextDueDate, formatISODate } from "@/lib/due-date";

export type PaymentRow = {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "paid" | "due" | "overdue" | "partial";
  method: string | null;
  notes: string | null;
};

/**
 * Creates a 'due' payment row for the customer's current billing cycle,
 * unless one already exists for that exact due date -- returns null in
 * that case rather than creating a duplicate. This is what makes it safe
 * to call both automatically (on customer creation) and repeatedly (the
 * manual backfill button) without ever double-booking a cycle.
 */
export async function ensureCurrentCyclePayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  customerId: string,
  billingDay: number,
  planPrice: number | null,
): Promise<PaymentRow | null> {
  const dueDate = formatISODate(getNextDueDate(billingDay));

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("customer_id", customerId)
    .eq("due_date", dueDate)
    .limit(1);

  if (existing && existing.length > 0) {
    return null;
  }

  const { data: created } = await supabase
    .from("payments")
    .insert({
      customer_id: customerId,
      amount: planPrice ?? 0,
      due_date: dueDate,
      status: "due",
    })
    .select()
    .single();

  return (created as PaymentRow) ?? null;
}
