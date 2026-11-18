-- Run in the approved Supabase project before enabling payments.
create table if not exists public.store_orders (
  stripe_session_id text primary key,
  stripe_event_id text not null,
  payment_status text not null,
  fulfilment_status text not null default 'pending_supplier',
  currency text not null,
  amount_total bigint,
  supplier_order_id text,
  tracking_number text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists store_orders_event_idx on public.store_orders(stripe_event_id);
alter table public.store_orders enable row level security;
-- No anonymous or authenticated client access: service-role backend only.
