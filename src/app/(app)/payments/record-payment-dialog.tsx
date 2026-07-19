"use client";

import { useActionState, useEffect } from "react";
import { recordPayment, type ActionState } from "./actions";
import type { PaymentWithCustomer } from "./page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPHP } from "@/lib/format";
import { formatDueDate } from "@/lib/due-date";
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
            {formatPHP(payment.amount)}, due{" "}
            {formatDueDate(new Date(payment.due_date + "T00:00:00"))}. This
            also creates next cycle&apos;s payment row.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="payment_id" value={payment.id} />

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

          <div className="space-y-1.5">
            <Label htmlFor="method">Method (optional)</Label>
            <Input
              id="method"
              name="method"
              placeholder="Cash, GCash, bank transfer…"
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
