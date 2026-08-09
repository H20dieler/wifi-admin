import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { createClient } from "@/lib/supabase/server";
import { summarizeActivity } from "./summarize";
import { ActivityLogTable, type ActivityLogRow } from "./activity-log-table";

type RawLogRow = {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: { before: Record<string, unknown> | null; after: Record<string, unknown> | null } | null;
  created_at: string;
  admin_profiles: { full_name: string | null } | null;
};

export default async function ActivityLogPage() {
  const admin = await getCurrentAdmin();

  // Direct-URL protection, not just a hidden nav link -- same pattern as
  // Expenses. Deletion of these rows is already blocked at the database
  // level (Day 2's restrictive policy), so this page has no delete UI to
  // worry about matching that guarantee; it's read-only by construction.
  if (admin?.role !== "owner") {
    redirect("/");
  }

  const supabase = await createClient();

  const [{ data: logs }, { data: customers }, { data: admins }] =
    await Promise.all([
      supabase
        .from("activity_logs")
        .select(
          "id, admin_id, action, entity_type, entity_id, details, created_at, admin_profiles(full_name)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("customers").select("id, full_name"),
      supabase
        .from("admin_profiles")
        .select("id, full_name")
        .order("full_name"),
    ]);

  const customerNameById = new Map(
    ((customers ?? []) as { id: string; full_name: string | null }[]).map(
      (c) => [c.id, c.full_name ?? "Unnamed customer"],
    ),
  );

  const rows: ActivityLogRow[] = (
    (logs as unknown as RawLogRow[]) ?? []
  ).map((log) => ({
    id: log.id,
    adminName: log.admin_profiles?.full_name ?? "System",
    action: log.action,
    entityType: log.entity_type,
    summary: summarizeActivity(
      log.entity_type,
      log.action,
      log.details?.before ?? null,
      log.details?.after ?? null,
      customerNameById,
    ),
    createdAt: log.created_at,
  }));

  const adminOptions = [
    ...((admins ?? []) as { id: string; full_name: string | null }[]).map(
      (a) => a.full_name ?? "Unnamed admin",
    ),
    "System",
  ];

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Activity log
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Every change made in this app, newest first.
      </p>
      <ActivityLogTable rows={rows} adminOptions={adminOptions} />
    </div>
  );
}
