import { LogoutButton } from "@/components/logout-button";
import type { CurrentAdmin } from "@/lib/get-current-admin";

export function Topbar({ admin }: { admin: CurrentAdmin }) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-foreground">
          {admin.full_name ?? admin.id}
        </span>
        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {admin.role}
        </span>
      </div>
      <LogoutButton />
    </header>
  );
}
