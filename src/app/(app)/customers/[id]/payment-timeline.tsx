"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/format";
import { formatDueDate, parseISODate } from "@/lib/due-date";
import { RecordPaymentDialog } from "../../payments/record-payment-dialog";
import type { PaymentWithCustomer } from "../../payments/page";

const DOT_COLOR: Record<string, string> = {
  paid: "bg-success",
  due: "bg-muted-foreground",
  overdue: "bg-destructive",
  partial: "bg-warning",
};

export function PaymentTimeline({
  payments,
}: {
  payments: PaymentWithCustomer[];
}) {
  const [recordingPayment, setRecordingPayment] =
    useState<PaymentWithCustomer | null>(null);

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payment history yet.
      </p>
    );
  }

  return (
    <div>
      <ol className="relative space-y-5 border-l border-border pl-5">
        {payments.map((payment) => (
          <li key={payment.id} className="relative">
            <span
              className={`absolute -left-[1.4rem] top-1 size-2.5 rounded-full ${DOT_COLOR[payment.status] ?? "bg-muted-foreground"}`}
            />
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-3.5">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatDueDate(parseISODate(payment.due_date))}
                  <span className="ml-2 font-mono text-sm text-muted-foreground">
                    {formatPHP(payment.amount)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {payment.status === "paid"
                    ? `Paid ${payment.paid_date ? formatDueDate(parseISODate(payment.paid_date)) : ""}${payment.method ? ` via ${payment.method}` : ""}`
                    : `Status: ${payment.status}`}
                </p>
              </div>
              {payment.status !== "paid" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecordingPayment(payment)}
                >
                  <CircleCheck className="size-3.5" />
                  Record
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>

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
