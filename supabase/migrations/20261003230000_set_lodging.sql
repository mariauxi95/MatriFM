create or replace function public.admin_set_lodging(
  p_id uuid,
  p_lodging text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_lodging text := nullif(lower(trim(coalesce(p_lodging, ''))), '');
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if v_lodging is not null and v_lodging not in ('blue-mango', 'bohemia', 'cayena', 'gaelia', 'iwana') then
    raise exception 'bad_hotel';
  end if;
  update public.households
  set lodging = v_lodging
  where id = p_id;
  if not found then
    raise exception 'missing_household';
  end if;
end;
$fn$;

revoke all on function public.admin_set_lodging(uuid, text) from public, anon;
grant execute on function public.admin_set_lodging(uuid, text) to authenticated;

notify pgrst, 'reload schema';
