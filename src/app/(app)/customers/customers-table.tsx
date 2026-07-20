"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Search, Settings2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { formatDueDate } from "@/lib/due-date";
import { CustomerForm } from "./customer-form";
import { MessageDialog } from "./message-dialog";
import { deleteCustomer } from "./actions";
import type { CustomerRow } from "./page";
import type { Plan } from "../plans/page";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "default"> = {
  active: "success",
  inactive: "default",
  overdue: "destructive",
};

type StatusFilter = "all" | "active" | "inactive" | "overdue";

export function CustomersTable({
  customers,
  plans,
  messageTemplate,
}: {
  customers: CustomerRow[];
  plans: Plan[];
  messageTemplate: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(
    null,
  );
  const [messagingCustomer, setMessagingCustomer] =
    useState<CustomerRow | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRow | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch =
        query === "" ||
        (customer.full_name ?? "").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || customer.effectiveStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  function openCreate() {
    setEditingCustomer(null);
    setDialogOpen(true);
  }

  function openEdit(customer: CustomerRow) {
    setEditingCustomer(customer);
    setDialogOpen(true);
  }

  function confirmDelete() {
    if (!deletingCustomer) return;
    startTransition(async () => {
      const result = await deleteCustomer(deletingCustomer.id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingCustomer(null);
      setDeleteError(null);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/plans">
              <Settings2 />
              Manage plans
            </Link>
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus />
            Add customer
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Name
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Plan
              </th>
              <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                Price
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Due date
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Status
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  {customers.length === 0
                    ? "No customers yet."
                    : "No customers match your search."}
                </td>
              </tr>
            )}
            {filtered.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-foreground">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="hover:underline"
                  >
                    {customer.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {customer.plans?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {customer.plans?.price != null
                    ? formatPHP(customer.plans.price)
                    : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {customer.dueDate ? formatDueDate(customer.dueDate) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[customer.effectiveStatus] ?? "default"}>
                    {customer.effectiveStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setMessagingCustomer(customer)}
                    >
                      <MessageSquare className="size-3.5" />
                      <span className="sr-only">Message</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openEdit(customer)}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeletingCustomer(customer);
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
            <DialogTitle>
              {editingCustomer ? "Edit customer" : "Add customer"}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editingCustomer}
            plans={plans}
            onSaved={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <MessageDialog
        customer={messagingCustomer}
        template={messageTemplate}
        open={!!messagingCustomer}
        onOpenChange={(open) => {
          if (!open) setMessagingCustomer(null);
        }}
      />

      <AlertDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCustomer(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletingCustomer?.full_name}?
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
