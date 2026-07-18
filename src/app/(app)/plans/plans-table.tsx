"use client";

import { useState, useTransition } from "react";
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
import { PlanForm } from "./plan-form";
import { deletePlan } from "./actions";
import type { Plan } from "./page";

export function PlansTable({ plans }: { plans: Plan[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingPlan(null);
    setDialogOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingPlan) return;
    startTransition(async () => {
      const result = await deletePlan(deletingPlan.id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingPlan(null);
      setDeleteError(null);
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Add plan
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Name
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Speed
              </th>
              <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                Price
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No plans yet.
                </td>
              </tr>
            )}
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{plan.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {plan.speed_mbps} Mbps
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {plan.price !== null ? formatPHP(plan.price) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeletingPlan(plan);
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit plan" : "Add plan"}</DialogTitle>
          </DialogHeader>
          <PlanForm plan={editingPlan} onSaved={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPlan(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingPlan?.name}?</AlertDialogTitle>
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
