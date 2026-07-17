import { cn } from "@/lib/utils";
import { formatPHP } from "@/lib/format";

const SAMPLE_ROWS = [
  { customer: "Maria Santos", amount: 999, status: "paid" as const },
  { customer: "Juan Dela Cruz", amount: 1499, status: "overdue" as const },
  { customer: "Ana Reyes", amount: 999, status: "due" as const },
];

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success",
  due: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  partial: "bg-muted text-muted-foreground",
};

export default function PaymentsPage() {
  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Payments
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ledger and history land Day 7 — this previews figures in the data
        typeface.
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Customer
              </th>
              <th className="border-b border-border px-4 py-2.5 text-right font-medium">
                Amount
              </th>
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row) => (
              <tr
                key={row.customer}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-foreground">{row.customer}</td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {formatPHP(row.amount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      STATUS_STYLES[row.status],
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
