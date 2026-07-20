import { createClient } from "@/lib/supabase/server";
import { getNextDueDate } from "@/lib/due-date";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/message-template";
import { getEffectiveCustomerStatus, type PaymentStatus } from "@/lib/effective-status";
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

export type CustomerRow = CustomerWithPlan & {
  dueDate: Date | null;
  effectiveStatus: "active" | "inactive" | "overdue";
};

export default async function CustomersPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: plans }, { data: settings }] =
    await Promise.all([
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
      supabase
        .from("app_settings")
        .select("message_template")
        .eq("id", 1)
        .single(),
    ]);

  // Supabase's client can't know plan_id -> plans is many-to-one without
  // generated types, so it infers `plans` as an array. It's a single object
  // at runtime (standard PostgREST behavior for a foreign-key embed) --
  // this goes away once `supabase gen types` is wired up for this project.
  const baseCustomers = (customers as unknown as CustomerWithPlan[]) ?? [];

  // customers.status is only ever written by the once-daily cron, so it
  // can be stale in both directions (see lib/effective-status.ts). Needs
  // each customer's most recent payment to correct for that -- fetched in
  // one bulk query rather than per-customer to avoid N+1.
  const customerIds = baseCustomers.map((c) => c.id);
  const mostRecentByCustomer = new Map<
    string,
    { status: PaymentStatus; due_date: string }
  >();

  if (customerIds.length > 0) {
    const { data: recentPayments } = await supabase
      .from("payments")
      .select("customer_id, status, due_date")
      .in("customer_id", customerIds)
      .order("due_date", { ascending: false });

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
  }

  const rows: CustomerRow[] = baseCustomers.map((customer) => ({
    ...customer,
    dueDate: customer.billing_day
      ? getNextDueDate(customer.billing_day)
      : null,
    effectiveStatus: getEffectiveCustomerStatus(
      customer.status,
      mostRecentByCustomer.get(customer.id) ?? null,
    ),
  }));

  // Settings/Day 14 hasn't built the form to edit this yet, so a fresh
  // install has message_template = null. Falling back here means the
  // Message button works out of the box instead of showing "undefined".
  const messageTemplate = settings?.message_template ?? DEFAULT_MESSAGE_TEMPLATE;

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Customers
      </h1>
      <CustomersTable
        customers={rows}
        plans={(plans as Plan[]) ?? []}
        messageTemplate={messageTemplate}
      />
    </div>
  );
}
