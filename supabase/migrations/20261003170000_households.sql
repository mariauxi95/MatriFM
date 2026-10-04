-- Households are the invitation. Members are the people who can sign in.
-- A household of one is still a household, so RSVPs and gifts always attach to the same kind of row.

create table public.app_admins (
  email text primary key
);

create table public.households (
  id uuid primary key,
  legacy_code text not null unique,
  display_name text not null,
  guest_limit integer not null default 1 check (guest_limit >= 1),
  has_children boolean not null default false,
  children_limit integer not null default 0 check (children_limit >= 0),
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  email text,
  full_name text not null,
  auth_user_id uuid,
  created_at timestamptz not null default now(),
  constraint members_email_shape check (
    email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create unique index members_email_unique on public.members (lower(email));
create unique index members_auth_user_unique on public.members (auth_user_id) where auth_user_id is not null;
create index members_household_idx on public.members (household_id);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households (id) on delete cascade,
  legacy_code text not null,
  display_name text not null,
  attending boolean not null,
  people jsonb not null default '[]'::jsonb,
  children jsonb not null default '[]'::jsonb,
  dance_song text not null default '',
  message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete set null,
  gift_id text not null,
  guest_name text not null,
  email text not null default '',
  amount_original numeric not null,
  currency_original text not null,
  fx_rate_used numeric not null,
  amount_usd_normalized numeric not null,
  method text not null,
  dedication text not null default '',
  anonymous boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index contributions_household_idx on public.contributions (household_id);

create table public.tour_reservations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete set null,
  guest_name text not null,
  email text not null,
  tour_id text not null,
  tour_name text not null,
  tour_date text not null,
  quantity integer not null,
  children_count integer not null default 0,
  price_per_person numeric not null,
  total_amount numeric not null,
  registration_date timestamptz not null default now(),
  payment_status text not null default 'Pendiente' check (payment_status in ('Pendiente', 'Pagado')),
  payment_link text not null default ''
);

create index tour_reservations_household_idx on public.tour_reservations (household_id);

create table public.activity_signups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  guest_name text not null,
  activity_key text not null,
  activity_name text not null,
  time text not null,
  quantity integer not null check (quantity >= 1),
  created_at timestamptz not null default now(),
  unique (household_id, activity_key)
);

create table public.club_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete set null,
  legacy_code text not null default '',
  display_name text not null,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.payment_settings (
  id integer primary key default 1 check (id = 1),
  clp_name text not null default '',
  clp_rut text not null default '',
  clp_bank text not null default '',
  clp_account_type text not null default '',
  clp_account_number text not null default '',
  clp_email text not null default '',
  interac_name text not null default '',
  interac_email text not null default '',
  interac_autodeposit boolean not null default true,
  zelle_name text not null default '',
  zelle_contact text not null default '',
  wise_link text not null default '',
  wise_email text not null default '',
  wise_qr text not null default '',
  usd_to_clp numeric not null default 950,
  usd_to_cad numeric not null default 1.38
);

insert into public.app_admins (email) values
  ('mariauxi95@gmail.com'),
  ('fernando@yanez.xyz');

insert into public.payment_settings (
  id, clp_name, clp_rut, clp_bank, clp_account_type, clp_account_number, clp_email,
  interac_name, interac_email, interac_autodeposit,
  zelle_name, zelle_contact, wise_link, wise_email, wise_qr,
  usd_to_clp, usd_to_cad
) values (
  1, '{{CLP_ACCOUNT_NAME}}', '{{CLP_RUT}}', '{{CLP_BANK}}', '{{CLP_ACCOUNT_TYPE}}', '{{CLP_ACCOUNT_NUMBER}}', '{{CLP_EMAIL}}',
  'Fernando Yánez', 'yanezlfernando@gmail.com', true,
  'Fernando Yánez', 'yanezlfernando@gmail.com', '{{WISE_PAYMENT_LINK}}', 'yanezlfernando@gmail.com', '',
  950, 1.38
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.app_admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid()
  )
$fn$;

create or replace function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $fn$
  select household_id
  from public.members
  where auth_user_id = auth.uid()
  limit 1
