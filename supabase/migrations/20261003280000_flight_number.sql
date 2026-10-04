-- Keep the flight number on the leg into Santa Marta.

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
    'to', case when public.json_bool(p_leg, 'booked') is true then public.clip_text(p_leg ->> 'to', 80) else '' end,
    'number', case when public.json_bool(p_leg, 'booked') is true then public.clip_text(p_leg ->> 'number', 20) else '' end
  )
$fn$;

revoke all on function public.plan_leg(jsonb) from public, anon;

notify pgrst, 'reload schema';
