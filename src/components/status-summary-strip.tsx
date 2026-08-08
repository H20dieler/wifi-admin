"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_VARIANT,
  STATUS_ICON,
  VARIANT_TEXT_CLASS,
  type StatusKind,
} from "@/lib/status-display";

export function StatusSummaryStrip<T extends StatusKind>({
  statuses,
  counts,
  activeFilter,
  onSelect,
}: {
  /** Which statuses to show, in order, e.g. ["active", "overdue", "inactive"]. */
  statuses: readonly T[];
  counts: Record<T, number>;
  activeFilter: T | "all";
  onSelect: (status: T | "all") => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {statuses.map((status) => {
        const Icon: LucideIcon = STATUS_ICON[status];
        const selected = activeFilter === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(selected ? "all" : status)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              selected
                ? "border-foreground/20 bg-muted"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <Icon className={cn("size-3.5", VARIANT_TEXT_CLASS[STATUS_VARIANT[status]])} />
            <span className="font-mono font-semibold text-foreground">
              {counts[status] ?? 0}
            </span>
            <span className="text-muted-foreground capitalize">{status}</span>
          </button>
        );
      })}
    </div>
  );
}