$fn$;

create or replace function public.current_guest()
returns jsonb
language sql
stable
security definer
set search_path = public
as $fn$
  select jsonb_build_object(
    'id', h.legacy_code,
    'displayName', h.display_name,
    'fullName', m.full_name,
    'email', m.email,
    'guestLimit', h.guest_limit,
    'hasChildren', h.has_children,
    'childrenLimit', h.children_limit
  )
  from public.members m
  join public.households h on h.id = m.household_id
  where m.auth_user_id = auth.uid()
  limit 1
$fn$;

create or replace function public.confirmed_gift_totals()
returns table (gift_id text, confirmed_usd numeric)
language sql
stable
security definer
set search_path = public
as $fn$
  select c.gift_id, coalesce(sum(c.amount_usd_normalized), 0)::numeric
  from public.contributions c
  where c.status = 'confirmed'
  group by c.gift_id
$fn$;

create or replace function public.admin_update_household(
  p_id uuid,
  p_display_name text,
  p_guest_limit integer,
  p_has_children boolean,
  p_children_limit integer
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
  if length(trim(p_display_name)) = 0 then
    raise exception 'name_required';
  end if;
  update public.households
  set display_name = trim(p_display_name),
      guest_limit = greatest(1, p_guest_limit),
      has_children = p_has_children,
      children_limit = case when p_has_children then greatest(0, p_children_limit) else 0 end
  where id = p_id;
end;
$fn$;

create or replace function public.admin_update_member(
  p_id uuid,
  p_full_name text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(trim(p_email));
  v_auth uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if length(trim(p_full_name)) = 0 then
    raise exception 'name_required';
  end if;

  select auth_user_id into v_auth from public.members where id = p_id;
  if not found then
    raise exception 'missing_member';
  end if;

  if v_email = '' then
    if v_auth is not null then
      raise exception 'bad_email';
    end if;
    update public.members
    set full_name = trim(p_full_name),
        email = null
    where id = p_id;
    return;
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;

  update public.members
  set full_name = trim(p_full_name),
      email = v_email
  where id = p_id;

  if v_auth is not null then
    update auth.users
    set email = v_email,
        updated_at = now()
    where id = v_auth;

    update auth.identities
    set provider_id = v_email,
        email = v_email,
        identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
        updated_at = now()
    where user_id = v_auth and provider = 'email';
  end if;
end;
$fn$;

create or replace function public.admin_add_member(
  p_household_id uuid,
  p_full_name text,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if length(trim(p_full_name)) = 0 then
    raise exception 'name_required';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad_email';
  end if;
  if not exists (select 1 from public.households where id = p_household_id) then
    raise exception 'missing_household';
  end if;

  insert into public.members (id, household_id, full_name, email)
  values (gen_random_uuid(), p_household_id, trim(p_full_name), v_email)
  returning id into v_id;
  return v_id;
end;
$fn$;

create or replace function public.admin_remove_member(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_auth uuid;
  v_household uuid;
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select auth_user_id, household_id into v_auth, v_household
  from public.members
  where id = p_id;
  if not found then
    raise exception 'missing_member';
  end if;

  select count(*) into v_count from public.members where household_id = v_household;
  if v_count <= 1 then
    raise exception 'last_member';
  end if;

  delete from public.members where id = p_id;
  if v_auth is not null then
    delete from auth.users where id = v_auth;
  end if;
end;
$fn$;

create or replace function public.enforce_invited_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if exists (select 1 from public.members m where lower(m.email) = lower(new.email)) then
    return new;
  end if;
  if exists (select 1 from public.app_admins a where lower(a.email) = lower(new.email)) then
    return new;
  end if;
  raise exception 'not_invited';
end;
$fn$;

create or replace function public.link_member_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.members
  set auth_user_id = new.id
  where lower(email) = lower(new.email)
    and (auth_user_id is null or auth_user_id = new.id);
  return new;
end;
$fn$;

drop trigger if exists enforce_invited_email on auth.users;
create trigger enforce_invited_email
  before insert on auth.users
  for each row
  execute function public.enforce_invited_email();

drop trigger if exists link_member_on_signup on auth.users;
create trigger link_member_on_signup
  after insert on auth.users
  for each row
  execute function public.link_member_on_signup();

alter table public.app_admins enable row level security;
alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.rsvps enable row level security;
alter table public.contributions enable row level security;
alter table public.tour_reservations enable row level security;
alter table public.activity_signups enable row level security;
alter table public.club_messages enable row level security;
alter table public.payment_settings enable row level security;

grant select, insert, update, delete on
  public.app_admins,
  public.households,
  public.members,
  public.rsvps,
  public.contributions,
  public.tour_reservations,
  public.activity_signups,
  public.club_messages,
  public.payment_settings
to authenticated;

revoke all on
  public.app_admins,
  public.households,
  public.members,
  public.rsvps,
  public.contributions,
  public.tour_reservations,
  public.activity_signups,
  public.club_messages,
  public.payment_settings
from anon;

create policy households_select on public.households
  for select to authenticated
  using (id = public.my_household_id() or public.is_admin());

create policy members_select on public.members
  for select to authenticated
  using (household_id = public.my_household_id() or public.is_admin());

create policy rsvps_select on public.rsvps
  for select to authenticated
  using (household_id = public.my_household_id() or public.is_admin());

create policy rsvps_insert on public.rsvps
  for insert to authenticated
  with check (household_id = public.my_household_id());

create policy rsvps_update on public.rsvps
  for update to authenticated
  using (household_id = public.my_household_id() or public.is_admin())
  with check (household_id = public.my_household_id() or public.is_admin());

create policy contributions_select on public.contributions
  for select to authenticated
  using (household_id = public.my_household_id() or public.is_admin());

create policy contributions_insert on public.contributions
  for insert to authenticated
  with check (household_id = public.my_household_id());

create policy contributions_update on public.contributions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy tours_select on public.tour_reservations
  for select to authenticated
  using (household_id = public.my_household_id() or public.is_admin());

create policy tours_insert on public.tour_reservations
  for insert to authenticated
  with check (household_id = public.my_household_id());

create policy tours_update on public.tour_reservations
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy activities_select on public.activity_signups
  for select to authenticated
  using (household_id = public.my_household_id() or public.is_admin());

create policy activities_insert on public.activity_signups
  for insert to authenticated
  with check (household_id = public.my_household_id());

create policy activities_update on public.activity_signups
  for update to authenticated
  using (household_id = public.my_household_id() or public.is_admin())
  with check (household_id = public.my_household_id() or public.is_admin());

create policy club_select on public.club_messages
  for select to authenticated
  using (true);

create policy club_insert on public.club_messages
  for insert to authenticated
  with check (household_id = public.my_household_id());

create policy settings_select on public.payment_settings
  for select to authenticated
  using (true);

create policy settings_update on public.payment_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.my_household_id() from public, anon;
revoke execute on function public.current_guest() from public, anon;
revoke execute on function public.confirmed_gift_totals() from public, anon;
revoke execute on function public.admin_update_household(uuid, text, integer, boolean, integer) from public, anon;
revoke execute on function public.admin_update_member(uuid, text, text) from public, anon;
revoke execute on function public.admin_add_member(uuid, text, text) from public, anon;
revoke execute on function public.admin_remove_member(uuid) from public, anon;
revoke execute on function public.enforce_invited_email() from public, anon, authenticated;
revoke execute on function public.link_member_on_signup() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_household_id() to authenticated;
grant execute on function public.current_guest() to authenticated;
grant execute on function public.confirmed_gift_totals() to authenticated;
grant execute on function public.admin_update_household(uuid, text, integer, boolean, integer) to authenticated;
grant execute on function public.admin_update_member(uuid, text, text) to authenticated;
grant execute on function public.admin_add_member(uuid, text, text) to authenticated;
grant execute on function public.admin_remove_member(uuid) to authenticated;
grant execute on function public.enforce_invited_email() to supabase_auth_admin;
grant execute on function public.link_member_on_signup() to supabase_auth_admin;

notify pgrst, 'reload schema';
