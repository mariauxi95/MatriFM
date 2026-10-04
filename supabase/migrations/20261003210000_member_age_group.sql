alter table public.members
  add column if not exists age_group text not null default 'adult';

alter table public.members
  drop constraint if exists members_age_group_check;

alter table public.members
  add constraint members_age_group_check
  check (age_group in ('baby', 'kid', 'teen', 'adult'));

drop function if exists public.admin_update_member(uuid, text, text);
drop function if exists public.admin_add_member(uuid, text, text);

create function public.admin_update_member(
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
        email = null,
        age_group = v_age
    where id = p_id;
    return;
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;

  update public.members
  set full_name = trim(p_full_name),
      email = v_email,
      age_group = v_age
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

create function public.admin_add_member(
  p_household_id uuid,
  p_full_name text,
  p_email text,
  p_age_group text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_age text := lower(trim(coalesce(p_age_group, 'adult')));
  v_id uuid;
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
  if not exists (select 1 from public.households where id = p_household_id) then
    raise exception 'missing_household';
  end if;
  if v_email <> '' and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;

  insert into public.members (id, household_id, full_name, email, age_group)
  values (gen_random_uuid(), p_household_id, trim(p_full_name), nullif(v_email, ''), v_age)
  returning id into v_id;
  return v_id;
end;
$fn$;

revoke all on function public.admin_update_member(uuid, text, text, text) from public, anon;
revoke all on function public.admin_add_member(uuid, text, text, text) from public, anon;
grant execute on function public.admin_update_member(uuid, text, text, text) to authenticated;
grant execute on function public.admin_add_member(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
