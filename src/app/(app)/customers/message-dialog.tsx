"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { fillTemplate } from "@/lib/message-template";
import { formatPHP } from "@/lib/format";
import { formatDueDate } from "@/lib/due-date";
import type { CustomerRow } from "./page";

export function MessageDialog({
  customer,
  template,
  open,
  onOpenChange,
}: {
  customer: CustomerRow | null;
  template: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (!customer) return null;

  const message = fillTemplate(template, {
    name: customer.full_name ?? "there",
    amount:
      customer.plans?.price != null
        ? formatPHP(customer.plans.price)
        : "your bill",
    due_date: customer.dueDate
      ? formatDueDate(customer.dueDate)
      : "your due date",
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setCopied(false);
          setCopyError(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {customer.full_name}</DialogTitle>
        </DialogHeader>
        <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">
          {message}
        </p>
        {copyError && (
          <p className="text-sm text-destructive" role="alert">
            Couldn&apos;t copy automatically — select the text above and copy
            it manually.
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
