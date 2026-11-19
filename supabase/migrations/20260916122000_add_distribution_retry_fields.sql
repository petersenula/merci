alter table public.tips
  add column if not exists distribution_retry_count integer not null default 0,
  add column if not exists distribution_retry_started_at timestamptz null,
  add column if not exists distribution_next_retry_at timestamptz null;
