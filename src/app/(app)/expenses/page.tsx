import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { createClient } from "@/lib/supabase/server";
import { CapitalRecoveredBar } from "./capital-recovered-bar";
import { ExpensesTable } from "./expenses-table";

export type Expense = {
  id: string;
  category: string | null;
  description: string | null;
  amount: number;
  expense_date: string;
};

export default async function ExpensesPage() {
  const admin = await getCurrentAdmin();

  // A hidden nav link isn't real protection -- someone could still type
  // the URL directly. Redirect rather than show an in-page notice, per
  // the brief.
  if (admin?.role !== "owner") {
    redirect("/");
  }

  const supabase = await createClient();

  const [{ data: expenses }, { data: paidPayments }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, category, description, amount, expense_date")
      .is("deleted_at", null)
      .order("expense_date", { ascending: false }),
    supabase.from("payments").select("amount").eq("status", "paid"),
  ]);

  const expenseRows = (expenses as Expense[]) ?? [];

  const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = (paidPayments ?? []).reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        Expenses
      </h1>
      <CapitalRecoveredBar
        totalRevenue={totalRevenue}
        totalExpenses={totalExpenses}
      />
      <ExpensesTable expenses={expenseRows} />
    </div>
  );
}
