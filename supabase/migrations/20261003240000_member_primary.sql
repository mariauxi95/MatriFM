alter table public.members
  add column if not exists is_primary boolean not null default false;

create unique index if not exists members_one_primary_per_household
  on public.members (household_id)
  where is_primary;

create or replace function public.admin_set_primary_member(
  p_id uuid,
  p_primary boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_household uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select household_id into v_household from public.members where id = p_id;
  if not found then
    raise exception 'missing_member';
  end if;

  if p_primary then
    update public.members set is_primary = false where household_id = v_household;
    update public.members set is_primary = true where id = p_id;
  else
    update public.members set is_primary = false where id = p_id;
  end if;
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
  end if;

  return p_household_id;
end;
$fn$;

revoke all on function public.admin_set_primary_member(uuid, boolean) from public, anon;
grant execute on function public.admin_set_primary_member(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
