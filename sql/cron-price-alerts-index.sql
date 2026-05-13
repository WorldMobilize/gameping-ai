-- Optional: speeds up 24h dedupe lookups for price_alert_events (run after track-games-step1.sql)

create index if not exists price_alert_events_dedupe_lookup_idx
  on public.price_alert_events (tracked_game_id, new_price, provider, created_at desc);
