-- Distinct from `amount` (what's due for the cycle, set once at creation
-- and never changed). amount_received tracks what was actually collected
-- when Record Payment is used -- equal to amount for a full payment, less
-- than it for a partial one, null until a payment is recorded at all.

alter table payments add column amount_received numeric(10,2);
