import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSms } from "@/lib/sms";
import {
  classifyReminder,
  getMostRecentDueDate,
  getDaysSinceDue,
  formatDueDate,
  formatISODate,
  type ReminderCase,
} from "@/lib/due-date";
import { DEFAULT_MESSAGE_TEMPLATE, fillTemplate } from "@/lib/message-template";
import { formatPHP } from "@/lib/format";
import { logActivity } from "@/lib/log-activity";

// Cron routes do real work and read request.headers -- make sure Next
// never tries to statically evaluate this at build time.
export const dynamic = "force-dynamic";

type CustomerForCron = {
  id: string;
  full_name: string | null;
  phone: string | null;
  billing_day: number | null;
  status: "active" | "inactive" | "overdue" | null;
  plans: { price: number | null } | null;
};

function casePrefix(reminderCase: ReminderCase): string {
  switch (reminderCase.type) {
    case "upcoming":
      return `Reminder (due in ${reminderCase.daysUntilDue} days): `;
    case "due_today":
      return "Due today: ";
    case "overdue":
      return `OVERDUE (${reminderCase.daysOverdue} days): `;
  }
}

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

    const { data: settings } = await supabase
      .from("app_settings")
      .select("message_template, reminder_days_before")
      .eq("id", 1)
      .single();

    const template = settings?.message_template ?? DEFAULT_MESSAGE_TEMPLATE;
    const reminderDaysBefore = settings?.reminder_days_before ?? 3;

    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, full_name, phone, billing_day, status, plans(price)")
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
      remindersSent: 0,
      remindersFailed: 0,
      statusFlipped: 0,
    };

    for (const customer of (customers as unknown as CustomerForCron[]) ?? []) {
      if (!customer.billing_day) continue;
      summary.customersChecked++;

      // ---- Reminder SMS ----
      const reminderCase = classifyReminder(
        customer.billing_day,
        reminderDaysBefore,
      );

      if (reminderCase && customer.phone) {
        const amount =
          customer.plans?.price != null
            ? formatPHP(customer.plans.price)
            : "your bill";

        const body = fillTemplate(template, {
          name: customer.full_name ?? "there",
          amount,
          due_date: formatDueDate(reminderCase.dueDate),
        });
        const message = casePrefix(reminderCase) + body;

        const result = await sendSms(customer.phone, message);

        if (result.success) {
          summary.remindersSent++;
        } else {
          summary.remindersFailed++;
        }

        // Log the attempt either way -- a failed send is still something
        // worth being able to see in the audit trail later.
        await logActivity({
          adminId: null, // no admin session in a cron -- null means "system"
          action: "message_sent",
          entityType: "customer",
          entityId: customer.id,
          before: null,
          after: {
            phone: customer.phone,
            message,
            case: reminderCase.type,
            sms_success: result.success,
            sms_error: result.success ? null : result.error,
          },
        });
      }

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
