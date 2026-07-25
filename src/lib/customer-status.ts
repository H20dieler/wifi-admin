import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getEffectiveCustomerStatus,
  type CustomerStatus,
  type PaymentStatus,
} from "@/lib/effective-status";

/**
 * Batch version of getEffectiveCustomerStatus -- one bulk payments query
 * for however many customers are passed in, rather than one query per
 * customer. Returns a Map so callers can look up by id.
 */
export async function computeEffectiveStatuses(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  customers: { id: string; status: CustomerStatus | null }[],
): Promise<Map<string, CustomerStatus>> {
  const result = new Map<string, CustomerStatus>();
  const ids = customers.map((c) => c.id);

  if (ids.length === 0) {
    return result;
  }

  const { data: recentPayments } = await supabase
    .from("payments")
    .select("customer_id, status, due_date")
    .in("customer_id", ids)
    .order("due_date", { ascending: false });

  const mostRecentByCustomer = new Map<
    string,
    { status: PaymentStatus; due_date: string }
  >();

  for (const payment of recentPayments ?? []) {
    // Already sorted by due_date desc, so the first row seen per
    // customer is their most recent -- skip any further ones.
    if (!mostRecentByCustomer.has(payment.customer_id)) {
      mostRecentByCustomer.set(payment.customer_id, {
        status: payment.status,
        due_date: payment.due_date,
      });
    }
  }

  for (const customer of customers) {
    result.set(
      customer.id,
      getEffectiveCustomerStatus(
        customer.status,
        mostRecentByCustomer.get(customer.id) ?? null,
      ),
    );
  }

  return result;
}
