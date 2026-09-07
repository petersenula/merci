create table public.payment_scheme_snapshots (
  payment_intent_id text primary key,
  scheme_id uuid not null,
  employer_id uuid not null,
  parts jsonb not null,
  created_at timestamptz not null default now(),

  constraint payment_scheme_snapshots_parts_array
    check (jsonb_typeof(parts) = 'array')
);

create index payment_scheme_snapshots_scheme_id_idx
  on public.payment_scheme_snapshots (scheme_id);

create index payment_scheme_snapshots_employer_id_idx
  on public.payment_scheme_snapshots (employer_id);

alter table public.payment_scheme_snapshots enable row level security;

comment on table public.payment_scheme_snapshots is
  'Immutable snapshot of an allocation scheme captured for a Stripe PaymentIntent before payment confirmation.';
