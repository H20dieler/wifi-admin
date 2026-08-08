import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Documents
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Documents are managed per-customer, not from a single list here.
        Open a customer&apos;s page to upload or view their Valid ID and
        Proof of Address.
      </p>
      <Button asChild>
        <Link href="/customers">
          <Users />
          Go to Customers
        </Link>
      </Button>
    </div>
  );
}
