import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { createClient } from "@/lib/supabase/server";
import {
  getBusinessToday,
  getNextDueDate,
  formatISODate,
  parseISODate,
  lastDayOfMonth,
} from "@/lib/due-date";
import { computeEffectiveStatuses } from "@/lib/customer-status";
import { formatPHP } from "@/lib/format";
import { StatCard } from "./_dashboard/stat-card";
import { CapitalRecoveredBar } from "./expenses/capital-recovered-bar";
import {
  LowStockWarning,
  type LowStockItem,
} from "./_dashboard/low-stock-warning";
import { DueSoonList, type DueSoonCustomer } from "./_dashboard/due-soon-list";
import {
  ActivityFeed,
  type ActivityLogEntry,
} from "./_dashboard/activity-feed";
import { RevenueChart, type MonthlyRevenue } from "./_dashboard/revenue-chart";
import {
  ExpenseBreakdownChart,
  type CategoryExpense,
} from "./_dashboard/expense-breakdown-chart";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function HomePage() {
  const admin = await getCurrentAdmin();

  // Middleware already handles this in practice -- fallback for a valid
  // session with no matching admin_profiles row, same pattern as the
  // shell layout.
  if (!admin) {
    redirect("/login");
  }

  const isOwner = admin.role === "owner";
  const supabase = await createClient();
  const today = getBusinessToday();
  const todayDate = new Date(today.year, today.month, today.day);

  const startOfMonth = formatISODate(new Date(today.year, today.month, 1));
  const endOfMonth = formatISODate(
    new Date(today.year, today.month, lastDayOfMonth(today.year, today.month)),
  );

  const [
    { data: customers },
    { data: thisMonthPayments },
    { data: allPaidPayments },
    { data: inventoryItems },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, billing_day, status")
      .is("deleted_at", null),
    supabase
      .from("payments")
      .select("amount, status")
      .gte("due_date", startOfMonth)
      .lte("due_date", endOfMonth),
    supabase.from("payments").select("amount, paid_date").eq("status", "paid"),
    supabase
      .from("inventory_items")
      .select("id, name, quantity, low_stock_threshold"),
  ]);

  const baseCustomers = customers ?? [];

  // --- Active customer count (effective status, not raw stored status --
  // consistent with the Customers page, so the two numbers never disagree) ---
  const effectiveStatuses = await computeEffectiveStatuses(
    supabase,
    baseCustomers,
  );
  const activeCount = baseCustomers.filter(
    (c) => (effectiveStatuses.get(c.id) ?? c.status) === "active",
  ).length;

  // --- This month: collected vs expected ---
  const monthRows = thisMonthPayments ?? [];
  const expectedThisMonth = monthRows.reduce((sum, p) => sum + p.amount, 0);
  const collectedThisMonth = monthRows
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  // --- Customers due in the next 7 days ---
  const in7Days = new Date(todayDate);
  in7Days.setDate(in7Days.getDate() + 7);

  const dueSoon: DueSoonCustomer[] = baseCustomers
    .filter((c) => c.status !== "inactive" && c.billing_day)
    .map((c) => ({
      id: c.id,
      full_name: c.full_name,
      dueDate: getNextDueDate(c.billing_day as number),
    }))
    .filter((c) => c.dueDate >= todayDate && c.dueDate <= in7Days)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // --- Low stock ---
  const lowStockItems: LowStockItem[] = (inventoryItems ?? []).filter(
    (item) =>
      item.quantity != null &&
      item.low_stock_threshold != null &&
      item.quantity <= item.low_stock_threshold,
  );

  // --- Revenue over the last 6 months (bucketed from all paid payments) ---
  const monthBuckets: { key: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = today.month - i;
    const year = today.year + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    monthBuckets.push({ key: `${year}-${month}`, label: MONTH_LABELS[month], amount: 0 });
  }
  for (const payment of allPaidPayments ?? []) {
    if (!payment.paid_date) continue;
    const paidDate = parseISODate(payment.paid_date);
    const key = `${paidDate.getFullYear()}-${paidDate.getMonth()}`;
    const bucket = monthBuckets.find((b) => b.key === key);
    if (bucket) bucket.amount += payment.amount;
  }
  const revenueData: MonthlyRevenue[] = monthBuckets.map((b) => ({
    month: b.label,
    amount: b.amount,
  }));

  const totalRevenue = (allPaidPayments ?? []).reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  // --- Owner-only data: fetched only for owners, not just hidden in the UI ---
  let totalExpenses = 0;
  let expenseBreakdown: CategoryExpense[] = [];
  let activityEntries: ActivityLogEntry[] = [];

  if (isOwner) {
    const [{ data: expenses }, { data: activity }] = await Promise.all([
      supabase.from("expenses").select("category, amount").is("deleted_at", null),
      supabase
        .from("activity_logs")
        .select("id, action, entity_type, created_at, admin_profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals = new Map<string, number>();
    for (const expense of expenses ?? []) {
      const key = expense.category?.trim() || "Uncategorized";
      categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + expense.amount);
    }
    expenseBreakdown = Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Same many-to-one embed inference gap noted elsewhere in this app --
    // admin_profiles comes back typed as an array without generated types.
    activityEntries = (activity as unknown as ActivityLogEntry[]) ?? [];
  }

  return (
    <div className="space-y-4">
      <h1 className="mb-2 text-lg font-semibold text-foreground">Home</h1>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Active customers" value={String(activeCount)} />
        <StatCard
          label="This month"
          value={formatPHP(collectedThisMonth)}
          footnote={`of ${formatPHP(expectedThisMonth)} expected`}
        />
      </div>

      {isOwner && (
        <CapitalRecoveredBar
          totalRevenue={totalRevenue}
          totalExpenses={totalExpenses}
        />
      )}

      <LowStockWarning items={lowStockItems} />

      <div className={isOwner ? "grid grid-cols-2 gap-4" : ""}>
        <DueSoonList customers={dueSoon} />
        {isOwner && <ActivityFeed entries={activityEntries} />}
      </div>

      <div className={isOwner ? "grid grid-cols-2 gap-4" : ""}>
        <RevenueChart data={revenueData} />
        {isOwner && <ExpenseBreakdownChart data={expenseBreakdown} />}
      </div>
    </div>
  );
}
