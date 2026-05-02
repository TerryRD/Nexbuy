-- Customer profile extension table.
-- PK = auth.users.id (one-to-one), so joining auth.users gives email; we
-- only store profile data not already in auth (display_name, phone, opt-in).
-- Admin users also get a row created — harmless, they just never visit /account.

set search_path = public;

create table customers (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  phone text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_phone_idx on customers(phone) where phone is not null;

-- Reuse the project-wide set_updated_at() function defined in 20260419000000_init.sql
create trigger customers_updated_at before update on customers
  for each row execute function set_updated_at();

-- Auto-create a customer profile when an auth user is created. Pulls
-- display_name from Google OAuth's full_name / name claim, or falls back to
-- the email local-part for password signups.
create or replace function public.handle_new_customer()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.customers (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_customer
after insert on auth.users
for each row execute function public.handle_new_customer();

-- Backfill existing auth users (admin accounts created manually).
insert into public.customers (id)
select id from auth.users
on conflict (id) do nothing;

-- RLS — owner reads / updates self; admin sees all.
alter table customers enable row level security;

create policy customers_self_read on customers
  for select using (auth.uid() = id or is_admin());

create policy customers_self_update on customers
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy customers_admin_update on customers
  for update using (is_admin()) with check (is_admin());

-- INSERT / DELETE not exposed via RLS — handled by trigger and cascade.
