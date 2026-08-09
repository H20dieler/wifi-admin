import { formatPHP } from "@/lib/format";

type Snapshot = Record<string, unknown> | null;

function str(obj: Snapshot, key: string): string | null {
  const val = obj?.[key];
  return typeof val === "string" && val.trim() !== "" ? val : null;
}

function num(obj: Snapshot, key: string): number | null {
  const val = obj?.[key];
  return typeof val === "number" ? val : null;
}

const DOC_TYPE_LABEL: Record<string, string> = {
  valid_id: "Valid ID",
  proof_of_address: "Proof of Address",
};

export function summarizeActivity(
  entityType: string,
  action: string,
  before: Snapshot,
  after: Snapshot,
  customerNameById: Map<string, string>,
): string {
  // Whichever side of the change actually has data -- `after` for
  // created/updated, `before` for deleted (after is null by then).
  const snapshot = after ?? before;

  switch (entityType) {
    case "customer": {
      const name = str(snapshot, "full_name") ?? "Unknown customer";
      if (action === "updated") {
        const statusBefore = str(before, "status");
        const statusAfter = str(after, "status");
        if (statusBefore && statusAfter && statusBefore !== statusAfter) {
          return `${name} — status changed from ${statusBefore} to ${statusAfter}`;
        }
      }
      return name;
    }

    case "plan": {
      return str(snapshot, "name") ?? "Unknown plan";
    }

    case "expense": {
      const label = str(snapshot, "description") ?? str(snapshot, "category") ?? "Expense";
      const amount = num(snapshot, "amount");
      return amount !== null ? `${label} — ${formatPHP(amount)}` : label;
    }

    case "inventory_item": {
      const name = str(snapshot, "name") ?? "Unknown item";
      const qtyBefore = num(before, "quantity");
      const qtyAfter = num(after, "quantity");
      if (qtyBefore !== null && qtyAfter !== null && qtyBefore !== qtyAfter) {
        return `${name} — quantity ${qtyBefore} → ${qtyAfter}`;
      }
      return name;
    }

    case "payment": {
      const customerId = str(snapshot, "customer_id");
      const customerName =
        (customerId && customerNameById.get(customerId)) || "Unknown customer";
      const amount =
        num(snapshot, "amount_received") ?? num(snapshot, "amount");
      return amount !== null ? `${customerName} — ${formatPHP(amount)}` : customerName;
    }

    case "customer_document": {
      const customerId = str(snapshot, "customer_id");
      const customerName =
        (customerId && customerNameById.get(customerId)) || "Unknown customer";
      const docType = str(snapshot, "doc_type");
      const docLabel = (docType && DOC_TYPE_LABEL[docType]) || "document";
      return `${customerName} — ${docLabel}`;
    }

    default:
      return "—";
  }
}
