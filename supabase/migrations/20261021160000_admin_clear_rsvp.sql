-- An admin can erase a household reply so those guests must fill the form again.

create or replace function public.admin_clear_rsvp(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select 1 from public.households where id = p_household_id) then
    raise exception 'missing_household';
  end if;
  delete from public.rsvps where household_id = p_household_id;
end;
$fn$;

revoke all on function public.admin_clear_rsvp(uuid) from public, anon;
grant execute on function public.admin_clear_rsvp(uuid) to authenticated;

notify pgrst, 'reload schema';
