import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { formatPHP } from "@/lib/format";
import {
  getEffectivePaymentStatus,
  getEffectiveCustomerStatus,
} from "@/lib/effective-status";
import { PaymentTimeline } from "./payment-timeline";
import { CustomerDocuments, type DocumentItem } from "./customer-documents";
import type { PaymentRow } from "../../payments/page";

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

  const { data: documentRows } = await supabase
    .from("customer_documents")
    .select("id, doc_type, storage_path, uploaded_at")
    .eq("customer_id", id)
    .order("uploaded_at", { ascending: false });

  // Signed URLs only -- this bucket is private (see the Day 2 migration)
  // and nothing in this app is allowed to construct or rely on a public
  // link. One batched call rather than N createSignedUrl calls.
  const paths = (documentRows ?? []).map((d) => d.storage_path);
  const { data: signedUrlResults } =
    paths.length > 0
      ? await supabase.storage
          .from("customer-documents")
          .createSignedUrls(paths, 60 * 60)
      : { data: [] as { path: string | null; signedUrl: string }[] };

  const signedUrlByPath = new Map(
    (signedUrlResults ?? [])
      .filter((r) => r.path)
      .map((r) => [r.path as string, r.signedUrl]),
  );

  const documents: DocumentItem[] = (documentRows ?? []).map((d) => ({
    id: d.id,
    doc_type: d.doc_type as DocumentItem["doc_type"],
    storage_path: d.storage_path,
    uploaded_at: d.uploaded_at,
    signedUrl: signedUrlByPath.get(d.storage_path) ?? null,
  }));

  const plan = customer.plans as unknown as {
    name: string | null;
    price: number | null;
  } | null;

  type RawPayment = Omit<PaymentRow, "customers" | "effectiveStatus">;
  const rawPayments = (payments as unknown as RawPayment[]) ?? [];

  // RecordPaymentDialog expects the customers(full_name) embed shape it
  // gets on the Payments page -- attaching it here rather than forking a
  // second dialog component for one field's difference. Same effective-
  // status treatment as the Payments page: not explicitly named in the
  // brief, but this page shows the exact same payment rows and customer
  // status, and leaving them stale here while fixed there would just move
  // the inconsistency rather than resolve it.
  const paymentRows: PaymentRow[] = rawPayments.map((p) => ({
    ...p,
    customers: { full_name: customer.full_name },
    effectiveStatus: getEffectivePaymentStatus(p.status, p.due_date),
  }));

  // Payments are already ordered by due_date desc, so the first row (if
  // any) is the most recent -- exactly what getEffectiveCustomerStatus
  // needs, no extra query required here.
  const mostRecentPayment = rawPayments[0] ?? null;
  const effectiveCustomerStatus = getEffectiveCustomerStatus(
    customer.status,
    mostRecentPayment,
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
            <StatusBadge status={effectiveCustomerStatus} />
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

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Documents
      </h2>
      <CustomerDocuments customerId={id} documents={documents} />
    </div>
  );
}
