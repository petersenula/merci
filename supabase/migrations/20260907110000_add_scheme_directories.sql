create table public.scheme_directories (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null
    references public.employers(user_id)
    on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint scheme_directories_name_not_blank
    check (length(btrim(name)) > 0)
);

create index scheme_directories_employer_id_idx
  on public.scheme_directories (employer_id);

create table public.scheme_directory_items (
  id uuid primary key default gen_random_uuid(),
  directory_id uuid not null
    references public.scheme_directories(id)
    on delete cascade,
  scheme_id uuid not null
    references public.allocation_schemes(id)
    on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),

  constraint scheme_directory_items_unique_scheme
    unique (directory_id, scheme_id),

  constraint scheme_directory_items_position_non_negative
    check (position >= 0)
);

create index scheme_directory_items_directory_id_idx
  on public.scheme_directory_items (directory_id);

create index scheme_directory_items_scheme_id_idx
  on public.scheme_directory_items (scheme_id);

alter table public.scheme_directories enable row level security;
alter table public.scheme_directory_items enable row level security;

comment on table public.scheme_directories is
  'Employer-managed public directories containing selected allocation schemes. Each directory has a stable public URL and QR code.';

comment on table public.scheme_directory_items is
  'Ordered allocation schemes displayed in a scheme directory.';
