import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "@/lib/format";
import { PaymentTimeline } from "./payment-timeline";
import type { PaymentWithCustomer } from "../../payments/page";

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "destructive" | "default"
> = {
  active: "success",
  inactive: "default",
  overdue: "destructive",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select(
      "id, full_name, phone, address, status, start_date, plans(name, price)",
    )
    .eq("id", id)
    .single();

  if (!customer) {
    notFound();
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("id, customer_id, amount, due_date, paid_date, status, method, notes")
    .eq("customer_id", id)
    .order("due_date", { ascending: false });

  const plan = customer.plans as unknown as {
    name: string | null;
    price: number | null;
  } | null;

  // RecordPaymentDialog expects the customers(full_name) embed shape it
  // gets on the Payments page -- attaching it here rather than forking a
  // second dialog component for one field's difference.
  const paymentRows: PaymentWithCustomer[] = ((payments as unknown[]) ?? []).map(
    (p) => ({
      ...(p as Omit<PaymentWithCustomer, "customers">),
      customers: { full_name: customer.full_name },
    }),
  );

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Customers
      </Link>

      <div className="mb-6 flex items-start justify-between rounded-lg border border-border bg-card p-5">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">
              {customer.full_name}
            </h1>
            <Badge variant={STATUS_VARIANT[customer.status ?? ""] ?? "default"}>
              {customer.status ?? "unknown"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {plan?.name ?? "No plan"}
            {plan?.price != null && ` · ${formatPHP(plan.price)}/mo`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {customer.phone ?? "No phone on file"}
            {customer.address && ` · ${customer.address}`}
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Payment history
      </h2>
      <PaymentTimeline payments={paymentRows} />
    </div>
  );
}
