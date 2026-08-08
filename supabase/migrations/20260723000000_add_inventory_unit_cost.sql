-- Not in the original Day 2 schema. Nullable and no default: "optional --
-- not every item needs a cost recorded" per the brief. Items without a
-- cost set are excluded (not treated as zero) from the stock-value total.

alter table inventory_items add column unit_cost numeric(10,2);
