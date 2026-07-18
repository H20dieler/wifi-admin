import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

type LogActivityParams = {
  adminId: string;
  action: "created" | "updated" | "deleted";
  entityType: string;
  entityId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

/**
 * Uses the service-role client deliberately: activity_logs is owner-only
 * under RLS (Day 2), but a staff member's actions need to be logged too,
 * not just the owner's. Writes here bypass that restriction on purpose.
 *
 * Best-effort: a logging failure doesn't roll back or fail the caller's
 * actual mutation, since customers/plans work should never be blocked by
 * an audit-trail hiccup. Failures are only logged server-side.
 */
export async function logActivity({
  adminId,
  action,
  entityType,
  entityId,
  before = null,
  after = null,
}: LogActivityParams) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("activity_logs").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: { before, after },
  });

  if (error) {
    console.error("logActivity failed:", entityType, action, error.message);
  }
}
