-- Deal list cache for verified store rows (public pricing only, no user data).
-- Run in Supabase SQL editor before deploying deal-cache code.
-- Requires: pgcrypto for gen_random_uuid()

create extension if not exists "pgcrypto";

create table if not exists public.deal_quotes_cache (
  id uuid primary key default gen_random_uuid(),
  normalized_title text not null unique,
  title text not null,
  deals jsonb not null default '[]'::jsonb,
  provider text not null default 'mixed',
  debug_meta jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists deal_quotes_cache_normalized_title_idx
  on public.deal_quotes_cache (normalized_title);

create index if not exists deal_quotes_cache_expires_at_idx
  on public.deal_quotes_cache (expires_at);

-- Keep updated_at fresh on upsert
create or replace function public.deal_quotes_cache_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deal_quotes_cache_updated_at on public.deal_quotes_cache;
create trigger deal_quotes_cache_updated_at
  before update on public.deal_quotes_cache
  for each row
  execute function public.deal_quotes_cache_set_updated_at();

-- Service role (server) reads/writes; no public client access.
alter table public.deal_quotes_cache enable row level security;

-- No policies for anon/authenticated: only service_role bypasses RLS.

comment on table public.deal_quotes_cache is
  'Cached verified deal rows per game title for CheapShark-heavy game detail pages.';
