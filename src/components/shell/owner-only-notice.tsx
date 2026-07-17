export function OwnerOnlyNotice({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">
        This page is limited to the account owner.
      </p>
    </div>
  );
}
