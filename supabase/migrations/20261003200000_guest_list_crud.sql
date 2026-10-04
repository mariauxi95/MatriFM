-- Empty "Invitado" placeholders have no name, email, reply, or payment.
delete from public.households h
where h.display_name = 'Invitado'
  and not exists (
    select 1
    from public.members m
    where m.household_id = h.id
      and (
        m.email is not null
        or m.auth_user_id is not null
        or m.full_name is distinct from 'Invitado'
      )
  )
  and not exists (select 1 from public.rsvps r where r.household_id = h.id)
  and not exists (select 1 from public.contributions c where c.household_id = h.id)
  and not exists (select 1 from public.tour_reservations t where t.household_id = h.id)
  and not exists (select 1 from public.activity_signups a where a.household_id = h.id)
  and not exists (select 1 from public.club_messages c where c.household_id = h.id);

create or replace function public.admin_add_member(
  p_household_id uuid,
  p_full_name text,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if length(trim(coalesce(p_full_name, ''))) = 0 then
    raise exception 'name_required';
  end if;
  if not exists (select 1 from public.households where id = p_household_id) then
    raise exception 'missing_household';
  end if;
  if v_email <> '' and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;

  insert into public.members (id, household_id, full_name, email)
  values (gen_random_uuid(), p_household_id, trim(p_full_name), nullif(v_email, ''))
  returning id into v_id;
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

  insert into public.members (id, household_id, full_name, email)
  values (gen_random_uuid(), v_id, v_person, nullif(v_email, ''));

  return v_id;
end;
$fn$;

create or replace function public.admin_delete_household(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_auth uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select 1 from public.households where id = p_id) then
    raise exception 'missing_household';
  end if;
  if exists (select 1 from public.contributions where household_id = p_id)
    or exists (select 1 from public.tour_reservations where household_id = p_id) then
    raise exception 'has_payments';
  end if;

  for v_auth in
    select auth_user_id from public.members where household_id = p_id and auth_user_id is not null
  loop
    delete from auth.users where id = v_auth;
  end loop;

  delete from public.households where id = p_id;
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

  update public.members set household_id = p_household_id where id = p_member_id;

  if v_remaining = 0 then
    if exists (select 1 from public.rsvps where household_id = p_household_id) then
      delete from public.rsvps where household_id = v_source;
    else
      update public.rsvps set household_id = p_household_id where household_id = v_source;
    end if;
    delete from public.households where id = v_source;
  end if;

  return p_household_id;
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

  update public.members set household_id = v_id where id = p_member_id;
  return v_id;
end;
$fn$;

revoke all on function public.admin_add_member(uuid, text, text) from public, anon;
revoke all on function public.admin_create_household(text, text, text, integer, text, text) from public, anon;
revoke all on function public.admin_delete_household(uuid) from public, anon;
revoke all on function public.admin_move_member(uuid, uuid) from public, anon;
revoke all on function public.admin_split_member(uuid) from public, anon;

grant execute on function public.admin_add_member(uuid, text, text) to authenticated;
grant execute on function public.admin_create_household(text, text, text, integer, text, text) to authenticated;
grant execute on function public.admin_delete_household(uuid) to authenticated;
grant execute on function public.admin_move_member(uuid, uuid) to authenticated;
grant execute on function public.admin_split_member(uuid) to authenticated;

notify pgrst, 'reload schema';
