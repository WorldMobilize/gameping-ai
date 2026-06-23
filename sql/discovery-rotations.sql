-- =============================================================================
-- GamePing AI — Cached discovery rotations (Hidden Gems / Games of the Week)
-- =============================================================================
-- Stores pre-generated, cached rotations so the /hidden-gems and
-- /games-of-the-week pages read from Supabase instead of calling RAWG/ITAD on
-- every visit. Generation runs from an admin/cron route and writes a `draft`,
-- then a `publish` step flips it to `published`.
--
-- Public/non-admin clients get NO access (service_role only), matching the other
-- internal cache tables (deal_quotes_cache, cached_games, …). The pages read via
-- the server using the service role, so no anon/authenticated policies are
-- needed. This does NOT change any existing table, RLS policy, or auth flow.
--
-- Run in the Supabase SQL editor (review in staging first).
-- Requires: pgcrypto for gen_random_uuid().
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.discovery_rotations (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  period_key text not null,
  status text not null default 'draft',
  items jsonb not null default '[]'::jsonb,
  featured_item jsonb,
  source_summary jsonb,
  error text,
  generated_at timestamptz default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discovery_rotations_type_check
    check (type in ('hidden_gems', 'games_of_the_week')),
  constraint discovery_rotations_status_check
    check (status in ('draft', 'published', 'failed')),
  constraint discovery_rotations_type_period_key_unique
    unique (type, period_key)
);

-- Fast lookups for "latest published rotation of a type".
create index if not exists discovery_rotations_type_status_published_at_idx
  on public.discovery_rotations (type, status, published_at desc);

-- Keep updated_at fresh on upsert (search_path pinned, matching hardening pattern).
create or replace function public.discovery_rotations_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists discovery_rotations_updated_at on public.discovery_rotations;
create trigger discovery_rotations_updated_at
  before update on public.discovery_rotations
  for each row
  execute function public.discovery_rotations_set_updated_at();

revoke all on function public.discovery_rotations_set_updated_at() from public;
revoke all on function public.discovery_rotations_set_updated_at() from anon;
revoke all on function public.discovery_rotations_set_updated_at() from authenticated;

-- Service role (server) reads/writes only; no public client access.
alter table public.discovery_rotations enable row level security;
alter table public.discovery_rotations force row level security;
revoke all on table public.discovery_rotations from public;
revoke all on table public.discovery_rotations from anon;
revoke all on table public.discovery_rotations from authenticated;
grant all on table public.discovery_rotations to service_role;

-- No policies for anon/authenticated: only service_role bypasses RLS.

comment on table public.discovery_rotations is
  'Cached, pre-generated discovery rotations (hidden_gems monthly, games_of_the_week weekly); service_role only (RLS, no client policies).';

-- =============================================================================
-- Post-migration verification (run manually after commit)
-- =============================================================================
-- 1) Security Advisor: RLS enabled + no anon/authenticated policies/grants.
-- 2) Generate a draft, publish it, confirm the page reads the published rotation.
-- 3) Confirm anon/authenticated cannot select discovery_rotations directly.
-- =============================================================================
