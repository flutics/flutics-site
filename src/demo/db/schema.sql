create schema if not exists demo;
create table if not exists demo.meta (
  k text primary key,
  v text not null
);

create schema if not exists sales;
create schema if not exists inventory;
create schema if not exists billing;

create table sales.accounts (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'company',
  legal_name text not null,
  trade_name text,
  segment text,
  city text,
  region text,
  country char(2) not null default 'US',
  owner_name text,
  status text not null default 'active',
  last_interaction text,
  created_at timestamptz not null default now()
);

create table sales.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  job_title text,
  phone text,
  instagram_handle text,
  facebook boolean not null default false,
  owner_name text,
  awaiting_reply boolean not null default false,
  last_interaction text
);

create table sales.account_contacts (
  account_id uuid not null references sales.accounts(id),
  contact_id uuid not null references sales.contacts(id),
  role text,
  is_primary boolean not null default false,
  primary key (account_id, contact_id)
);

create table sales.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  account_id uuid references sales.accounts(id),
  contact_id uuid references sales.contacts(id),
  stage text not null,
  value_minor bigint not null default 0,
  currency char(3) not null default 'USD',
  expected_close date,
  source text,
  owner_name text,
  quote_number text,
  quote_valid_until date,
  awaiting_reply boolean not null default false
);

create table sales.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  family text,
  finish text,
  uom text not null default 'ea',
  make_policy text not null default 'make',
  list_price_minor bigint not null default 0,
  currency char(3) not null default 'USD',
  status text not null default 'active'
);

create table sales.quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  account_id uuid not null references sales.accounts(id),
  contact_id uuid references sales.contacts(id),
  opportunity_id uuid references sales.opportunities(id),
  status text not null default 'draft',
  valid_until date,
  currency char(3) not null default 'USD',
  subtotal_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  total_minor bigint not null default 0,
  owner_name text,
  created_at timestamptz not null default now()
);

create table sales.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references sales.quotes(id) on delete cascade,
  line_no int not null,
  product_id uuid references sales.products(id),
  description text not null,
  qty numeric(18,4) not null,
  uom text not null default 'ea',
  unit_price_minor bigint not null,
  line_total_minor bigint not null,
  unique (quote_id, line_no)
);

create table sales.sales_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  account_id uuid not null references sales.accounts(id),
  quote_id uuid references sales.quotes(id),
  status text not null default 'confirmed',
  currency char(3) not null default 'USD',
  promised_date date,
  total_minor bigint not null default 0,
  reservation_state text not null default 'pending',
  owner_name text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table sales.sales_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references sales.sales_orders(id) on delete cascade,
  line_no int not null,
  product_id uuid references sales.products(id),
  description text not null,
  qty numeric(18,4) not null,
  uom text not null default 'ea',
  unit_price_minor bigint not null,
  line_total_minor bigint not null,
  promised_date date,
  reserved_complete boolean not null default false,
  assembly_started_at timestamptz,
  finished_qty numeric(18,4) not null default 0,
  shipped_qty numeric(18,4) not null default 0,
  delivered_qty numeric(18,4) not null default 0,
  unique (order_id, line_no)
);

create or replace view sales.line_status as
select
  l.*,
  o.number as order_number,
  o.account_id,
  case
    when l.delivered_qty >= l.qty then 'delivered'
    when l.shipped_qty > 0 then 'shipping'
    when l.finished_qty >= l.qty then 'in_stock'
    when l.assembly_started_at is not null then 'assembly'
    when l.reserved_complete then 'reserved'
    else 'ordered'
  end as stage
from sales.sales_order_lines l
join sales.sales_orders o on o.id = l.order_id;

create table inventory.items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  kind text not null,
  uom text not null default 'ea',
  product_id uuid references sales.products(id)
);

create table inventory.stock_balances (
  item_id uuid primary key references inventory.items(id),
  on_hand numeric(18,4) not null default 0,
  reserved numeric(18,4) not null default 0,
  min_qty numeric(18,4) not null default 0,
  incoming numeric(18,4) not null default 0
);

create or replace view inventory.stock as
select
  i.id, i.sku, i.name, i.kind, i.uom,
  b.on_hand, b.reserved, b.min_qty, b.incoming,
  (b.on_hand - b.reserved) as available,
  case
    when (b.on_hand - b.reserved) <= 0 and b.reserved > 0 then 'short'
    when b.on_hand <= 0 then 'out'
    when (b.on_hand - b.reserved) < b.min_qty then 'below_min'
    else 'ok'
  end as situation
from inventory.items i
join inventory.stock_balances b on b.item_id = i.id;

create table inventory.stock_movements (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  item_id uuid not null references inventory.items(id),
  qty numeric(18,4) not null,
  kind text not null,
  ref_type text,
  ref_id uuid,
  at timestamptz not null default now(),
  note text
);

create table inventory.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_name text,
  lead_time_days int,
  min_order_minor bigint,
  last_receipt date,
  status text not null default 'active'
);

create table inventory.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references inventory.items(id),
  severity text not null,
  detail text,
  trigger_count int not null default 1,
  status text not null default 'open',
  purchase_order_id uuid,
  opened_at date,
  last_at timestamptz
);

create table inventory.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  supplier_id uuid references inventory.suppliers(id),
  status text not null default 'draft',
  auto boolean not null default false,
  currency char(3) not null default 'USD',
  total_minor bigint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz,
  received_at timestamptz
);

create table inventory.purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references inventory.purchase_orders(id) on delete cascade,
  line_no int not null,
  item_id uuid not null references inventory.items(id),
  qty numeric(18,4) not null,
  received_qty numeric(18,4) not null default 0,
  uom text not null default 'ea',
  unit_price_minor bigint,
  line_total_minor bigint,
  reason text,
  unique (purchase_order_id, line_no)
);

alter table inventory.stock_alerts
  add constraint stock_alerts_po_fk
  foreign key (purchase_order_id) references inventory.purchase_orders(id);

create table billing.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  account_id uuid not null references sales.accounts(id),
  order_id uuid references sales.sales_orders(id),
  status text not null default 'open',
  issue_date date not null default current_date,
  currency char(3) not null default 'USD',
  total_minor bigint not null default 0,
  paid_minor bigint not null default 0,
  installment_count int not null default 1,
  created_at timestamptz not null default now()
);

create table billing.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing.invoices(id) on delete cascade,
  line_no int not null,
  order_line_id uuid references sales.sales_order_lines(id),
  product_id uuid references sales.products(id),
  description text not null,
  qty numeric(18,4) not null,
  uom text not null default 'ea',
  unit_price_minor bigint not null,
  line_total_minor bigint not null,
  unique (invoice_id, line_no)
);

create table billing.installments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing.invoices(id) on delete cascade,
  n int not null,
  due_date date not null,
  amount_minor bigint not null,
  status text not null default 'open',
  paid_at date,
  method text,
  receipt_number text,
  unique (invoice_id, n)
);

create table billing.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing.invoices(id),
  installment_id uuid references billing.installments(id),
  amount_minor bigint not null,
  method text,
  paid_at timestamptz not null default now(),
  receipt_number text
);

create sequence sales.quote_no start with 150;
create sequence sales.order_no start with 143;
create sequence inventory.po_no start with 36;
create sequence inventory.mv_no start with 4791;
create sequence billing.invoice_no start with 219;

