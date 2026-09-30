-- ============================================================================
--  MAI AUTOS Invoice — Supabase database schema
--  Run this once: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================================

-- Company settings (single shared row)
create table if not exists public.settings (
  id          integer primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Invoices. The full invoice lives in `data` (JSON); the other columns are
-- copies used for listing, searching and sorting.
create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,
  issue_date     date,
  due_date       date,
  customer_name  text,
  vehicle        text,
  currency       text not null default 'USD',
  total          numeric(14,2) not null default 0,
  balance        numeric(14,2) not null default 0,
  data           jsonb not null,
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists invoices_updated_at_idx on public.invoices (updated_at desc);
create index if not exists invoices_customer_idx   on public.invoices (lower(customer_name));

-- ----------------------------------------------------------------------------
--  Security: only signed-in staff can read/write. Every staff account you
--  create in Supabase (Authentication → Users) shares the same invoices.
-- ----------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "staff can manage settings" on public.settings;
create policy "staff can manage settings"
  on public.settings for all
  to authenticated
  using (true) with check (true);

drop policy if exists "staff can manage invoices" on public.invoices;
create policy "staff can manage invoices"
  on public.invoices for all
  to authenticated
  using (true) with check (true);

-- Nothing for anonymous visitors
revoke all on public.settings from anon;
revoke all on public.invoices from anon;

-- Vehicle stock records (the foundation for acquisition, sales and trade-ins)
create table if not exists public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  stock_no       text unique,
  category       text not null default 'foreign_used' check (category in ('new','locally_used','foreign_used')),
  status         text not null default 'in_stock' check (status in ('in_stock','reserved','sold','in_transit','preparation')),
  year           text,
  make           text not null,
  model          text not null,
  trim           text,
  vin            text unique,
  engine_number  text,
  mileage        text,
  condition      text,
  colour         text,
  transmission   text,
  fuel_type      text,
  location       text,
  notes          text,
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists vehicles_status_idx on public.vehicles (status);
create index if not exists vehicles_make_model_idx on public.vehicles (make, model);
alter table public.vehicles enable row level security;
drop policy if exists "staff can manage vehicles" on public.vehicles;
create policy "staff can manage vehicles" on public.vehicles
  for all to authenticated using (true) with check (true);
revoke all on public.vehicles from anon;


-- Acquisition cost fields: amounts retain source currency and FX rate to the
-- vehicle's reporting currency; additional costs are a JSON array of ledger lines.
alter table public.vehicles add column if not exists supplier text;
alter table public.vehicles add column if not exists acquisition_date date;
alter table public.vehicles add column if not exists purchase_amount numeric(16,4) not null default 0;
alter table public.vehicles add column if not exists purchase_currency text not null default 'USD';
alter table public.vehicles add column if not exists purchase_rate_to_base numeric(16,8) not null default 1;
alter table public.vehicles add column if not exists reporting_currency text not null default 'USD';
alter table public.vehicles add column if not exists additional_costs jsonb not null default '[]'::jsonb;


-- Sales pipeline and trade-in / swap deal records
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  deal_no text not null unique,
  stage text not null default 'enquiry' check (stage in ('enquiry','reserved','in_progress','completed','cancelled')),
  customer_name text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deals_stage_idx on public.deals (stage);
create index if not exists deals_customer_idx on public.deals (lower(customer_name));
alter table public.deals enable row level security;
drop policy if exists "staff can manage deals" on public.deals;
create policy "staff can manage deals" on public.deals for all to authenticated using (true) with check (true);
revoke all on public.deals from anon;


-- Customer/lead register and follow-up schedule
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(), name text not null, phone text, email text, address text, city text,
  kind text not null default 'lead' check(kind in ('lead','customer')), source text, next_follow_up date, notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists customers_name_idx on public.customers (lower(name));
create index if not exists customers_followup_idx on public.customers (next_follow_up);
alter table public.customers enable row level security;
drop policy if exists "staff can manage customers" on public.customers;
create policy "staff can manage customers" on public.customers for all to authenticated using (true) with check (true);
revoke all on public.customers from anon;


-- After-sales maintenance and warranty history
create table if not exists public.service_records (
 id uuid primary key default gen_random_uuid(), vehicle_id uuid references public.vehicles(id) on delete set null, vehicle_label text, customer_name text, customer_phone text,
 job_type text not null, status text not null default 'booked' check(status in ('booked','in_progress','completed','cancelled')), received_date date, due_date date, warranty_until date, warranty_provider text, estimated_cost numeric(14,2) not null default 0, actual_cost numeric(14,2) not null default 0, notes text,
 created_by uuid default auth.uid() references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists service_records_vehicle_idx on public.service_records(vehicle_id);
create index if not exists service_records_status_idx on public.service_records(status);
alter table public.service_records enable row level security;
drop policy if exists "staff can manage service records" on public.service_records;
create policy "staff can manage service records" on public.service_records for all to authenticated using (true) with check (true);
revoke all on public.service_records from anon;
