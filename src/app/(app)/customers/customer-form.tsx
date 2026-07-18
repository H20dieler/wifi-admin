"use client";

import { useActionState, useEffect } from "react";
import { saveCustomer, type ActionState } from "./actions";
import type { CustomerRow } from "./page";
import type { Plan } from "../plans/page";
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
import { DialogFooter, DialogClose } from "@/components/ui/dialog";

const idleState: ActionState = { success: false, error: null };

export function CustomerForm({
  customer,
  plans,
  onSaved,
}: {
  customer?: CustomerRow | null;
  plans: Plan[];
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    saveCustomer,
    idleState,
  );

  useEffect(() => {
    if (state.success) {
      onSaved();
    }
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      {customer && <input type="hidden" name="id" value={customer.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={customer?.full_name ?? ""}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={customer?.phone ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={customer?.start_date ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          defaultValue={customer?.address ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="plan_id">Plan</Label>
          <Select name="plan_id" defaultValue={customer?.plan_id ?? "none"}>
            <SelectTrigger id="plan_id">
              <SelectValue placeholder="No plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No plan</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="billing_day">Billing day</Label>
          <Input
            id="billing_day"
            name="billing_day"
            type="number"
            min={1}
            max={31}
            defaultValue={customer?.billing_day ?? 1}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={customer?.status ?? "active"}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
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
