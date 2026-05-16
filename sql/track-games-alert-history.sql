-- Price alert history columns on tracked_games (run in Supabase SQL editor)
-- Keeps last_known_price and target_price unchanged.

alter table public.tracked_games
add column if not exists previous_price numeric null,
add column if not exists previous_checked_at timestamptz null,
add column if not exists last_alert_price numeric null,
add column if not exists last_alerted_at timestamptz null;
