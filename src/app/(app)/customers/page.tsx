import { cn } from "@/lib/utils";

const SAMPLE_ROWS = [
  { name: "Maria Santos", plan: "Basic 25", status: "active" as const },
  { name: "Juan Dela Cruz", plan: "Plus 50", status: "overdue" as const },
  { name: "Ana Reyes", plan: "Basic 25", status: "active" as const },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  inactive: "bg-muted text-muted-foreground",
};

export default function CustomersPage() {
  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Customers
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Full CRUD lands Day 5 — this previews the style against a real list.
      </p>
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
              <th className="border-b border-border px-4 py-2.5 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{row.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.plan}
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
