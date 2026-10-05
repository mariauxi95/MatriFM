-- auth.identities.email is generated from identity_data. Writing it (or
-- replacing provider_id, which is the user id for email login) aborts the
-- whole admin save, so a guest who already signed in cannot change email.

create or replace function public.admin_update_member(
  p_id uuid,
  p_full_name text,
  p_email text,
  p_age_group text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_age text := lower(trim(coalesce(p_age_group, '')));
  v_auth uuid;
  v_old text;
  v_generated text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if length(trim(coalesce(p_full_name, ''))) = 0 then
    raise exception 'name_required';
  end if;
  if v_age not in ('baby', 'kid', 'teen', 'adult') then
    raise exception 'bad_age';
  end if;

  select auth_user_id, lower(coalesce(email, ''))
  into v_auth, v_old
  from public.members
  where id = p_id;
  if not found then
    raise exception 'missing_member';
  end if;

  if v_email = '' then
    if v_auth is not null then
      raise exception 'email_required';
    end if;
    update public.members
    set full_name = trim(p_full_name),
        email = null,
        age_group = v_age
    where id = p_id;
    return;
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;
  if exists (
    select 1 from public.members
    where lower(email) = v_email and id <> p_id
  ) then
    raise exception 'email_taken';
  end if;

  update public.members
  set full_name = trim(p_full_name),
      email = v_email,
      age_group = v_age
  where id = p_id;

  if v_auth is null or v_email = v_old then
    return;
  end if;
  if exists (
    select 1 from auth.users
    where id <> v_auth and lower(email) = v_email
  ) then
    raise exception 'email_taken';
  end if;

  select a.attgenerated::text
  into v_generated
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_class c on c.oid = a.attrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'auth'
    and c.relname = 'identities'
    and a.attname = 'email'
    and not a.attisdropped;

  if coalesce(v_generated, 's') = '' then
    update auth.identities
    set email = v_email,
        identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
        provider_id = case
          when v_old <> '' and lower(provider_id) = v_old then v_email
          else provider_id
        end,
        updated_at = now()
    where user_id = v_auth and provider = 'email';
  else
    update auth.identities
    set identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
        provider_id = case
          when v_old <> '' and lower(provider_id) = v_old then v_email
          else provider_id
        end,
        updated_at = now()
    where user_id = v_auth and provider = 'email';
  end if;

  update auth.users
  set email = v_email,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = v_auth;
end;
$fn$;

revoke all on function public.admin_update_member(uuid, text, text, text) from public, anon;
grant execute on function public.admin_update_member(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
