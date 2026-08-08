import { createClient } from "@/lib/supabase/server";
import { getBusinessToday, getBusinessTodayISO } from "@/lib/due-date";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/message-template";
import { CalendarView, type CalendarPayment } from "./calendar-view";
import type { CustomerWithPlan } from "../customers/page";

type PaymentRow = {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
  status: "paid" | "due" | "overdue" | "partial";
};

export default async function CalendarPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: payments }, { data: settings }] =
    await Promise.all([
      supabase
        .from("customers")
        .select(
          "id, full_name, phone, address, plan_id, billing_day, status, start_date, plans(name, price)",
        )
        .is("deleted_at", null),
      supabase
        .from("payments")
        .select("id, customer_id, amount, due_date, status")
        .order("due_date", { ascending: true }),
      supabase
        .from("app_settings")
        .select("message_template")
        .eq("id", 1)
        .single(),
    ]);

  // Same embedded-relation caveat as every other page in this app: without
  // generated types, Supabase infers `plans` as an array for what's
  // actually a single object at runtime.
  const customersById = new Map(
    ((customers as unknown as CustomerWithPlan[]) ?? []).map((c) => [c.id, c]),
  );

  const calendarPayments: CalendarPayment[] = ((payments as PaymentRow[]) ?? []).map(
    (p) => ({
      ...p,
      customer: customersById.get(p.customer_id) ?? null,
    }),
  );

  const today = getBusinessToday();

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">Calendar</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Every customer&apos;s due date, at a glance.
      </p>
      <CalendarView
        payments={calendarPayments}
        todayISO={getBusinessTodayISO()}
        initialYear={today.year}
        initialMonth={today.month}
        messageTemplate={settings?.message_template ?? DEFAULT_MESSAGE_TEMPLATE}
      />
    </div>
  );
}
