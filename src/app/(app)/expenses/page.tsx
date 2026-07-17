import { getCurrentAdmin } from "@/lib/get-current-admin";
import { ComingSoon } from "@/components/shell/coming-soon";
import { OwnerOnlyNotice } from "@/components/shell/owner-only-notice";

export default async function ExpensesPage() {
  const admin = await getCurrentAdmin();

  if (admin?.role !== "owner") {
    return <OwnerOnlyNotice title="Expenses" />;
  }

  return <ComingSoon title="Expenses" day="Day 8" />;
}
