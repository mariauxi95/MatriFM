-- Admins can record or change a household reply, including guests who
-- have not answered yet, and can clear it back to no reply.

create or replace function public.admin_save_rsvp(
  p_household_id uuid,
  p_status text,
  p_people jsonb,
  p_children jsonb,
  p_dance_song text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_code text;
  v_name text;
  v_people jsonb := coalesce(p_people, '[]'::jsonb);
  v_children jsonb := coalesce(p_children, '[]'::jsonb);
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_status not in ('waiting', 'coming', 'declined') then
    raise exception 'bad_status';
  end if;
  if jsonb_typeof(v_people) <> 'array' or jsonb_typeof(v_children) <> 'array' then
    raise exception 'bad_reply';
  end if;

  select legacy_code, display_name
  into v_code, v_name
  from public.households
  where id = p_household_id;
  if not found then
    raise exception 'missing_household';
  end if;

  if p_status = 'waiting' then
    delete from public.rsvps where household_id = p_household_id;
    return;
  end if;

  if p_status = 'coming' and jsonb_array_length(v_people) = 0 then
    raise exception 'name_required';
  end if;

  insert into public.rsvps (
    household_id,
    legacy_code,
    display_name,
    attending,
    people,
    children,
    dance_song,
    message,
    updated_at
  )
  values (
    p_household_id,
    v_code,
    v_name,
    p_status = 'coming',
    v_people,
    v_children,
    coalesce(p_dance_song, ''),
    coalesce(p_message, ''),
    now()
  )
  on conflict (household_id) do update
  set attending = excluded.attending,
      people = excluded.people,
      children = excluded.children,
      dance_song = excluded.dance_song,
      message = excluded.message,
      display_name = excluded.display_name,
      legacy_code = excluded.legacy_code,
      updated_at = now();
end;
$fn$;

revoke all on function public.admin_save_rsvp(uuid, text, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.admin_save_rsvp(uuid, text, jsonb, jsonb, text, text) to authenticated;

notify pgrst, 'reload schema';
