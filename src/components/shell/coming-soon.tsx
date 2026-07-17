export function ComingSoon({ title, day }: { title: string; day: string }) {
  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">Built out on {day}.</p>
    </div>
  );
}
