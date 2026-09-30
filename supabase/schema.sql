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
