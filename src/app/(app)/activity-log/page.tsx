import { getCurrentAdmin } from "@/lib/get-current-admin";
import { ComingSoon } from "@/components/shell/coming-soon";
import { OwnerOnlyNotice } from "@/components/shell/owner-only-notice";

export default async function ActivityLogPage() {
  const admin = await getCurrentAdmin();

  if (admin?.role !== "owner") {
    return <OwnerOnlyNotice title="Activity log" />;
  }

  return <ComingSoon title="Activity log" day="Day 13" />;
}
