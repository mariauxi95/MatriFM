-- Gifts: round USD values, count pending gifts on the website, and stop guests from
-- choosing their own USD value or status.
--
-- 1. gift_usd_value(): what a gift counts for in US$.
--      USD gifts count at face value.
--      A suggested amount in another currency maps to its round US$ tier (210 CAD -> 150).
--      Any other amount is converted at the configured rate and rounded: nearest 5 below
--      US$100, nearest 10 from US$100, never under 5.
--    The preset table below must match GIFT_PRESETS in src/lib/money.ts. The EUR rate is not
--    stored in payment_settings, so 0.92 is used, same as the app's default.
-- 2. contributions_guard(): the browser used to send amount_usd_normalized and status itself.
--    Now that pending gifts show on the website, that would let any guest type any total.
--    For everyone except admins, the USD value and rate are recomputed here and the status is
--    forced to pending. Admins keep full control through admin_register_contribution.
-- 3. confirmed_gift_totals() now counts pending and confirmed gifts (cancelled ones drop out).
--    The name is kept so the site keeps working; it feeds the progress bars.

create or replace function public.gift_rate(p_currency text)
returns numeric
language sql
stable
security definer
set search_path = public
as $fn$
  select case p_currency
    when 'USD' then 1::numeric
    when 'EUR' then 0.92::numeric
    when 'CLP' then (select usd_to_clp from public.payment_settings where id = 1)
    when 'CAD' then (select usd_to_cad from public.payment_settings where id = 1)
  end
$fn$;

create or replace function public.gift_usd_value(p_amount numeric, p_currency text)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_usd numeric;
  v_rate numeric;
  v_step numeric;
begin
  if p_amount is null or p_amount <= 0 then
    return 0;
  end if;
  if p_currency = 'USD' then
    return p_amount;
  end if;

  select t.usd
  into v_usd
  from (
    values
      ('CAD', 70, 50), ('CAD', 140, 100), ('CAD', 210, 150), ('CAD', 280, 200),
      ('CLP', 50000, 50), ('CLP', 100000, 100), ('CLP', 150000, 150), ('CLP', 200000, 200),
      ('EUR', 50, 50), ('EUR', 90, 100), ('EUR', 140, 150), ('EUR', 180, 200)
  ) as t (cur, local_amount, usd)
  where t.cur = p_currency and t.local_amount = p_amount;
  if found then
    return v_usd;
  end if;

  v_rate := public.gift_rate(p_currency);
  if v_rate is null or v_rate <= 0 then
    raise exception 'bad_currency';
  end if;
  v_usd := p_amount / v_rate;
  v_step := case when v_usd >= 100 then 10 else 5 end;
  return greatest(5, round(v_usd / v_step) * v_step);
end;
$fn$;

create or replace function public.contributions_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.amount_original is null or new.amount_original <= 0 then
    raise exception 'bad_amount';
  end if;
  if new.currency_original not in ('USD', 'CLP', 'CAD', 'EUR') then
    raise exception 'bad_currency';
  end if;
  new.amount_usd_normalized := public.gift_usd_value(new.amount_original, new.currency_original);
  new.fx_rate_used := public.gift_rate(new.currency_original);
  if new.amount_usd_normalized > 10000 then
    raise exception 'bad_amount';
  end if;
  new.status := 'pending';
  new.confirmed_at := null;
  return new;
end;
$fn$;

drop trigger if exists contributions_guard on public.contributions;
create trigger contributions_guard
  before insert on public.contributions
  for each row
  execute function public.contributions_guard();

create or replace function public.confirmed_gift_totals()
returns table (gift_id text, confirmed_usd numeric)
language sql
stable
security definer
set search_path = public
as $fn$
  select c.gift_id, coalesce(sum(c.amount_usd_normalized), 0)::numeric
  from public.contributions c
  where c.status in ('pending', 'confirmed')
  group by c.gift_id
$fn$;

revoke all on function public.gift_rate(text) from public, anon, authenticated;
revoke all on function public.gift_usd_value(numeric, text) from public, anon, authenticated;
revoke all on function public.contributions_guard() from public, anon, authenticated;

-- Existing gifts follow the same rule (the one gift so far was 210 CAD, stored as 152.17).
update public.contributions c
set amount_usd_normalized = public.gift_usd_value(c.amount_original, c.currency_original)
where c.status <> 'cancelled';

notify pgrst, 'reload schema';
