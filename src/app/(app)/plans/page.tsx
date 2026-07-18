import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlansTable } from "./plans-table";

export type Plan = {
  id: string;
  name: string | null;
  speed_mbps: number | null;
  price: number | null;
};

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, speed_mbps, price")
    .order("price", { ascending: true });

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Customers
      </Link>
      <h1 className="mb-2 text-lg font-semibold text-foreground">Plans</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Feeds the plan dropdown on the customer form.
      </p>
      <PlansTable plans={(plans as Plan[]) ?? []} />
    </div>
  );
}
