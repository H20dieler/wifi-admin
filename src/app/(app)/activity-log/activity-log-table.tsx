"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CircleDollarSign,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatDateTime, toBusinessDateISO } from "@/lib/due-date";

export type ActivityLogRow = {
  id: string;
  adminName: string;
  action: string;
  entityType: string;
  summary: string;
  createdAt: string;
};

const ACTION_LABEL: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  payment_recorded: "Payment recorded",
  message_sent: "Message sent",
};

const ACTION_VARIANT: Record<
  string,
  "success" | "warning" | "destructive" | "default"
> = {
  created: "success",
  updated: "default",
  deleted: "destructive",
  payment_recorded: "success",
  message_sent: "default",
};

const ACTION_ICON: Record<string, LucideIcon> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  payment_recorded: CircleDollarSign,
  message_sent: MessageSquare,
};

const ENTITY_LABEL: Record<string, string> = {
  customer: "Customer",
  plan: "Plan",
  payment: "Payment",
  expense: "Expense",
  inventory_item: "Inventory item",
  customer_document: "Document",
};

export function ActivityLogTable({
  rows,
  adminOptions,
}: {
  rows: ActivityLogRow[];
  adminOptions: string[];
}) {
  const [adminFilter, setAdminFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesAdmin = adminFilter === "all" || row.adminName === adminFilter;
      const rowDateISO = toBusinessDateISO(new Date(row.createdAt));
      const matchesFrom = !fromDate || rowDateISO >= fromDate;
      const matchesTo = !toDate || rowDateISO <= toDate;
      return matchesAdmin && matchesFrom && matchesTo;
    });
  }, [rows, adminFilter, fromDate, toDate]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Admin</Label>
          <Select value={adminFilter} onValueChange={setAdminFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All admins</SelectItem>
              {adminOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-40"
          />
        </div>
        <p className="pb-2 text-xs text-muted-foreground">
          {filtered.length} of {rows.length} entries
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border px-4 py-2.5 font-medium">Admin</th>
              <th className="border-b border-border px-4 py-2.5 font-medium">Action</th>
              <th className="border-b border-border px-4 py-2.5 font-medium">Entity</th>
              <th className="border-b border-border px-4 py-2.5 font-medium">Summary</th>
              <th className="border-b border-border px-4 py-2.5 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No activity matches these filters.
                </td>
              </tr>
            )}
            {filtered.map((row) => {
              const Icon = ACTION_ICON[row.action];
              return (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">
                    {row.adminName === "System" ? (
                      <span className="italic text-muted-foreground">System</span>
                    ) : (
                      row.adminName
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_VARIANT[row.action] ?? "default"}>
                      {Icon && <Icon className="size-3" />}
                      {ACTION_LABEL[row.action] ?? row.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ENTITY_LABEL[row.entityType] ?? row.entityType}
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.summary}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {formatDateTime(new Date(row.createdAt))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
