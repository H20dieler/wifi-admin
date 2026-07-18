"use client";

import { useActionState, useEffect } from "react";
import { savePlan, type ActionState } from "./actions";
import type { Plan } from "./page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const idleState: ActionState = { success: false, error: null };

export function PlanForm({
  plan,
  onSaved,
}: {
  plan?: Plan | null;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    savePlan,
    idleState,
  );

  useEffect(() => {
    if (state.success) {
      onSaved();
    }
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      {plan && <input type="hidden" name="id" value={plan.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={plan?.name ?? ""}
          placeholder="Basic 25"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="speed_mbps">Speed (Mbps)</Label>
          <Input
            id="speed_mbps"
            name="speed_mbps"
            type="number"
            min={1}
            defaultValue={plan?.speed_mbps ?? 25}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (₱)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={plan?.price ?? ""}
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
