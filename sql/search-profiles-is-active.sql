-- Saved recommendation runs: active/inactive for Free plan caps after Premium downgrade.
-- Run in Supabase SQL editor after search_profiles exists.
--
-- Prereq: users can UPDATE own rows (same pattern as tracked_games). If missing:
--   create policy "search_profiles_update_own" on public.search_profiles
--   for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.search_profiles
  add column if not exists is_active boolean not null default true;

create index if not exists search_profiles_user_active_idx
  on public.search_profiles (user_id, is_active);
