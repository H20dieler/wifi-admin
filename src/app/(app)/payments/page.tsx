import { createClient } from "@/lib/supabase/server";
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
  const rows = (payments as unknown as PaymentWithCustomer[]) ?? [];

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Payments
      </h1>
      <PaymentsTable payments={rows} />
    </div>
  );
}
