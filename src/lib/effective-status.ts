import { getBusinessToday, parseISODate, type BusinessDate } from "@/lib/due-date";

export type PaymentStatus = "paid" | "due" | "overdue" | "partial";
export type CustomerStatus = "active" | "inactive" | "overdue";

function toDate(b: BusinessDate): Date {
  return new Date(b.year, b.month, b.day);
}

/**
 * A payment row still marked 'due' whose due_date has passed should
 * display as overdue immediately -- the cron never touches payments.status
 * at all (only customers.status), so nothing else will ever flip this.
 * Deliberately only transforms 'due' -> 'overdue'; 'paid'/'partial'/
 * already-'overdue' pass through untouched.
 */
export function getEffectivePaymentStatus(
  status: PaymentStatus | null,
  dueDate: string,
  today: BusinessDate = getBusinessToday(),
): PaymentStatus {
  if (status !== "due") {
    return status ?? "due";
  }
  return parseISODate(dueDate) < toDate(today) ? "overdue" : "due";
}

/**
 * Customer-level status needs more care than a pure billing_day-vs-today
 * comparison: customers.status is only ever written by the once-daily
 * cron, so a customer who paid *after* their due date but *before* today's
 * cron run would incorrectly show as overdue under a naive date check --
 * even though 'active' is already the correct answer for them. Deriving
 * from their most recent payment row's actual status avoids that false
 * positive, and as a side effect also self-corrects the opposite stale
 * case (marked overdue in the DB from a past cycle, paid since, never
 * flipped back -- nothing else fixes that either).
 */
export function getEffectiveCustomerStatus(
  storedStatus: CustomerStatus | null,
  mostRecentPayment: { status: PaymentStatus; due_date: string } | null,
  today: BusinessDate = getBusinessToday(),
): CustomerStatus {
  if (storedStatus === "inactive") {
    return "inactive";
  }

  if (!mostRecentPayment) {
    // No payment history to check against -- nothing to derive from, so
    // trust the stored value rather than guessing.
    return storedStatus ?? "active";
  }

  if (mostRecentPayment.status === "paid") {
    return "active";
  }

  const isPastDue = parseISODate(mostRecentPayment.due_date) < toDate(today);
  return isPastDue ? "overdue" : "active";
}
