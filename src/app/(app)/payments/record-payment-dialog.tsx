"use client";

import { useActionState, useEffect, useState } from "react";
import { recordPayment, type ActionState } from "./actions";
import type { PaymentWithCustomer } from "./page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatPHP } from "@/lib/format";
import { formatDueDate } from "@/lib/due-date";
import { PAYMENT_METHODS } from "@/lib/validations/payment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const idleState: ActionState = { success: false, error: null };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: PaymentWithCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    recordPayment,
    idleState,
  );
  // Select doesn't submit via native FormData on its own, so its value is
  // mirrored into a hidden input below rather than relied on directly.
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Record payment — {payment.customers?.full_name}
          </DialogTitle>
          <DialogDescription>
            {formatPHP(payment.amount)} due{" "}
            {formatDueDate(new Date(payment.due_date + "T00:00:00"))}. Paying
            the full amount also creates next cycle&apos;s row; a partial
            amount leaves this cycle open.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="payment_id" value={payment.id} />
          <input type="hidden" name="method" value={method} />

          <div className="space-y-1.5">
            <Label htmlFor="amount_received">Amount received (₱)</Label>
            <Input
              id="amount_received"
              name="amount_received"
              type="number"
              min={0.01}
              step="0.01"
              defaultValue={payment.amount}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method-select">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paid_date">Paid date</Label>
            <Input
              id="paid_date"
              name="paid_date"
              type="date"
              defaultValue={todayISO()}
              required
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

