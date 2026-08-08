"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageSquare, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPHP } from "@/lib/format";
import { lastDayOfMonth, formatISODate, formatDueDate, parseISODate } from "@/lib/due-date";
import { MessageDialog } from "../customers/message-dialog";
import type { CustomerRow, CustomerWithPlan } from "../customers/page";

export type CalendarPayment = {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
  status: "paid" | "due" | "overdue" | "partial";
  customer: CustomerWithPlan | null;
};

type CalendarBucket = "upcoming" | "due-today" | "overdue" | "paid";

// Not the same vocabulary as STATUS_VARIANT/STATUS_ICON (lib/status-display.ts)
// -- "due today" is a calendar-only concept with no equivalent elsewhere in
// the app, so this stays local rather than overloading the shared status
// system with something it wasn't built for.
function getCalendarBucket(
  status: CalendarPayment["status"],
  dueDateISO: string,
  todayISO: string,
): CalendarBucket {
  if (status === "paid") return "paid";
  if (dueDateISO === todayISO) return "due-today";
  if (dueDateISO < todayISO) return "overdue";
  return "upcoming";
}

const BUCKET_STYLE: Record<
  CalendarBucket,
  { dot: string; chip: string; label: string }
> = {
  upcoming: {
    dot: "bg-muted-foreground/50",
    chip: "text-foreground",
    label: "Upcoming",
  },
  "due-today": {
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary",
    label: "Due today",
  },
  overdue: {
    dot: "bg-destructive",
    chip: "bg-destructive/10 text-destructive",
    label: "Overdue",
  },
  paid: {
    dot: "bg-muted-foreground/30",
    chip: "text-muted-foreground",
    label: "Paid",
  },
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_CELL = 3;

function getMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = lastDayOfMonth(year, month);

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }
  return cells;
}

export function CalendarView({
  payments,
  todayISO,
  initialYear,
  initialMonth,
  messageTemplate,
}: {
  payments: CalendarPayment[];
  todayISO: string;
  initialYear: number;
  initialMonth: number;
  messageTemplate: string;
}) {
  const [viewedYear, setViewedYear] = useState(initialYear);
  const [viewedMonth, setViewedMonth] = useState(initialMonth);
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null);
  const [messagingCustomer, setMessagingCustomer] = useState<CustomerRow | null>(null);

  const paymentsByDay = useMemo(() => {
    const map = new Map<string, CalendarPayment[]>();
    for (const payment of payments) {
      const list = map.get(payment.due_date) ?? [];
      list.push(payment);
      map.set(payment.due_date, list);
    }
    return map;
  }, [payments]);

  const grid = useMemo(
    () => getMonthGrid(viewedYear, viewedMonth),
    [viewedYear, viewedMonth],
  );

  function goToMonth(delta: number) {
    const next = viewedMonth + delta;
    setViewedYear(viewedYear + Math.floor(next / 12));
    setViewedMonth(((next % 12) + 12) % 12);
  }

  function openMessage(customer: CustomerWithPlan, dueDateISO: string) {
    setSelectedDayISO(null);
    setMessagingCustomer({
      ...customer,
      dueDate: parseISODate(dueDateISO),
      effectiveStatus: customer.status ?? "active",
    });
  }

  const selectedDayPayments = selectedDayISO
    ? (paymentsByDay.get(selectedDayISO) ?? [])
    : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <Button variant="outline" size="icon" onClick={() => goToMonth(-1)}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <p className="text-sm font-medium text-foreground">
          {new Date(viewedYear, viewedMonth, 1).toLocaleDateString("en-PH", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <Button variant="outline" size="icon" onClick={() => goToMonth(1)}>
          <ChevronRight className="size-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-2 px-0.5">
        {WEEKDAY_LABELS.map((label) => (
          <p
            key={label}
            className="text-center text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            {label}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {grid.map(({ date, inMonth }) => {
          const iso = formatISODate(date);
          const dayPayments = paymentsByDay.get(iso) ?? [];
          const isToday = iso === todayISO;
          const visible = dayPayments.slice(0, MAX_VISIBLE_PER_CELL);
          const overflowCount = dayPayments.length - visible.length;

          return (
            <div
              key={iso}
              role={dayPayments.length > 0 ? "button" : undefined}
              tabIndex={dayPayments.length > 0 ? 0 : undefined}
              onClick={() => dayPayments.length > 0 && setSelectedDayISO(iso)}
              onKeyDown={(e) => {
                if (dayPayments.length > 0 && (e.key === "Enter" || e.key === " ")) {
                  setSelectedDayISO(iso);
                }
              }}
              className={cn(
                "min-h-24 rounded-lg border p-1.5 transition-colors",
                inMonth ? "border-border bg-card" : "border-border/50 bg-muted/20",
                dayPayments.length > 0 && "cursor-pointer hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-xs",
                  !inMonth && "text-muted-foreground/50",
                  inMonth && !isToday && "text-foreground",
                  isToday && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {date.getDate()}
              </span>

              <div className="mt-1 space-y-1">
                {visible.map((payment) => {
                  const bucket = getCalendarBucket(payment.status, payment.due_date, todayISO);
                  return (
                    <div
                      key={payment.id}
                      className={cn(
                        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px]",
                        BUCKET_STYLE[bucket].chip,
                      )}
                    >
                      <span className={cn("size-1.5 shrink-0 rounded-full", BUCKET_STYLE[bucket].dot)} />
                      <span className="truncate">
                        {payment.customer?.full_name ?? "Unknown"}
                      </span>
                    </div>
                  );
                })}
                {overflowCount > 0 && (
                  <p className="px-1 text-[11px] text-muted-foreground">
                    +{overflowCount} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(BUCKET_STYLE) as CalendarBucket[]).map((bucket) => (
          <span key={bucket} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", BUCKET_STYLE[bucket].dot)} />
            {BUCKET_STYLE[bucket].label}
          </span>
        ))}
      </div>

      <Dialog
        open={!!selectedDayISO}
        onOpenChange={(open) => !open && setSelectedDayISO(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDayISO && formatDueDate(parseISODate(selectedDayISO))}
            </DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {selectedDayPayments.map((payment) => {
              const bucket = getCalendarBucket(payment.status, payment.due_date, todayISO);
              return (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 shrink-0 rounded-full", BUCKET_STYLE[bucket].dot)} />
                      <p className="truncate text-sm font-medium text-foreground">
                        {payment.customer?.full_name ?? "Unknown"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPHP(payment.amount)} · {BUCKET_STYLE[bucket].label}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {payment.customer && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openMessage(payment.customer as CustomerWithPlan, payment.due_date)}
                      >
                        <MessageSquare className="size-4" />
                        <span className="sr-only">Message</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-8" asChild>
                      <Link href={`/customers/${payment.customer_id}`}>
                        <ArrowUpRight className="size-4" />
                        <span className="sr-only">View customer</span>
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      <MessageDialog
        customer={messagingCustomer}
        template={messageTemplate}
        open={!!messagingCustomer}
        onOpenChange={(open) => !open && setMessagingCustomer(null)}
      />
    </div>
  );
}
