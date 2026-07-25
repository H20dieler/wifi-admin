export function StatCard({
  label,
  value,
  valueClassName,
  footnote,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  footnote?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
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
