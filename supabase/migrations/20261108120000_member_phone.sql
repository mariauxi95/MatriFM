-- A phone number per person, optional like email. Stored as digits only, with the
-- country code and no "+" (for example 56961928909), so it can go straight into wa.me links.
-- The numbers themselves are loaded outside git (see scripts/phones-to-sql.mjs).

alter table public.members
  add column if not exists phone text;

alter table public.members
  drop constraint if exists members_phone_format;
alter table public.members
  add constraint members_phone_format check (phone is null or phone ~ '^[0-9]{7,15}$');

create or replace function public.admin_set_member_phone(p_id uuid, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if v_phone = '' then
    v_phone := null;
  elsif length(v_phone) < 7 or length(v_phone) > 15 then
    raise exception 'bad_phone';
  end if;

  update public.members set phone = v_phone where id = p_id;
  if not found then
    raise exception 'missing_member';
  end if;
end;
$fn$;

revoke all on function public.admin_set_member_phone(uuid, text) from public, anon;
grant execute on function public.admin_set_member_phone(uuid, text) to authenticated;

notify pgrst, 'reload schema';
