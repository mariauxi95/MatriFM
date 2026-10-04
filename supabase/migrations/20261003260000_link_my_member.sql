-- Link the signed-in guest to their household member on every login, not only the first signup.

create or replace function public.link_my_member()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text;
begin
  if auth.uid() is null then
    return;
  end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null or v_email = '' then
    return;
  end if;
  update public.members
  set auth_user_id = auth.uid()
  where lower(email) = v_email
    and (auth_user_id is null or auth_user_id = auth.uid());
end;
$fn$;

revoke all on function public.link_my_member() from public, anon;
grant execute on function public.link_my_member() to authenticated;

notify pgrst, 'reload schema';
