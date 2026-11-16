-- Staff roles and "last reminder sent".
--
-- app_admins.role:
--   admin    full access (what every row had until now)
--   planner  read-only view of the guest list, replies, tours and activities, without
--            guest emails and without anything about gifts; she can only log reminders.
--
-- is_admin() stays "full admin" so every existing write policy and admin_* function keeps
-- refusing the planner. Who is in app_admins is data, loaded through the SQL Editor, not git.

alter table public.app_admins
  add column if not exists role text not null default 'admin',
  add column if not exists name text;

alter table public.app_admins drop constraint if exists app_admins_role_check;
alter table public.app_admins
  add constraint app_admins_role_check check (role in ('admin', 'planner'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.app_admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid() and a.role = 'admin'
  )
$fn$;

create or replace function public.is_planner()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.app_admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid() and a.role = 'planner'
  )
$fn$;

create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select a.role
  from public.app_admins a
  join auth.users u on lower(u.email) = lower(a.email)
  where u.id = auth.uid()
  limit 1
$fn$;

create or replace function public.staff_name()
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(nullif(trim(a.name), ''), split_part(a.email, '@', 1))
  from public.app_admins a
  join auth.users u on lower(u.email) = lower(a.email)
  where u.id = auth.uid()
  limit 1
$fn$;

-- The planner reads these tables directly. Emails live in members and tour_reservations,
-- and column-level hiding is impossible with row policies, so those two go through the
-- functions below instead and get no planner policy. Contributions get none either.
drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated
  using (id = public.my_household_id() or public.is_admin() or public.is_planner());

drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps
  for select to authenticated
  using (household_id = public.my_household_id() or public.is_admin() or public.is_planner());

drop policy if exists activities_select on public.activity_signups;
create policy activities_select on public.activity_signups
  for select to authenticated
  using (household_id = public.my_household_id() or public.is_admin() or public.is_planner());

create or replace function public.planner_members()
returns table (
  id uuid,
  household_id uuid,
  full_name text,
  phone text,
  age_group text,
  is_primary boolean
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if not (public.is_admin() or public.is_planner()) then
    raise exception 'not_staff';
  end if;
  return query
    select m.id, m.household_id, m.full_name, m.phone, m.age_group, m.is_primary
    from public.members m;
end;
$fn$;

create or replace function public.planner_tours()
returns table (
  id uuid,
  household_id uuid,
  guest_name text,
  tour_id text,
  tour_name text,
  tour_date text,
  quantity integer,
  children_count integer,
  price_per_person numeric,
  total_amount numeric,
  registration_date timestamptz,
  payment_status text,
  payment_link text
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if not (public.is_admin() or public.is_planner()) then
    raise exception 'not_staff';
  end if;
  return query
    select t.id, t.household_id, t.guest_name, t.tour_id, t.tour_name, t.tour_date,
           t.quantity, t.children_count, t.price_per_person, t.total_amount,
           t.registration_date, t.payment_status, t.payment_link
    from public.tour_reservations t;
end;
$fn$;

-- Last reminder: one row per invitation, with who sent it. Admins and the planner can log it.
alter table public.households
  add column if not exists last_reminder_at timestamptz,
  add column if not exists last_reminder_by text;

create or replace function public.admin_log_reminder(p_household_ids uuid[], p_at timestamptz default null)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not (public.is_admin() or public.is_planner()) then
    raise exception 'not_staff';
  end if;
  if p_household_ids is null or cardinality(p_household_ids) = 0 then
    return;
  end if;
  if p_at is not null and p_at > now() + interval '1 hour' then
    raise exception 'future_date';
  end if;
  update public.households
  set last_reminder_at = coalesce(p_at, now()),
      last_reminder_by = public.staff_name()
  where id = any (p_household_ids);
end;
$fn$;

create or replace function public.admin_clear_reminder(p_household_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not (public.is_admin() or public.is_planner()) then
    raise exception 'not_staff';
  end if;
  update public.households
  set last_reminder_at = null,
      last_reminder_by = null
  where id = any (p_household_ids);
end;
$fn$;

revoke all on function public.is_planner() from public, anon;
revoke all on function public.staff_role() from public, anon;
revoke all on function public.staff_name() from public, anon, authenticated;
revoke all on function public.planner_members() from public, anon;
revoke all on function public.planner_tours() from public, anon;
revoke all on function public.admin_log_reminder(uuid[], timestamptz) from public, anon;
revoke all on function public.admin_clear_reminder(uuid[]) from public, anon;
grant execute on function public.is_planner() to authenticated;
grant execute on function public.staff_role() to authenticated;
grant execute on function public.planner_members() to authenticated;
grant execute on function public.planner_tours() to authenticated;
grant execute on function public.admin_log_reminder(uuid[], timestamptz) to authenticated;
grant execute on function public.admin_clear_reminder(uuid[]) to authenticated;

notify pgrst, 'reload schema';
