import { createClient } from "@/lib/supabase/server";
import { getNextDueDate } from "@/lib/due-date";
import { CustomersTable } from "./customers-table";
import type { Plan } from "../plans/page";

export type CustomerWithPlan = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  plan_id: string | null;
  billing_day: number | null;
  status: "active" | "inactive" | "overdue" | null;
  start_date: string | null;
  plans: { name: string | null; price: number | null } | null;
};

export type CustomerRow = CustomerWithPlan & { dueDate: Date | null };

export default async function CustomersPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: plans }] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, full_name, phone, address, plan_id, billing_day, status, start_date, plans(name, price)",
      )
      .is("deleted_at", null)
      .order("full_name", { ascending: true }),
    supabase
      .from("plans")
      .select("id, name, speed_mbps, price")
      .order("price", { ascending: true }),
  ]);

  // Supabase's client can't know plan_id -> plans is many-to-one without
  // generated types, so it infers `plans` as an array. It's a single object
  // at runtime (standard PostgREST behavior for a foreign-key embed) --
  // this goes away once `supabase gen types` is wired up for this project.
  const rows: CustomerRow[] = (
    (customers as unknown as CustomerWithPlan[]) ?? []
  ).map((customer) => ({
    ...customer,
    dueDate: customer.billing_day
      ? getNextDueDate(customer.billing_day)
      : null,
  }));

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Customers
      </h1>
      <CustomersTable customers={rows} plans={(plans as Plan[]) ?? []} />
    </div>
  );
}
