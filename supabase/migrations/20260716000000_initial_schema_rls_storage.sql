-- Day 2: every table the app needs, RLS on all of them, customer-documents bucket.
-- Review before running. Safe to re-run (idempotent) except for the CREATE TABLE
-- statements, which will error if the tables already exist.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLES (order respects foreign keys)
-- ============================================================================

create table admin_profiles (
  id            uuid primary key references auth.users(id),
  full_name     text,
  role          text check (role in ('owner','staff')),
  created_at    timestamptz default now()
);

create table plans (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  speed_mbps    int,
  price         numeric(10,2),
  created_at    timestamptz default now()
);

create table customers (
  id                uuid primary key default gen_random_uuid(),
  full_name         text,
  phone             text,
  address           text,
  plan_id           uuid references plans(id),
  billing_day       int,          -- 1-31
  status            text check (status in ('active','inactive','overdue')),
  start_date        date,
  deleted_at        timestamptz,  -- nullable, for soft-delete (Day 14)
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table payments (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references customers(id),
  amount        numeric(10,2),
  due_date      date,
  paid_date     date,           -- nullable
  status        text check (status in ('paid','due','overdue','partial')),
  method        text,           -- nullable
  notes         text,           -- nullable
  created_at    timestamptz default now()
);

create table expenses (
  id            uuid primary key default gen_random_uuid(),
  category      text,
  description   text,
  amount        numeric(10,2),
  expense_date  date,
  deleted_at    timestamptz,    -- nullable
  created_at    timestamptz default now()
);

create table inventory_items (
  id                    uuid primary key default gen_random_uuid(),
  name                  text,
  quantity              int,
  unit                  text,
  low_stock_threshold   int default 5,
  category              text,   -- nullable
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create table customer_documents (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references customers(id),
  doc_type      text check (doc_type in ('valid_id','proof_of_address','other')),
  storage_path  text,
  uploaded_at   timestamptz default now()
);

create table activity_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references admin_profiles(id),
  action        text,           -- 'created' | 'updated' | 'deleted' | 'payment_recorded' | 'message_sent'
  entity_type   text,           -- 'customer' | 'payment' | 'expense' | 'inventory_item' | ...
  entity_id     uuid,           -- nullable
  details       jsonb,          -- before/after snapshot
  created_at    timestamptz default now()
);

create table app_settings (                 -- single row, id = 1
  id                     int primary key default 1,
  business_name          text,
  message_template       text,
  low_stock_default      int default 5,
  reminder_days_before   int default 3,
  updated_at             timestamptz default now()
);

-- ============================================================================
-- ADDED BEYOND THE SPEC (flagged in chat): FK indexes + updated_at triggers.
-- Not asked for explicitly, but the schema doesn't work as intended without
-- them — updated_at would just sit frozen, and every join here would be an
-- unindexed scan as the tables grow.
-- ============================================================================

create index idx_customers_plan_id on customers(plan_id);
create index idx_customers_status on customers(status) where deleted_at is null;
create index idx_payments_customer_id on payments(customer_id);
create index idx_payments_status on payments(status);
create index idx_payments_due_date on payments(due_date);
create index idx_customer_documents_customer_id on customer_documents(customer_id);
create index idx_activity_logs_admin_id on activity_logs(admin_id);
create index idx_activity_logs_entity on activity_logs(entity_type, entity_id);
create index idx_expenses_expense_date on expenses(expense_date) where deleted_at is null;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger trg_inventory_items_updated_at
  before update on inventory_items
  for each row execute function set_updated_at();

create trigger trg_app_settings_updated_at
  before update on app_settings
  for each row execute function set_updated_at();

-- Schema comment says "single row, id = 1" — seed it so every later page
-- that reads settings has a row to find instead of erroring on an empty table.
insert into app_settings (id) values (1)
  on conflict (id) do nothing;

-- ============================================================================
-- ROLE-CHECK HELPER
-- security definer so it can read admin_profiles regardless of the calling
-- user's own RLS visibility into that table (avoids recursive-policy issues).
-- ============================================================================

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY — enabled on every table
-- ============================================================================

alter table admin_profiles enable row level security;
alter table plans enable row level security;
alter table customers enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table inventory_items enable row level security;
alter table customer_documents enable row level security;
alter table activity_logs enable row level security;
alter table app_settings enable row level security;

-- admin_profiles: NOT explicitly covered by the "everything except expenses/
-- activity_logs" instruction, and it needs its own rule — a blanket "any
-- authenticated admin can write" policy here would let a staff account
-- promote itself to owner. Any authenticated admin can read the list (for
-- assigning things to teammates); only the service role can insert/update/
-- delete for now. Day 3 (auth & role-based access) should replace this with
-- real create/invite/promote rules once that flow is designed — flagging
-- this rather than guessing at Day 3's design.
create policy "authenticated admins can view admin profiles"
  on admin_profiles
  for select
  to authenticated
  using (true);

-- plans, customers, payments, inventory_items, customer_documents:
-- any authenticated admin can read/write everything, per the brief.
create policy "authenticated admins can manage plans"
  on plans for all to authenticated using (true) with check (true);

create policy "authenticated admins can manage customers"
  on customers for all to authenticated using (true) with check (true);

create policy "authenticated admins can manage payments"
  on payments for all to authenticated using (true) with check (true);

create policy "authenticated admins can manage inventory items"
  on inventory_items for all to authenticated using (true) with check (true);

create policy "authenticated admins can manage customer documents"
  on customer_documents for all to authenticated using (true) with check (true);

-- app_settings: any authenticated admin can read/write (per the brief, which
-- didn't list Settings under the owner-only exceptions — see chat note on
-- the mismatch with "Staff ... except ... Settings" from Day 0). DELETE is
-- withheld from everyone since the app expects exactly one row to always
-- exist.
create policy "authenticated admins can manage settings"
  on app_settings for all to authenticated using (true) with check (true);

create policy "no one can delete the settings row"
  on app_settings as restrictive for delete to public using (false);

-- expenses: owner-only, full stop.
create policy "owners can manage expenses"
  on expenses for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- activity_logs: owner-only read/write, and DELETE is blocked for everyone,
-- including owners — the restrictive policy overrides the permissive one
-- above it for the delete command specifically.
create policy "owners can manage activity logs"
  on activity_logs for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "no one can delete activity logs"
  on activity_logs as restrictive for delete to public using (false);

-- ============================================================================
-- STORAGE — private customer-documents bucket
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do nothing;

create policy "authenticated admins can manage customer documents in storage"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'customer-documents')
  with check (bucket_id = 'customer-documents');
