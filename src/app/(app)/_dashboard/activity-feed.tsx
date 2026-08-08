import { Activity } from "lucide-react";

const ACTION_VERB: Record<string, string> = {
  created: "added",
  updated: "updated",
  deleted: "deleted",
  payment_recorded: "recorded a payment for",
  message_sent: "sent a reminder to",
};

const ENTITY_LABEL: Record<string, string> = {
  customer: "a customer",
  plan: "a plan",
  payment: "a payment",
  expense: "an expense",
  inventory_item: "an inventory item",
};

export type ActivityLogEntry = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  admin_profiles: { full_name: string | null } | null;
};

function describe(entry: ActivityLogEntry): string {
  const who = entry.admin_profiles?.full_name ?? "System";
  const verb = ACTION_VERB[entry.action] ?? entry.action;
  const what = ENTITY_LABEL[entry.entity_type] ?? entry.entity_type;
  return `${who} ${verb} ${what}`;
}

function timeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Activity className="size-4 text-muted-foreground" />
        Recent activity
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {entries.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-3 text-sm">
              <span className="text-foreground">{describe(entry)}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {timeAgo(entry.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
