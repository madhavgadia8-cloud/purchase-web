-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (uses "if not exists").

create extension if not exists "pgcrypto";

-- ---- Requirements (RFQ) ------------------------------------------------
create table if not exists rfqs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  required_by date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  description text not null,
  qty numeric not null default 0,
  unit text,
  sort int not null default 0
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  vendor_name text not null,
  vendor_contact text,
  submitted_at timestamptz not null default now()
);

create table if not exists quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  item_id uuid not null references rfq_items(id) on delete cascade,
  rate numeric not null
);

-- ---- Product master ----------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  unit text,
  category text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---- Supplier master ---------------------------------------------------
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  category text,
  created_at timestamptz not null default now()
);

create index if not exists idx_items_rfq on rfq_items(rfq_id);
create index if not exists idx_quotes_rfq on quotes(rfq_id);
create index if not exists idx_lines_quote on quote_lines(quote_id);

-- The app talks to the database only from the server using the service-role
-- key, so row level security can stay enabled with no public policies.
alter table rfqs enable row level security;
alter table rfq_items enable row level security;
alter table quotes enable row level security;
alter table quote_lines enable row level security;
alter table products enable row level security;
alter table suppliers enable row level security;
