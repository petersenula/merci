create or replace function public.replace_scheme_directory_items(
  p_directory_id uuid,
  p_scheme_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scheme_id uuid;
  v_position integer := 0;
begin
  if p_scheme_ids is null or cardinality(p_scheme_ids) = 0 then
    raise exception 'p_scheme_ids must contain at least one scheme';
  end if;

  if cardinality(p_scheme_ids) <>
     cardinality(array(select distinct unnest(p_scheme_ids))) then
    raise exception 'p_scheme_ids must not contain duplicates';
  end if;

  delete from public.scheme_directory_items
  where directory_id = p_directory_id;

  foreach v_scheme_id in array p_scheme_ids
  loop
    insert into public.scheme_directory_items (
      directory_id,
      scheme_id,
      position
    )
    values (
      p_directory_id,
      v_scheme_id,
      v_position
    );

    v_position := v_position + 1;
  end loop;
end;
$$;

revoke all
on function public.replace_scheme_directory_items(uuid, uuid[])
from public, anon, authenticated;

grant execute
on function public.replace_scheme_directory_items(uuid, uuid[])
to service_role;
