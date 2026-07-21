"use client";

import { useActionState, useEffect } from "react";
import { saveExpense, type ActionState } from "./actions";
import type { Expense } from "./page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";

const idleState: ActionState = { success: false, error: null };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  expense,
  categories,
  onSaved,
}: {
  expense?: Expense | null;
  categories: string[];
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    saveExpense,
    idleState,
  );

  useEffect(() => {
    if (state.success) {
      onSaved();
    }
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      {expense && <input type="hidden" name="id" value={expense.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          list="expense-categories"
          defaultValue={expense?.category ?? ""}
          placeholder="Fuel, Tools, Rent…"
          required
        />
        <datalist id="expense-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          name="description"
          defaultValue={expense?.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₱)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={expense?.amount ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expense_date">Date</Label>
          <Input
            id="expense_date"
            name="expense_date"
            type="date"
            defaultValue={expense?.expense_date ?? todayISO()}
            required
          />
        </div>
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
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
