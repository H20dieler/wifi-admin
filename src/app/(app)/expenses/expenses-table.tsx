"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { formatPHP } from "@/lib/format";
import { formatDueDate, parseISODate } from "@/lib/due-date";
import { ExpenseForm } from "./expense-form";
import { deleteExpense } from "./actions";
import type { Expense } from "./page";

const UNCATEGORIZED = "Uncategorized";

function groupByCategory(expenses: Expense[]) {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = expense.category?.trim() || UNCATEGORIZED;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(expense);
  }

  for (const items of groups.values()) {
    items.sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  }

  const categories = Array.from(groups.keys()).sort((a, b) => {
    if (a === UNCATEGORIZED) return 1;
    if (b === UNCATEGORIZED) return -1;
    return a.localeCompare(b);
  });

  return categories.map((category) => ({
    category,
    items: groups.get(category)!,
    subtotal: groups.get(category)!.reduce((sum, e) => sum + e.amount, 0),
  }));
}

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => groupByCategory(expenses), [expenses]);
  const knownCategories = useMemo(
    () =>
      Array.from(
        new Set(expenses.map((e) => e.category?.trim()).filter(Boolean)),
      ).sort() as string[],
    [expenses],
  );

  function openCreate() {
    setEditingExpense(null);
    setDialogOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingExpense) return;
    startTransition(async () => {
      const result = await deleteExpense(deletingExpense.id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingExpense(null);
      setDeleteError(null);
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Add expense
        </Button>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No expenses yet.
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(({ category, items, subtotal }) => (
          <div key={category}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {category}
              </h3>
              <span className="font-mono text-sm text-muted-foreground">
                {formatPHP(subtotal)}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <tbody>
                  {items.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {formatDueDate(parseISODate(expense.expense_date))}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {expense.description || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {formatPHP(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => openEdit(expense)}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingExpense(expense);
                              setDeleteError(null);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit expense" : "Add expense"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            categories={knownCategories}
            onSaved={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingExpense(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {deletingExpense?.category || "expense"} entry?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone.
              {deleteError && (
                <span className="mt-2 block text-destructive">
                  {deleteError}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
