create or replace function public.ensure_household_primary(p_household uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if p_household is null then
    return;
  end if;
  if exists (
    select 1 from public.members
    where household_id = p_household and is_primary
  ) then
    return;
  end if;

  update public.members
  set is_primary = true
  where id = (
    select id
    from public.members
    where household_id = p_household
      and length(trim(full_name)) > 0
    order by full_name
    limit 1
  );
end;
$fn$;

revoke all on function public.ensure_household_primary(uuid) from public, anon, authenticated;

create or replace function public.admin_add_member(
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

  perform public.ensure_household_primary(p_household_id);
  return v_id;
end;
$fn$;

create or replace function public.admin_create_household(
  p_display_name text,
  p_full_name text,
  p_email text,
  p_guest_limit integer,
  p_side text,
  p_kind text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_name text := trim(coalesce(p_display_name, ''));
  v_person text := trim(coalesce(p_full_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_side text := nullif(lower(trim(coalesce(p_side, ''))), '');
  v_kind text := nullif(lower(trim(coalesce(p_kind, ''))), '');
  v_code text;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if v_person = '' then
    raise exception 'name_required';
  end if;
  if v_name = '' then
    v_name := v_person;
  end if;
  if v_email <> '' and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;
  if v_side is not null and v_side not in ('maru', 'fer') then
    raise exception 'bad_side';
  end if;
  if v_kind is not null and v_kind not in ('familia', 'amigos') then
    raise exception 'bad_kind';
  end if;

  perform pg_advisory_xact_lock(191200);
  select (coalesce(max(legacy_code::bigint), 191199) + 1)::text
  into v_code
  from public.households
  where legacy_code ~ '^[0-9]+$';

  insert into public.households (id, legacy_code, display_name, guest_limit, side, kind)
  values (gen_random_uuid(), v_code, v_name, greatest(1, coalesce(p_guest_limit, 1)), v_side, v_kind)
  returning id into v_id;

  insert into public.members (id, household_id, full_name, email, is_primary)
  values (gen_random_uuid(), v_id, v_person, nullif(v_email, ''), true);

  return v_id;
end;
$fn$;

create or replace function public.admin_remove_member(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_auth uuid;
  v_household uuid;
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select auth_user_id, household_id into v_auth, v_household
  from public.members
  where id = p_id;
  if not found then
    raise exception 'missing_member';
  end if;

  select count(*) into v_count from public.members where household_id = v_household;
  if v_count <= 1 then
    raise exception 'last_member';
  end if;

  delete from public.members where id = p_id;
  if v_auth is not null then
    delete from auth.users where id = v_auth;
  end if;

  perform public.ensure_household_primary(v_household);
end;
$fn$;

create or replace function public.admin_split_member(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_source uuid;
  v_name text;
  v_side text;
  v_kind text;
  v_code text;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select m.household_id, m.full_name, h.side, h.kind
  into v_source, v_name, v_side, v_kind
  from public.members m
  join public.households h on h.id = m.household_id
  where m.id = p_member_id;
  if not found then
    raise exception 'missing_member';
  end if;
  if (select count(*) from public.members where household_id = v_source) <= 1 then
    raise exception 'last_member';
  end if;

  perform pg_advisory_xact_lock(191200);
  select (coalesce(max(legacy_code::bigint), 191199) + 1)::text
  into v_code
  from public.households
  where legacy_code ~ '^[0-9]+$';

  insert into public.households (id, legacy_code, display_name, guest_limit, side, kind)
  values (gen_random_uuid(), v_code, v_name, 1, v_side, v_kind)
  returning id into v_id;

  update public.members
  set household_id = v_id, is_primary = true
  where id = p_member_id;

  perform public.ensure_household_primary(v_source);
  return v_id;
end;
$fn$;

create or replace function public.admin_move_member(
  p_member_id uuid,
  p_household_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_source uuid;
  v_remaining integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select household_id into v_source from public.members where id = p_member_id;
  if not found then
    raise exception 'missing_member';
  end if;
  if v_source = p_household_id then
    raise exception 'same_household';
  end if;
  if not exists (select 1 from public.households where id = p_household_id) then
    raise exception 'missing_household';
  end if;

  select count(*) - 1 into v_remaining from public.members where household_id = v_source;
  if v_remaining = 0 and (
    exists (select 1 from public.contributions where household_id = v_source)
    or exists (select 1 from public.tour_reservations where household_id = v_source)
  ) then
    raise exception 'has_payments';
  end if;

  update public.members
  set household_id = p_household_id,
      is_primary = is_primary and not exists (
        select 1 from public.members destination
        where destination.household_id = p_household_id and destination.is_primary
      )
  where id = p_member_id;

  if v_remaining = 0 then
    if exists (select 1 from public.rsvps where household_id = p_household_id) then
      delete from public.rsvps where household_id = v_source;
    else
      update public.rsvps set household_id = p_household_id where household_id = v_source;
    end if;
    delete from public.households where id = v_source;
  else
    perform public.ensure_household_primary(v_source);
  end if;

  perform public.ensure_household_primary(p_household_id);
  return p_household_id;
end;
$fn$;

select public.ensure_household_primary(id) from public.households;

notify pgrst, 'reload schema';
