"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { InventoryForm } from "./inventory-form";
import { deleteInventoryItem, adjustQuantity } from "./actions";
import type { InventoryItem } from "./page";

function isLowStock(item: InventoryItem): boolean {
  return item.quantity <= item.low_stock_threshold;
}

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [, startAdjustTransition] = useTransition();

  const knownCategories = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.category?.trim()).filter(Boolean)),
      ).sort() as string[],
    [items],
  );

  function openCreate() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingItem) return;
    startTransition(async () => {
      const result = await deleteInventoryItem(deletingItem.id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingItem(null);
      setDeleteError(null);
    });
  }

  function handleAdjust(item: InventoryItem, delta: 1 | -1) {
    if (delta === -1 && item.quantity <= 0) return;
    setAdjustingId(item.id);
    startAdjustTransition(async () => {
      await adjustQuantity(item.id, delta);
      setAdjustingId(null);
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Add item
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
                Category
              </th>
              <th className="border-b border-border px-4 py-2.5 text-center font-medium">
                Quantity
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Unit
              </th>
              <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                Cost/unit
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No inventory items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const low = isLowStock(item);
              return (
                <tr
                  key={item.id}
                  className={
                    low
                      ? "border-b border-border bg-warning/5 last:border-0"
                      : "border-b border-border last:border-0"
                  }
                >
                  <td className="px-4 py-3 text-foreground">
                    <div className="flex items-center gap-2">
                      {item.name}
                      {low && <Badge variant="warning">Low</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.category || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-6"
                        disabled={item.quantity <= 0}
                        onClick={() => handleAdjust(item, -1)}
                      >
                        <Minus className="size-3" />
                        <span className="sr-only">Decrease quantity</span>
                      </Button>
                      <span
                        className={`w-8 text-center font-mono ${adjustingId === item.id ? "opacity-50" : ""}`}
                      >
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-6"
                        onClick={() => handleAdjust(item, 1)}
                      >
                        <Plus className="size-3" />
                        <span className="sr-only">Increase quantity</span>
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {item.unit_cost !== null ? formatPHP(item.unit_cost) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeletingItem(item);
                          setDeleteError(null);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit item" : "Add item"}
            </DialogTitle>
          </DialogHeader>
          <InventoryForm
            item={editingItem}
            categories={knownCategories}
            onSaved={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingItem(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingItem?.name}?</AlertDialogTitle>
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
