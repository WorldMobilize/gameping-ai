-- Steam library import foundation (run in Supabase SQL editor)
-- Requires: pgcrypto for gen_random_uuid()

create extension if not exists "pgcrypto";

-- One connection row per user (re-import upserts this row)
create table if not exists public.user_steam_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  steam_id text not null,
  vanity_url text null,
  profile_url text null,
  visibility_status text not null,
  game_count int not null default 0,
  total_playtime_min int null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  taste_dna jsonb null,
  taste_version int not null default 1,
  rawg_enriched_at timestamptz null
);

create index if not exists user_steam_connections_steam_id_idx
  on public.user_steam_connections (steam_id);

alter table public.user_steam_connections enable row level security;

drop policy if exists "user_steam_connections_select_own" on public.user_steam_connections;
create policy "user_steam_connections_select_own"
  on public.user_steam_connections for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_steam_connections_insert_own" on public.user_steam_connections;
create policy "user_steam_connections_insert_own"
  on public.user_steam_connections for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_steam_connections_update_own" on public.user_steam_connections;
create policy "user_steam_connections_update_own"
  on public.user_steam_connections for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_steam_connections_delete_own" on public.user_steam_connections;
create policy "user_steam_connections_delete_own"
  on public.user_steam_connections for delete
  to authenticated
  using (auth.uid() = user_id);

-- Owned Steam games imported for a user
create table if not exists public.user_steam_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  steam_app_id int not null,
  title text not null,
  title_norm text not null,
  playtime_forever int not null default 0,
  playtime_2weeks int null,
  rawg_id int null,
  imported_at timestamptz not null default now()
);

create unique index if not exists user_steam_games_user_app_uq
  on public.user_steam_games (user_id, steam_app_id);

create index if not exists user_steam_games_user_id_idx
  on public.user_steam_games (user_id);

create index if not exists user_steam_games_user_playtime_idx
  on public.user_steam_games (user_id, playtime_forever desc);

alter table public.user_steam_games enable row level security;

drop policy if exists "user_steam_games_select_own" on public.user_steam_games;
create policy "user_steam_games_select_own"
  on public.user_steam_games for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_steam_games_insert_own" on public.user_steam_games;
create policy "user_steam_games_insert_own"
  on public.user_steam_games for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_steam_games_delete_own" on public.user_steam_games;
create policy "user_steam_games_delete_own"
  on public.user_steam_games for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.user_steam_connections is
  'Steam library import connection metadata per user; taste_dna reserved for a future phase.';
comment on table public.user_steam_games is
  'Imported Steam owned games (app id, title, playtime) per user.';
