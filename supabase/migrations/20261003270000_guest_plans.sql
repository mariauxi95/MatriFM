-- Plans the household fills in after they sign in: flights, lodging dates, early arrival, late stay.
-- Also lets them set an email on a member who has not signed in yet.

alter table public.households
  add column if not exists guest_plans jsonb not null default '{}'::jsonb;

create or replace function public.json_bool(p_obj jsonb, p_key text)
returns boolean
language sql
immutable
as $fn$
  select case
    when p_obj is null or jsonb_typeof(p_obj -> p_key) is distinct from 'boolean' then null
    else (p_obj ->> p_key)::boolean
  end
$fn$;

create or replace function public.clip_text(p_value text, p_max integer)
returns text
language sql
immutable
as $fn$
  select left(regexp_replace(trim(coalesce(p_value, '')), '[[:cntrl:]]', '', 'g'), greatest(p_max, 0))
$fn$;

create or replace function public.clip_date(p_value text)
returns text
language plpgsql
immutable
as $fn$
declare
  v text := public.clip_text(p_value, 10);
begin
  if v = '' or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return '';
  end if;
  perform v::date;
  return v;
exception
  when others then
    return '';
end;
$fn$;

create or replace function public.clip_time(p_value text)
returns text
language sql
immutable
as $fn$
  select case
    when public.clip_text(p_value, 5) ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then public.clip_text(p_value, 5)
    else ''
  end
$fn$;

create or replace function public.plan_leg(p_leg jsonb)
returns jsonb
language sql
immutable
as $fn$
  select jsonb_build_object(
    'booked', public.json_bool(p_leg, 'booked'),
    'date', case when public.json_bool(p_leg, 'booked') is true then public.clip_date(p_leg ->> 'date') else '' end,
    'time', case when public.json_bool(p_leg, 'booked') is true then public.clip_time(p_leg ->> 'time') else '' end,
    'from', case when public.json_bool(p_leg, 'booked') is true then public.clip_text(p_leg ->> 'from', 80) else '' end,
    'to', case when public.json_bool(p_leg, 'booked') is true then public.clip_text(p_leg ->> 'to', 80) else '' end
  )
$fn$;

create or replace function public.plan_extra(p_extra jsonb)
returns jsonb
language sql
immutable
as $fn$
  select jsonb_build_object(
    'yes', public.json_bool(p_extra, 'yes'),
    'date', case when public.json_bool(p_extra, 'yes') is true then public.clip_date(p_extra ->> 'date') else '' end
  )
$fn$;

create or replace function public.plan_stay(p_stay jsonb)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_reserved boolean := public.json_bool(p_stay, 'reserved');
  v_place text := public.clip_text(p_stay ->> 'place', 40);
begin
  if v_place not in ('bohemia', 'gaelia', 'blue-mango', 'iwana', 'cayena', 'otro', 'blue_mango_hut', 'blue_mango_suite') then
    v_place := '';
  end if;
  if v_reserved is not true then
    return jsonb_build_object(
      'reserved', v_reserved,
      'place', '',
      'other', '',
      'checkIn', '',
      'checkInTime', '',
      'checkOut', '',
      'checkOutTime', ''
    );
  end if;
  return jsonb_build_object(
    'reserved', true,
    'place', v_place,
    'other', case when v_place = 'otro' then public.clip_text(p_stay ->> 'other', 80) else '' end,
    'checkIn', public.clip_date(p_stay ->> 'checkIn'),
    'checkInTime', public.clip_time(p_stay ->> 'checkInTime'),
    'checkOut', public.clip_date(p_stay ->> 'checkOut'),
    'checkOutTime', public.clip_time(p_stay ->> 'checkOutTime')
  );
end;
$fn$;

create or replace function public.save_my_plans(p_plans jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_id uuid := public.my_household_id();
  v_clean jsonb;
begin
  if v_id is null then
    raise exception 'no_household';
  end if;
  if p_plans is null or jsonb_typeof(p_plans) <> 'object' then
    raise exception 'bad_plans';
  end if;
  v_clean := jsonb_build_object(
    'arrival', public.plan_leg(p_plans -> 'arrival'),
    'departure', public.plan_leg(p_plans -> 'departure'),
    'stay', public.plan_stay(p_plans -> 'stay'),
    'before', public.plan_extra(p_plans -> 'before'),
    'after', public.plan_extra(p_plans -> 'after')
  );
  update public.households
  set guest_plans = v_clean
  where id = v_id;
  return v_clean;
end;
$fn$;

create or replace function public.save_my_member_email(p_member_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_house uuid := public.my_household_id();
  v_member public.members%rowtype;
  v_email text := lower(public.clip_text(p_email, 160));
begin
  if v_house is null then
    raise exception 'no_household';
  end if;
  select * into v_member from public.members where id = p_member_id;
  if not found or v_member.household_id is distinct from v_house then
    raise exception 'not_yours';
  end if;
  if v_member.auth_user_id is not null then
    if v_email is distinct from lower(coalesce(v_member.email, '')) then
      raise exception 'email_locked';
    end if;
    return v_member.email;
  end if;
  if v_email = '' then
    update public.members set email = null where id = p_member_id;
    return null;
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;
  if exists (
    select 1 from public.members where lower(email) = v_email and id <> p_member_id
  ) then
    raise exception 'email_taken';
  end if;
  update public.members set email = v_email where id = p_member_id;
  return v_email;
end;
$fn$;

revoke all on function public.json_bool(jsonb, text) from public, anon;
revoke all on function public.clip_text(text, integer) from public, anon;
revoke all on function public.clip_date(text) from public, anon;
revoke all on function public.clip_time(text) from public, anon;
revoke all on function public.plan_leg(jsonb) from public, anon;
revoke all on function public.plan_extra(jsonb) from public, anon;
revoke all on function public.plan_stay(jsonb) from public, anon;
revoke all on function public.save_my_plans(jsonb) from public, anon;
revoke all on function public.save_my_member_email(uuid, text) from public, anon;

grant execute on function public.save_my_plans(jsonb) to authenticated;
grant execute on function public.save_my_member_email(uuid, text) to authenticated;

notify pgrst, 'reload schema';
