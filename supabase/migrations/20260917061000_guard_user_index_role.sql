create or replace function public.user_index_upsert(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_email text;
  v_existing_role text;
begin
  if p_role not in ('earner', 'employer') then
    raise exception 'Invalid user role: %', p_role;
  end if;

  select email
  into v_email
  from auth.users
  where id = p_user_id;

  if v_email is null then
    return;
  end if;

  select role
  into v_existing_role
  from public.user_index
  where user_id = p_user_id;

  if v_existing_role is not null
     and v_existing_role <> p_role then
    raise exception
      'User % already has role %, cannot assign role %',
      p_user_id,
      v_existing_role,
      p_role;
  end if;

  insert into public.user_index (
    user_id,
    email,
    role,
    updated_at
  )
  values (
    p_user_id,
    lower(v_email),
    p_role,
    now()
  )
  on conflict (user_id)
  do update set
    email = excluded.email,
    updated_at = now();

  -- If an old row exists for the same email, keep it aligned only
  -- when it belongs to this same auth user and role.
  update public.user_index
  set
    user_id = p_user_id,
    updated_at = now()
  where lower(email) = lower(v_email)
    and user_id = p_user_id
    and role = p_role;
end;
$function$;

comment on function public.user_index_upsert(uuid, text) is
  'Synchronizes user_index while preventing one auth user from being assigned both earner and employer roles.';
