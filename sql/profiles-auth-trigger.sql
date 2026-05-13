-- Profiles auto-create from Auth + backfill (run in Supabase SQL editor)
-- Table name used by app: public.profiles (columns: user_id, email, plan, …)
--
-- Prereq: unique constraint on profiles.user_id (Supabase + this app use onConflict: "user_id").
-- If missing:  create unique index if not exists profiles_user_id_uq on public.profiles (user_id);

-- Optional timestamps if your table doesn’t have them yet
alter table public.profiles
  add column if not exists created_at timestamptz default now();

alter table public.profiles
  add column if not exists updated_at timestamptz default now();

-- New auth users → profile row (plan default free; never downgrade plan on conflict)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles as p (user_id, email, plan, created_at, updated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    'free',
    now(),
    now()
  )
  on conflict (user_id) do update
    set
      email = coalesce(nullif(excluded.email, ''), p.email),
      updated_at = now();
  -- plan intentionally not updated — preserves admin/premium from Stripe / admins
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Backfill: auth users without a profile row (does not touch existing rows → admin safe)
insert into public.profiles (user_id, email, plan, created_at, updated_at)
select
  au.id,
  coalesce(au.email, ''),
  'free',
  now(),
  now()
from auth.users au
where not exists (
  select 1
  from public.profiles p
  where p.user_id = au.id
);

comment on function public.handle_new_user() is 'Ensures public.profiles row for every new auth.users row; conflict updates email only.';
