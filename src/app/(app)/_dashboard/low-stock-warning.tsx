import { TriangleAlert } from "lucide-react";

export type LowStockItem = {
  id: string;
  name: string | null;
  quantity: number | null;
  low_stock_threshold: number | null;
};

export function LowStockWarning({ items }: { items: LowStockItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <TriangleAlert className="size-4 text-warning" />
        <p className="text-sm font-medium text-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} low on stock
        </p>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between text-sm text-muted-foreground"
          >
            <span>{item.name}</span>
            <span className="font-mono">
              {item.quantity} / {item.low_stock_threshold}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
