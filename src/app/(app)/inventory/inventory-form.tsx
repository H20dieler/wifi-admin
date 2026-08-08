"use client";

import { useActionState, useEffect } from "react";
import { saveInventoryItem, type ActionState } from "./actions";
import type { InventoryItem } from "./page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";

const idleState: ActionState = { success: false, error: null };

export function InventoryForm({
  item,
  categories,
  onSaved,
}: {
  item?: InventoryItem | null;
  categories: string[];
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    saveInventoryItem,
    idleState,
  );

  useEffect(() => {
    if (state.success) {
      onSaved();
    }
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={item?.name ?? ""}
          placeholder="Ethernet cable, 305m"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category (optional)</Label>
        <Input
          id="category"
          name="category"
          list="inventory-categories"
          defaultValue={item?.category ?? ""}
          placeholder="Cables, Routers, Tools…"
        />
        <datalist id="inventory-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={0}
            step={1}
            defaultValue={item?.quantity ?? 0}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            name="unit"
            defaultValue={item?.unit ?? ""}
            placeholder="pcs, meters, boxes…"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="low_stock_threshold">Low-stock threshold</Label>
          <Input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            min={0}
            step={1}
            defaultValue={item?.low_stock_threshold ?? 5}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit_cost">Cost/unit (₱, optional)</Label>
          <Input
            id="unit_cost"
            name="unit_cost"
            type="number"
            min={0}
            step="0.01"
            defaultValue={item?.unit_cost ?? ""}
            placeholder="Optional"
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
