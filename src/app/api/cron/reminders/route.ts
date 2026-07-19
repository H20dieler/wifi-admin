import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getMostRecentDueDate, getDaysSinceDue, formatISODate } from "@/lib/due-date";
import { logActivity } from "@/lib/log-activity";

// Cron routes do real work and read request.headers -- make sure Next
// never tries to statically evaluate this at build time.
export const dynamic = "force-dynamic";

type CustomerForCron = {
  id: string;
  billing_day: number | null;
  status: "active" | "inactive" | "overdue" | null;
};

async function hasPaidForCycle(
  supabase: ReturnType<typeof createServiceClient>,
  customerId: string,
  cycleDueDate: Date,
): Promise<boolean> {
  const { data } = await supabase
    .from("payments")
    .select("id")
    .eq("customer_id", customerId)
    .eq("status", "paid")
    .gte("due_date", formatISODate(cycleDueDate))
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cron has no logged-in admin/session, so every table here needs the
    // service-role client regardless of what its RLS policy would allow --
    // there's no `authenticated` role to be in.
    const supabase = createServiceClient();

    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, billing_day, status")
      .in("status", ["active", "overdue"])
      .is("deleted_at", null)
      .not("billing_day", "is", null);

    if (customersError) {
      return NextResponse.json(
        { error: `Failed to load customers: ${customersError.message}` },
        { status: 500 },
      );
    }

    const summary = {
      customersChecked: 0,
      statusFlipped: 0,
    };

    for (const customer of (customers as unknown as CustomerForCron[]) ?? []) {
      if (!customer.billing_day) continue;
      summary.customersChecked++;

      // ---- Overdue status flip ----
      // Only touches customers still marked 'active' -- already-overdue
      // ones are a no-op, and 'inactive' customers are left alone.
      if (customer.status === "active") {
        const daysSince = getDaysSinceDue(customer.billing_day);
        if (daysSince >= 1) {
          const cycleDue = getMostRecentDueDate(customer.billing_day);
          const paid = await hasPaidForCycle(supabase, customer.id, cycleDue);

          if (!paid) {
            const { error: updateError } = await supabase
              .from("customers")
              .update({ status: "overdue" })
              .eq("id", customer.id);

            if (!updateError) {
              summary.statusFlipped++;
              await logActivity({
                adminId: null,
                action: "updated",
                entityType: "customer",
                entityId: customer.id,
                before: { status: "active" },
                after: { status: "overdue" },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron run failed." },
      { status: 500 },
    );
  }
}
