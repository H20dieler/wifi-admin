import { formatPHP } from "@/lib/format";

export function CapitalRecoveredBar({
  totalRevenue,
  totalExpenses,
}: {
  totalRevenue: number;
  totalExpenses: number;
}) {
  const hasExpenses = totalExpenses > 0;
  const percent = hasExpenses ? (totalRevenue / totalExpenses) * 100 : 0;
  const barWidth = Math.min(percent, 100);

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">
          Capital recovered
        </span>
        <span className="font-mono text-lg font-semibold text-foreground">
          {hasExpenses ? `${percent.toFixed(0)}%` : "—"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-[width]"
          style={{ width: `${hasExpenses ? barWidth : 0}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {hasExpenses
          ? `${formatPHP(totalRevenue)} collected of ${formatPHP(totalExpenses)} spent`
          : "No expenses recorded yet."}
      </p>
    </div>
  );
}
