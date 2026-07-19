"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { logActivity } from "@/lib/log-activity";
import { ensureCurrentCyclePayment, type PaymentRow } from "@/lib/payments";
import { recordPaymentSchema } from "@/lib/validations/payment";
import {
  getNextCycleDueDate,
  formatISODate,
  parseISODate,
  getBusinessToday,
} from "@/lib/due-date";

export type ActionState = {
  success: boolean;
  error: string | null;
};

function readOptional(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (raw === null) return null;
  const str = String(raw).trim();
  return str === "" ? null : str;
}

type PaymentWithCustomer = PaymentRow & {
  customers: {
    id: string;
    billing_day: number | null;
    plans: { price: number | null } | null;
  } | null;
};

export async function recordPayment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }

  const today = getBusinessToday();
  const todayISO = formatISODate(new Date(today.year, today.month, today.day));

  const parsed = recordPaymentSchema.safeParse({
    payment_id: formData.get("payment_id"),
    method: readOptional(formData, "method"),
    paid_date: readOptional(formData, "paid_date") ?? todayISO,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const supabase = await createClient();

    const { data: before, error: fetchError } = await supabase
      .from("payments")
      .select("*, customers(id, billing_day, plans(price))")
      .eq("id", parsed.data.payment_id)
      .single();

    if (fetchError || !before) {
      return { success: false, error: "Payment not found." };
    }

    const beforeRow = before as unknown as PaymentWithCustomer;

    const { data: after, error: updateError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_date: parsed.data.paid_date,
        method: parsed.data.method,
      })
      .eq("id", parsed.data.payment_id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create the next cycle's row, one billing period after the row just
    // paid (not "next due date from today" -- a payment recorded late
    // shouldn't skip a cycle).
    let nextCycleRow: PaymentRow | null = null;
    const customer = beforeRow.customers;

    if (customer?.billing_day) {
      const paidDueDate = parseISODate(beforeRow.due_date);
      const nextDue = getNextCycleDueDate(paidDueDate, customer.billing_day);

      const { data: created } = await supabase
        .from("payments")
        .insert({
          customer_id: customer.id,
          amount: customer.plans?.price ?? beforeRow.amount,
          due_date: formatISODate(nextDue),
          status: "due",
        })
        .select()
        .single();

      nextCycleRow = (created as PaymentRow) ?? null;
    }

    await logActivity({
      adminId: admin.id,
      action: "payment_recorded",
      entityType: "payment",
      entityId: parsed.data.payment_id,
      before: beforeRow,
      after: { ...after, next_cycle_created: nextCycleRow },
    });

    revalidatePath("/payments");
    if (customer?.id) {
      revalidatePath(`/customers/${customer.id}`);
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

type CustomerForGenerate = {
  id: string;
  billing_day: number | null;
  plans: { price: number | null } | null;
};

/**
 * Backfill for customers who don't yet have a payment row for their
 * current cycle -- existing customers from before this feature existed,
 * or a safety net if the automatic creation on Day 5's customer form
 * ever gets skipped. Safe to run repeatedly: ensureCurrentCyclePayment
 * is a no-op for any customer who already has a row for that due date.
 */
export async function generateMissingPayments(): Promise<
  ActionState & { created: number }
> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, error: "Not signed in.", created: 0 };
  }

  try {
    const supabase = await createClient();

    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, billing_day, plans(price)")
      .in("status", ["active", "overdue"])
      .is("deleted_at", null)
      .not("billing_day", "is", null)
      .not("plan_id", "is", null);

    if (error) {
      return { success: false, error: error.message, created: 0 };
    }

    let created = 0;

    for (const customer of (customers as unknown as CustomerForGenerate[]) ??
      []) {
      if (!customer.billing_day) continue;

      const row = await ensureCurrentCyclePayment(
        supabase,
        customer.id,
        customer.billing_day,
        customer.plans?.price ?? null,
      );

      if (row) {
        created++;
        await logActivity({
          adminId: admin.id,
          action: "created",
          entityType: "payment",
          entityId: row.id,
          before: null,
          after: row,
        });
      }
    }

    revalidatePath("/payments");
    return { success: true, error: null, created };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
      created: 0,
    };
  }
}
