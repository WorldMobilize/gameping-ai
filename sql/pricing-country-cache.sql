-- Country-aware pricing cache keys (run in Supabase SQL editor before deploying regional pricing).
-- Existing rows default to US.

alter table public.price_quotes
  add column if not exists country_code text not null default 'US';

alter table public.deal_quotes_cache
  add column if not exists country_code text not null default 'US';

-- Drop legacy single-column uniques (names may vary; ignore errors if already migrated).
alter table public.price_quotes drop constraint if exists price_quotes_title_key;
alter table public.deal_quotes_cache drop constraint if exists deal_quotes_cache_normalized_title_key;

create unique index if not exists price_quotes_title_country_uq
  on public.price_quotes (title, country_code);

create unique index if not exists deal_quotes_cache_title_country_uq
  on public.deal_quotes_cache (normalized_title, country_code);

create index if not exists deal_quotes_cache_country_expires_idx
  on public.deal_quotes_cache (country_code, expires_at);

comment on column public.price_quotes.country_code is
  'ISO-3166-1 alpha-2 region used for provider lookups (Steam cc / ITAD country).';
comment on column public.deal_quotes_cache.country_code is
  'ISO-3166-1 alpha-2 region used for provider lookups (Steam cc / ITAD country).';
