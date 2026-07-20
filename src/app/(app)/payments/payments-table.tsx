"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { RefreshCw, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatPHP } from "@/lib/format";
import { formatDueDate, parseISODate } from "@/lib/due-date";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { generateMissingPayments } from "./actions";
import type { PaymentRow } from "./page";

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "destructive" | "default"
> = {
  paid: "success",
  due: "default",
  overdue: "destructive",
  partial: "warning",
};

type StatusFilter = "all" | "paid" | "due" | "overdue" | "partial";

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [recordingPayment, setRecordingPayment] =
    useState<PaymentRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" || payment.effectiveStatus === statusFilter;
      const matchesFrom = !fromDate || payment.due_date >= fromDate;
      const matchesTo = !toDate || payment.due_date <= toDate;
      return matchesStatus && matchesFrom && matchesTo;
    });
  }, [payments, statusFilter, fromDate, toDate]);

  function handleGenerate() {
    setGenerateMessage(null);
    startTransition(async () => {
      const result = await generateMissingPayments();
      if (!result.success) {
        setGenerateMessage(result.error);
        return;
      }
      setGenerateMessage(
        result.created === 0
          ? "Everyone's up to date — nothing to generate."
          : `Created ${result.created} payment row${result.created === 1 ? "" : "s"}.`,
      );
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Due from
            </Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Due to</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isPending}
          >
            <RefreshCw className={isPending ? "animate-spin" : ""} />
            Generate missing payments
          </Button>
          {generateMessage && (
            <p className="text-xs text-muted-foreground">{generateMessage}</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Customer
              </th>
              <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                Amount
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Due date
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Paid date
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Status
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  {payments.length === 0
                    ? "No payment rows yet — try Generate missing payments above."
                    : "No payments match these filters."}
                </td>
              </tr>
            )}
            {filtered.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-foreground">
                  <Link
                    href={`/customers/${payment.customer_id}`}
                    className="hover:underline"
                  >
                    {payment.customers?.full_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {formatPHP(payment.amount)}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {formatDueDate(parseISODate(payment.due_date))}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {payment.paid_date
                    ? formatDueDate(parseISODate(payment.paid_date))
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={STATUS_VARIANT[payment.effectiveStatus] ?? "default"}
                  >
                    {payment.effectiveStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {payment.effectiveStatus !== "paid" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRecordingPayment(payment)}
                      >
                        <CircleCheck className="size-3.5" />
                        Record payment
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {payment.method ?? ""}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RecordPaymentDialog
        payment={recordingPayment}
        open={!!recordingPayment}
        onOpenChange={(open) => {
          if (!open) setRecordingPayment(null);
        }}
      />
    </div>
  );
}
