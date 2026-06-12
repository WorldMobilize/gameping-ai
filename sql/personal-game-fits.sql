-- Personal Game Fit cache (per user + game + Taste DNA revision).
-- Run in Supabase SQL editor before deploying personal fit API.
-- Requires: pgcrypto for gen_random_uuid()

create extension if not exists "pgcrypto";

create table if not exists public.personal_game_fits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rawg_id int not null,
  game_title text not null,
  taste_dna_version int not null,
  taste_dna_hash text not null,
  fit_prompt_version int not null default 1,
  fit_json jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create unique index if not exists personal_game_fits_lookup_uq
  on public.personal_game_fits (
    user_id,
    rawg_id,
    taste_dna_hash,
    fit_prompt_version
  );

create index if not exists personal_game_fits_user_id_idx
  on public.personal_game_fits (user_id);

create index if not exists personal_game_fits_expires_at_idx
  on public.personal_game_fits (expires_at);

alter table public.personal_game_fits enable row level security;
alter table public.personal_game_fits force row level security;

revoke all on table public.personal_game_fits from public;
revoke all on table public.personal_game_fits from anon;
revoke all on table public.personal_game_fits from authenticated;
grant all on table public.personal_game_fits to service_role;

comment on table public.personal_game_fits is
  'Cached AI personal game fit explanations; service_role only (API access with auth).';
