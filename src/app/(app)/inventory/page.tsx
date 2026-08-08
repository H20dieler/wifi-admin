import { createClient } from "@/lib/supabase/server";
import { formatPHP } from "@/lib/format";
import { StatCard } from "../_dashboard/stat-card";
import { InventoryTable } from "./inventory-table";

export type InventoryItem = {
  id: string;
  name: string | null;
  quantity: number;
  unit: string | null;
  low_stock_threshold: number;
  category: string | null;
  unit_cost: number | null;
};

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("inventory_items")
    .select(
      "id, name, quantity, unit, low_stock_threshold, category, unit_cost",
    )
    .order("name", { ascending: true });

  const rows = (items as InventoryItem[]) ?? [];

  // Distinct from the Day 8/9 capital-recovered figure (cash spent vs.
  // collected) -- this is spend still sitting on a shelf, not yet
  // deployed. Items without a unit_cost are excluded, not treated as
  // zero, so an unpriced item can't silently understate the total.
  const pricedItems = rows.filter((item) => item.unit_cost !== null);
  const stockValue = pricedItems.reduce(
    (sum, item) => sum + item.quantity * (item.unit_cost as number),
    0,
  );
  const uncostedCount = rows.length - pricedItems.length;

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Inventory
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Stock on hand for installs and repairs.
      </p>

      <div className="mb-6 max-w-xs">
        <StatCard
          label="Value tied up in stock"
          value={formatPHP(stockValue)}
          footnote={
            uncostedCount > 0
              ? `${uncostedCount} item${uncostedCount === 1 ? "" : "s"} without a cost not counted`
              : `Across ${pricedItems.length} priced item${pricedItems.length === 1 ? "" : "s"}`
          }
        />
      </div>

      <InventoryTable items={rows} />
    </div>
  );
}
