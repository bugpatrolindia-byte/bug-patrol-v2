create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  customer_type text not null default 'Other' check (customer_type in ('Hotel', 'Cafe', 'Other')),
  address text not null,
  contact_person text,
  phone text,
  email text,
  location_url text,
  visit_frequency text not null default 'Monthly' check (visit_frequency in ('Monthly', 'Twice per month', 'Three times per month', 'Custom')),
  custom_schedule text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;

create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop policy if exists "Admins can manage customers" on public.customers;

create policy "Admins can manage customers"
on public.customers
for all
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  job_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;

drop trigger if exists staff_profiles_set_updated_at on public.staff_profiles;

create trigger staff_profiles_set_updated_at
before update on public.staff_profiles
for each row
execute function public.set_updated_at();

drop policy if exists "Admins can manage staff profiles" on public.staff_profiles;

create policy "Admins can manage staff profiles"
on public.staff_profiles
for all
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Staff can read own profile" on public.staff_profiles;

create policy "Staff can read own profile"
on public.staff_profiles
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  and auth_user_id = auth.uid()
);

alter table public.customers
add column if not exists assigned_staff_id uuid references public.staff_profiles(id) on delete set null;

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  staff_id uuid references public.staff_profiles(id) on delete set null,
  scheduled_date date not null,
  scheduled_time time not null,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'In Progress', 'Completed')),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists visits_staff_schedule_slot_unique
on public.visits (staff_id, scheduled_date, scheduled_time)
where staff_id is not null;

alter table public.visits enable row level security;

drop trigger if exists visits_set_updated_at on public.visits;

create trigger visits_set_updated_at
before update on public.visits
for each row
execute function public.set_updated_at();

drop policy if exists "Admins can manage visits" on public.visits;

create policy "Admins can manage visits"
on public.visits
for all
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Staff can read assigned visits" on public.visits;

create policy "Staff can read assigned visits"
on public.visits
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  and exists (
    select 1
    from public.staff_profiles
    where staff_profiles.id = visits.staff_id
      and staff_profiles.auth_user_id = auth.uid()
      and staff_profiles.is_active = true
  )
);

drop policy if exists "Staff can update assigned visit status" on public.visits;

create policy "Staff can update assigned visit status"
on public.visits
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  and exists (
    select 1
    from public.staff_profiles
    where staff_profiles.id = visits.staff_id
      and staff_profiles.auth_user_id = auth.uid()
      and staff_profiles.is_active = true
  )
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  and exists (
    select 1
    from public.staff_profiles
    where staff_profiles.id = visits.staff_id
      and staff_profiles.auth_user_id = auth.uid()
      and staff_profiles.is_active = true
  )
);

drop policy if exists "Staff can read assigned customers" on public.customers;

create policy "Staff can read assigned customers"
on public.customers
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  and exists (
    select 1
    from public.staff_profiles
    where staff_profiles.auth_user_id = auth.uid()
      and staff_profiles.is_active = true
      and (
        staff_profiles.id = customers.assigned_staff_id
        or exists (
          select 1
          from public.visits
          where visits.customer_id = customers.id
            and visits.staff_id = staff_profiles.id
        )
      )
  )
);

create table if not exists public.chemicals (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null default 'ml',
  stock_quantity numeric(12, 2) not null default 0 check (stock_quantity >= 0),
  low_stock_threshold numeric(12, 2) not null default 0 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chemicals enable row level security;

drop trigger if exists chemicals_set_updated_at on public.chemicals;

create trigger chemicals_set_updated_at
before update on public.chemicals
for each row
execute function public.set_updated_at();

drop policy if exists "Admins can manage chemicals" on public.chemicals;

create policy "Admins can manage chemicals"
on public.chemicals
for all
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Staff can read active chemicals" on public.chemicals;

create policy "Staff can read active chemicals"
on public.chemicals
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  and is_active = true
);

create table if not exists public.visit_chemical_usages (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  chemical_id uuid not null references public.chemicals(id) on delete restrict,
  quantity_used numeric(12, 2) not null check (quantity_used > 0),
  created_at timestamptz not null default now()
);

alter table public.visit_chemical_usages enable row level security;

drop policy if exists "Admins can read chemical usage" on public.visit_chemical_usages;

create policy "Admins can read chemical usage"
on public.visit_chemical_usages
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Staff can read own chemical usage" on public.visit_chemical_usages;

create policy "Staff can read own chemical usage"
on public.visit_chemical_usages
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
  and exists (
    select 1
    from public.visits
    join public.staff_profiles on staff_profiles.id = visits.staff_id
    where visits.id = visit_chemical_usages.visit_id
      and staff_profiles.auth_user_id = auth.uid()
      and staff_profiles.is_active = true
  )
);

create or replace function public.complete_assigned_visit(
  visit_id_to_complete uuid,
  chemical_id_used uuid,
  quantity_used_value numeric,
  completion_remarks text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_visit public.visits%rowtype;
  selected_chemical public.chemicals%rowtype;
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') <> 'staff' then
    raise exception 'Only staff can complete assigned visits.';
  end if;

  if quantity_used_value is null or quantity_used_value <= 0 then
    raise exception 'Quantity used must be greater than zero.';
  end if;

  select visits.*
  into assigned_visit
  from public.visits
  join public.staff_profiles on staff_profiles.id = visits.staff_id
  where visits.id = visit_id_to_complete
    and staff_profiles.auth_user_id = auth.uid()
    and staff_profiles.is_active = true
  for update;

  if not found then
    raise exception 'Assigned visit was not found for this staff user.';
  end if;

  if assigned_visit.status = 'Completed' then
    raise exception 'This visit is already completed.';
  end if;

  select *
  into selected_chemical
  from public.chemicals
  where id = chemical_id_used
    and is_active = true
  for update;

  if not found then
    raise exception 'Active chemical was not found.';
  end if;

  if selected_chemical.stock_quantity < quantity_used_value then
    raise exception 'Not enough stock available for %. Available: % %.',
      selected_chemical.name,
      selected_chemical.stock_quantity,
      selected_chemical.unit;
  end if;

  insert into public.visit_chemical_usages (visit_id, chemical_id, quantity_used)
  values (visit_id_to_complete, chemical_id_used, quantity_used_value);

  update public.chemicals
  set stock_quantity = stock_quantity - quantity_used_value
  where id = chemical_id_used;

  update public.visits
  set status = 'Completed',
      remarks = nullif(trim(completion_remarks), '')
  where id = visit_id_to_complete;
end;
$$;

grant execute on function public.complete_assigned_visit(uuid, uuid, numeric, text) to authenticated;
