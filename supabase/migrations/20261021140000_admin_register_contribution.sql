-- Admins can record a gift that arrived without the guest form.

create or replace function public.admin_register_contribution(
  p_household_id uuid,
  p_gift_id text,
  p_guest_name text,
  p_email text,
  p_amount numeric,
  p_currency text,
  p_fx_rate numeric,
  p_amount_usd numeric,
  p_method text,
  p_dedication text,
  p_anonymous boolean,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_id uuid;
  v_name text := btrim(coalesce(p_guest_name, ''));
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_household_id is null or not exists (select 1 from public.households where id = p_household_id) then
    raise exception 'missing_household';
  end if;
  if v_name = '' then
    raise exception 'name_required';
  end if;
  if p_gift_id is null or btrim(p_gift_id) = '' then
    raise exception 'bad_gift';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'bad_amount';
  end if;
  if p_currency not in ('USD', 'CLP', 'CAD', 'EUR') then
    raise exception 'bad_currency';
  end if;
  if p_method not in ('clp', 'cad', 'zelle', 'wise', 'eur') then
    raise exception 'bad_method';
  end if;
  if (p_method = 'clp' and p_currency <> 'CLP')
    or (p_method = 'cad' and p_currency <> 'CAD')
    or (p_method = 'eur' and p_currency <> 'EUR')
    or (p_method in ('zelle', 'wise') and p_currency <> 'USD') then
    raise exception 'bad_method';
  end if;
  if p_fx_rate is null or p_fx_rate <= 0 or p_amount_usd is null or p_amount_usd < 0 then
    raise exception 'bad_amount';
  end if;
  if p_status not in ('pending', 'confirmed') then
    raise exception 'bad_status';
  end if;

  insert into public.contributions (
    household_id,
    gift_id,
    guest_name,
    email,
    amount_original,
    currency_original,
    fx_rate_used,
    amount_usd_normalized,
    method,
    dedication,
    anonymous,
    status,
    confirmed_at
  )
  values (
    p_household_id,
    btrim(p_gift_id),
    v_name,
    btrim(coalesce(p_email, '')),
    p_amount,
    p_currency,
    p_fx_rate,
    p_amount_usd,
    p_method,
    coalesce(p_dedication, ''),
    coalesce(p_anonymous, false),
    p_status,
    case when p_status = 'confirmed' then now() else null end
  )
  returning id into v_id;

  return v_id;
end;
$fn$;

revoke all on function public.admin_register_contribution(uuid, text, text, text, numeric, text, numeric, numeric, text, text, boolean, text) from public, anon;
grant execute on function public.admin_register_contribution(uuid, text, text, text, numeric, text, numeric, numeric, text, text, boolean, text) to authenticated;

notify pgrst, 'reload schema';
