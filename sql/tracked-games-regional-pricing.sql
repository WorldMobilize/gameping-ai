-- Regional price alerts: per-track pricing country + offer snapshot (run in Supabase SQL editor).

alter table public.tracked_games
  add column if not exists pricing_country text not null default 'US',
  add column if not exists last_known_currency text null,
  add column if not exists last_known_provider text null,
  add column if not exists last_known_store text null,
  add column if not exists last_known_url text null;

comment on column public.tracked_games.pricing_country is
  'ISO-3166-1 alpha-2 region used for alert price lookups (Steam cc / ITAD country).';
comment on column public.tracked_games.last_known_currency is
  'Currency code for last_known_price baseline (no cross-currency compare).';

alter table public.price_alert_events
  add column if not exists currency text null,
  add column if not exists pricing_country text null,
  add column if not exists store text null;

comment on column public.price_alert_events.currency is
  'ISO 4217 currency for new_price at alert time.';
