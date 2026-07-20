import { createClient } from "@/lib/supabase/server";
import { getEffectivePaymentStatus } from "@/lib/effective-status";
import { PaymentsTable } from "./payments-table";

export type PaymentWithCustomer = {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "paid" | "due" | "overdue" | "partial";
  method: string | null;
  notes: string | null;
  customers: { full_name: string | null } | null;
};

export type PaymentRow = PaymentWithCustomer & {
  effectiveStatus: "paid" | "due" | "overdue" | "partial";
};

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, customer_id, amount, due_date, paid_date, status, method, notes, customers(full_name)",
    )
    .order("due_date", { ascending: true });

  // Same many-to-one embed inference gap as customers -> plans (Day 5):
  // Supabase's un-generated types guess `customers` is an array here too.
  const baseRows = (payments as unknown as PaymentWithCustomer[]) ?? [];

  // Nothing (not even the cron) ever writes payments.status from 'due' to
  // 'overdue' -- computed fresh on every load so the badge is never stale
  // between cron runs, without writing anything back to the DB.
  const rows: PaymentRow[] = baseRows.map((payment) => ({
    ...payment,
    effectiveStatus: getEffectivePaymentStatus(payment.status, payment.due_date),
  }));

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Payments
      </h1>
      <PaymentsTable payments={rows} />
    </div>
  );
}
