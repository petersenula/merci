begin;

create table if not exists public.payout_requests (
  request_id uuid primary key,
  role text not null
    check (role in ('earner', 'employer')),
  user_id uuid not null,
  stripe_account_id text not null,
  status text not null default 'processing'
    check (status in ('processing', 'succeeded', 'failed')),
  month_key text not null,
  currency text,
  fee_cents integer
    check (fee_cents is null or fee_cents >= 0),
  payout_amount_cents integer
    check (payout_amount_cents is null or payout_amount_cents >= 0),
  stripe_fee_charge_id text,
  stripe_fee_refund_id text,
  stripe_payout_id text,
  error_code text,
  retry_count integer not null default 0
    check (retry_count >= 0),
  next_retry_at timestamptz,
  processing_expires_at timestamptz not null
    default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payout_requests enable row level security;

comment on table public.payout_requests is
  'Server-only state and idempotency records for manual payout operations.';

create unique index if not exists payout_requests_active_user_unique_idx
  on public.payout_requests (role, user_id)
  where status = 'processing';

create unique index if not exists payout_requests_stripe_payout_unique_idx
  on public.payout_requests (stripe_payout_id)
  where stripe_payout_id is not null;

create unique index if not exists payout_requests_fee_charge_unique_idx
  on public.payout_requests (stripe_fee_charge_id)
  where stripe_fee_charge_id is not null;

create unique index if not exists payout_fees_log_monthly_active_unique_idx
  on public.payout_fees_log (role, user_id, month_key)
  where fee_type = 'monthly_active';

create unique index if not exists payout_fees_log_payout_type_unique_idx
  on public.payout_fees_log (stripe_payout_id, fee_type)
  where stripe_payout_id is not null;

commit;
