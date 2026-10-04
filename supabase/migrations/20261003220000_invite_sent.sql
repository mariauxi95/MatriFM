alter table public.households
  add column if not exists invite_sent_at timestamptz;

create or replace function public.admin_set_invite_sent(
  p_id uuid,
  p_sent boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.households
  set invite_sent_at = case when p_sent then coalesce(invite_sent_at, now()) else null end
  where id = p_id;
  if not found then
    raise exception 'missing_household';
  end if;
end;
$fn$;

revoke all on function public.admin_set_invite_sent(uuid, boolean) from public, anon;
grant execute on function public.admin_set_invite_sent(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
