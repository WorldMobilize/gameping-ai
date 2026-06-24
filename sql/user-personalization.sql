-- =============================================================================
-- GamePing AI — Per-user premium personalization (Weekly Picks / Deals For You /
-- Monthly Recap)
-- =============================================================================
-- ADDITIVE ONLY. Creates two NEW tables. Does NOT touch profiles, auth, Stripe,
-- existing RLS, discovery_rotations, or any other table.
--
--   1) user_taste_profiles    — a cached, AI-readable summary of a user's taste,
--                               built from signals we already store (saved
--                               searches, tracked games, Steam import). One row
--                               per user.
--   2) user_premium_rotations — cached, pre-generated personalized premium
--                               content per user + feature + period (mirrors the
--                               discovery_rotations pattern, but per user).
--
-- Access model (per spec):
--   - A user can SELECT only their OWN rows (RLS policy on auth.uid() = user_id).
--   - service_role (server generation) can do everything.
--   - anon gets nothing; no user can read another user's rows.
-- The pages themselves read via the service role on the server (same as
-- discovery_rotations), keyed by the resolved user id.
--
-- Run in the Supabase SQL editor (review in staging first).
-- Requires: pgcrypto for gen_random_uuid().
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared updated_at trigger fn (search_path pinned, matching hardening pattern)
-- -----------------------------------------------------------------------------
create or replace function public.user_personalization_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.user_personalization_set_updated_at() from public;
revoke all on function public.user_personalization_set_updated_at() from anon;
revoke all on function public.user_personalization_set_updated_at() from authenticated;

-- =============================================================================
-- 1) user_taste_profiles
-- =============================================================================
create table if not exists public.user_taste_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  taste_summary jsonb,
  favorite_patterns jsonb,
  disliked_patterns jsonb,
  favorite_games jsonb,
  preferred_genres jsonb,
  preferred_mechanics jsonb,
  steam_summary jsonb,
  source_summary jsonb,
  generated_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_taste_profiles_user_id_unique unique (user_id)
);

drop trigger if exists user_taste_profiles_updated_at on public.user_taste_profiles;
create trigger user_taste_profiles_updated_at
  before update on public.user_taste_profiles
  for each row
  execute function public.user_personalization_set_updated_at();

alter table public.user_taste_profiles enable row level security;
alter table public.user_taste_profiles force row level security;
revoke all on table public.user_taste_profiles from public;
revoke all on table public.user_taste_profiles from anon;
revoke all on table public.user_taste_profiles from authenticated;

-- Authenticated users may read ONLY their own taste profile. Writes are
-- service_role only (generation runs on the server).
grant select on table public.user_taste_profiles to authenticated;
grant all on table public.user_taste_profiles to service_role;

drop policy if exists user_taste_profiles_select_own on public.user_taste_profiles;
create policy user_taste_profiles_select_own
  on public.user_taste_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.user_taste_profiles is
  'Cached AI-readable per-user taste summary (built from saved searches, tracked games, Steam import). Users read own row only; service_role writes.';

-- =============================================================================
-- 2) user_premium_rotations
-- =============================================================================
create table if not exists public.user_premium_rotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  period_key text not null,
  status text not null default 'draft',
  items jsonb not null default '[]'::jsonb,
  featured_item jsonb,
  ai_summary jsonb,
  source_summary jsonb,
  error text,
  generated_at timestamptz default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_premium_rotations_type_check
    check (type in ('weekly_picks', 'deals_for_you', 'monthly_recap')),
  constraint user_premium_rotations_status_check
    check (status in ('draft', 'published', 'failed')),
  constraint user_premium_rotations_user_type_period_unique
    unique (user_id, type, period_key)
);

-- Fast lookup for "latest published rotation of a type for this user".
create index if not exists user_premium_rotations_user_type_status_pub_idx
  on public.user_premium_rotations (user_id, type, status, published_at desc);

drop trigger if exists user_premium_rotations_updated_at on public.user_premium_rotations;
create trigger user_premium_rotations_updated_at
  before update on public.user_premium_rotations
  for each row
  execute function public.user_personalization_set_updated_at();

alter table public.user_premium_rotations enable row level security;
alter table public.user_premium_rotations force row level security;
revoke all on table public.user_premium_rotations from public;
revoke all on table public.user_premium_rotations from anon;
revoke all on table public.user_premium_rotations from authenticated;

-- Authenticated users may read ONLY their own rotations. Generation/updates are
-- service_role only.
grant select on table public.user_premium_rotations to authenticated;
grant all on table public.user_premium_rotations to service_role;

drop policy if exists user_premium_rotations_select_own on public.user_premium_rotations;
create policy user_premium_rotations_select_own
  on public.user_premium_rotations
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.user_premium_rotations is
  'Cached per-user personalized premium content (weekly_picks/deals_for_you/monthly_recap), keyed by period. Users read own rows only; service_role generates/publishes.';

-- =============================================================================
-- Post-migration verification (run manually after commit)
-- =============================================================================
-- 1) Security Advisor: RLS enabled on both tables; no anon access; the only
--    authenticated policy is SELECT WHERE auth.uid() = user_id.
-- 2) Confirm an authenticated user CANNOT select another user's rows.
-- 3) Generate + publish a rotation via /api/admin/premium/generate and confirm
--    the page reads it.
-- =============================================================================
