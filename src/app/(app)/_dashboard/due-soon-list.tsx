import Link from "next/link";
import { formatDueDate } from "@/lib/due-date";

export type DueSoonCustomer = {
  id: string;
  full_name: string | null;
  dueDate: Date;
};

export function DueSoonList({ customers }: { customers: DueSoonCustomer[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-sm font-medium text-foreground">
        Due in the next 7 days
      </p>
      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No customers due this week.
        </p>
      ) : (
        <ul className="space-y-2">
          {customers.map((customer) => (
            <li key={customer.id} className="flex justify-between text-sm">
              <Link
                href={`/customers/${customer.id}`}
                className="text-foreground hover:underline"
              >
                {customer.full_name}
              </Link>
              <span className="font-mono text-muted-foreground">
                {formatDueDate(customer.dueDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
