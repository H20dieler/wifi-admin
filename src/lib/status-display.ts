import {
  CircleCheck,
  CircleDashed,
  Clock,
  CircleAlert,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";

// Every status string used anywhere in the app that gets a badge --
// customer statuses and payment statuses share this one set so 'overdue'
// (which exists in both domains) can never drift into looking different
// in one place than another.
export type StatusKind =
  | "active"
  | "inactive"
  | "overdue"
  | "paid"
  | "due"
  | "partial";

export type BadgeVariant = "success" | "warning" | "destructive" | "default";

export const STATUS_VARIANT: Record<StatusKind, BadgeVariant> = {
  active: "success",
  paid: "success",
  inactive: "default",
  due: "default",
  overdue: "destructive",
  partial: "warning",
};

// One icon per status, not one icon per color -- 'inactive' and 'due'
// both render as the neutral/default color but mean different things, so
// they get different icons. 'active' and 'paid' are both genuinely the
// same "settled, good standing" concept in their own domain, so they
// intentionally share CircleCheck.
export const STATUS_ICON: Record<StatusKind, LucideIcon> = {
  active: CircleCheck,
  paid: CircleCheck,
  inactive: CircleDashed,
  due: Clock,
  overdue: CircleAlert,
  partial: CircleDollarSign,
};

// For tinting an icon or other element to match a status's badge color
// outside of the Badge component itself (e.g. the summary strip).
export const VARIANT_TEXT_CLASS: Record<BadgeVariant, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  default: "text-muted-foreground",
};
