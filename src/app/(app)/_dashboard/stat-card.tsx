import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  valueClassName,
  footnote,
  icon: Icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  footnote?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </p>
      <p
        className={`font-mono text-2xl font-semibold text-foreground ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {footnote && (
        <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>
      )}
    </div>
  );
}
