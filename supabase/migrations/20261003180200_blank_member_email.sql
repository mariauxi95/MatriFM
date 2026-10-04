create or replace function public.admin_update_member(
  p_id uuid,
  p_full_name text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(trim(p_email));
  v_auth uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if length(trim(p_full_name)) = 0 then
    raise exception 'name_required';
  end if;

  select auth_user_id into v_auth from public.members where id = p_id;
  if not found then
    raise exception 'missing_member';
  end if;

  if v_email = '' then
    if v_auth is not null then
      raise exception 'bad_email';
    end if;
    update public.members
    set full_name = trim(p_full_name),
        email = null
    where id = p_id;
    return;
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;

  update public.members
  set full_name = trim(p_full_name),
      email = v_email
  where id = p_id;

  if v_auth is not null then
    update auth.users
    set email = v_email,
        updated_at = now()
    where id = v_auth;

    update auth.identities
    set provider_id = v_email,
        email = v_email,
        identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
        updated_at = now()
    where user_id = v_auth and provider = 'email';
  end if;
end;
$fn$;

revoke execute on function public.admin_update_member(uuid, text, text) from public, anon;
grant execute on function public.admin_update_member(uuid, text, text) to authenticated;
