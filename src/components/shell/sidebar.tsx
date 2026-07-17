"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  CreditCard,
  Wallet,
  Package,
  FileText,
  Calendar,
  History,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  ownerOnly: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home, ownerOnly: false },
  { label: "Customers", href: "/customers", icon: Users, ownerOnly: false },
  { label: "Payments", href: "/payments", icon: CreditCard, ownerOnly: false },
  { label: "Expenses", href: "/expenses", icon: Wallet, ownerOnly: true },
  { label: "Inventory", href: "/inventory", icon: Package, ownerOnly: false },
  { label: "Documents", href: "/documents", icon: FileText, ownerOnly: false },
  { label: "Calendar", href: "/calendar", icon: Calendar, ownerOnly: false },
  {
    label: "Activity log",
    href: "/activity-log",
    icon: History,
    ownerOnly: true,
  },
];

export function Sidebar({ role }: { role: "owner" | "staff" }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col gap-0.5 bg-sidebar px-3 py-5 text-sidebar-foreground">
      <div className="mb-5 px-2.5 text-[15px] font-semibold tracking-tight">
        WiFi Admin
      </div>
      {NAV_ITEMS.filter((item) => !item.ownerOnly || role === "owner").map(
        (item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/40",
                isActive &&
                  "bg-sidebar-accent font-medium text-sidebar-primary hover:bg-sidebar-accent",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        },
      )}
    </aside>
  );
}
