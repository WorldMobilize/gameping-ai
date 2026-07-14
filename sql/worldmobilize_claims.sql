-- ============================================================
-- WorldMobilize — territory claims (Demo MVP)
-- Run this once in the Supabase SQL editor to enable server-side
-- persistence. Until then the app falls back to localStorage.
-- Smallest table needed for: claim a territory, add links, edit own claim.
-- ============================================================

create table if not exists public.worldmobilize_claims (
  id            uuid primary key default gen_random_uuid(),
  territory_id  text not null unique,                 -- one claim per territory
  territory_name text not null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  owner_label   text,                                 -- display name/email at claim time
  community_name text not null,
  youtube_url   text,
  twitch_url    text,
  discord_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.worldmobilize_claims enable row level security;

-- Everyone (incl. anonymous) can read claims — the map is public.
drop policy if exists "wm_claims_select_all" on public.worldmobilize_claims;
create policy "wm_claims_select_all"
  on public.worldmobilize_claims for select
  using (true);

-- Authenticated users may claim (insert) a territory as themselves.
drop policy if exists "wm_claims_insert_own" on public.worldmobilize_claims;
create policy "wm_claims_insert_own"
  on public.worldmobilize_claims for insert to authenticated
  with check (auth.uid() = user_id);

-- Users may edit only their own claim.
drop policy if exists "wm_claims_update_own" on public.worldmobilize_claims;
create policy "wm_claims_update_own"
  on public.worldmobilize_claims for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users may release (delete) only their own claim.
drop policy if exists "wm_claims_delete_own" on public.worldmobilize_claims;
create policy "wm_claims_delete_own"
  on public.worldmobilize_claims for delete to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at fresh on edits.
create or replace function public.wm_claims_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wm_claims_updated_at on public.worldmobilize_claims;
create trigger wm_claims_updated_at
  before update on public.worldmobilize_claims
  for each row execute function public.wm_claims_touch_updated_at();
