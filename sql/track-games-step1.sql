-- Step 1 MVP: tracked games + price alert events (run in Supabase SQL editor)
-- Requires: pgcrypto for gen_random_uuid()

create extension if not exists "pgcrypto";

-- tracked_games: one row per user per normalized title
create table if not exists public.tracked_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rawg_id int null,
  title text not null,
  title_norm text not null,
  created_at timestamptz not null default now(),
  last_checked_at timestamptz null,
  last_known_price numeric null,
  target_price numeric null,
  is_active boolean not null default true
);

create unique index if not exists tracked_games_user_title_norm_uq
  on public.tracked_games (user_id, title_norm);

create index if not exists tracked_games_user_id_idx
  on public.tracked_games (user_id);

alter table public.tracked_games enable row level security;

drop policy if exists "tracked_games_select_own" on public.tracked_games;
create policy "tracked_games_select_own"
  on public.tracked_games for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tracked_games_insert_own" on public.tracked_games;
create policy "tracked_games_insert_own"
  on public.tracked_games for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "tracked_games_update_own" on public.tracked_games;
create policy "tracked_games_update_own"
  on public.tracked_games for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- price_alert_events: populated later by cron / server (service role bypasses RLS)
create table if not exists public.price_alert_events (
  id uuid primary key default gen_random_uuid(),
  tracked_game_id uuid not null references public.tracked_games (id) on delete cascade,
  old_price numeric null,
  new_price numeric null,
  provider text null,
  created_at timestamptz not null default now(),
  notified boolean not null default false
);

create index if not exists price_alert_events_tracked_game_id_idx
  on public.price_alert_events (tracked_game_id);

alter table public.price_alert_events enable row level security;

drop policy if exists "price_alert_events_select_own" on public.price_alert_events;
create policy "price_alert_events_select_own"
  on public.price_alert_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.tracked_games tg
      where tg.id = price_alert_events.tracked_game_id
        and tg.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies for users on price_alert_events (server-only writes).
