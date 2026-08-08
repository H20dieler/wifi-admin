import { Badge } from "@/components/ui/badge";
import { STATUS_VARIANT, STATUS_ICON, type StatusKind } from "@/lib/status-display";

export function StatusBadge({ status }: { status: StatusKind }) {
  const Icon = STATUS_ICON[status];
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "default"}>
      <Icon className="size-3" />
      {status}
    </Badge>
  );
}
