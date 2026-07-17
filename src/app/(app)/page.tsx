import { formatPHP } from "@/lib/format";

export default function HomePage() {
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">Home</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Real numbers land Day 9 — these are placeholders to show the style.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3.5">
          <p className="mb-1.5 text-[11px] text-muted-foreground">
            Active customers
          </p>
          <p className="font-mono text-xl font-semibold text-foreground">
            128
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3.5">
          <p className="mb-1.5 text-[11px] text-muted-foreground">
            Due this week
          </p>
          <p className="font-mono text-xl font-semibold text-warning">
            {formatPHP(9200)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3.5">
          <p className="mb-1.5 text-[11px] text-muted-foreground">Overdue</p>
          <p className="font-mono text-xl font-semibold text-destructive">
            {formatPHP(3100)}
          </p>
        </div>
      </div>
    </div>
  );
}
