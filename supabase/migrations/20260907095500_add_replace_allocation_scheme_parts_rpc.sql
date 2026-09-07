create or replace function public.replace_allocation_scheme_parts(
  p_scheme_id uuid,
  p_parts jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  part jsonb;
begin
  if jsonb_typeof(p_parts) <> 'array' then
    raise exception 'p_parts must be a JSON array';
  end if;

  delete from public.allocation_scheme_parts
  where scheme_id = p_scheme_id;

  for part in
    select value
    from jsonb_array_elements(p_parts)
  loop
    insert into public.allocation_scheme_parts (
      scheme_id,
      part_index,
      label,
      percent,
      destination_kind,
      destination_type,
      destination_id,
      employer_payout_account_id
    )
    values (
      p_scheme_id,
      (part->>'part_index')::integer,
      coalesce(part->>'label', ''),
      (part->>'percent')::numeric,
      (part->>'destination_kind')::public.tip_destination_kind,
      coalesce(part->>'destination_type', part->>'destination_kind'),
      nullif(part->>'destination_id', '')::uuid,
      null
    );
  end loop;
end;
$$;

revoke all on function public.replace_allocation_scheme_parts(uuid, jsonb)
from public, anon, authenticated;

grant execute
on function public.replace_allocation_scheme_parts(uuid, jsonb)
to service_role;
