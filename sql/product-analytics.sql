-- =============================================================================
-- GamePing — Product analytics (events + monitoring views)
-- Run in Supabase SQL editor (production).
-- =============================================================================

create extension if not exists "pgcrypto";

-- Legacy column renames (safe if already migrated)
do $migrate$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_events' and column_name = 'occurred_at'
  ) then
    alter table public.product_events rename column occurred_at to created_at;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_events' and column_name = 'props'
  ) then
    alter table public.product_events rename column props to metadata;
  end if;
end;
$migrate$;

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  anonymous_id text null,
  user_id uuid null references auth.users (id) on delete set null,
  event_name text not null,
  page_path text null,
  referrer text null,
  user_agent text null,
  device_type text null,
  country text null,
  metadata jsonb not null default '{}'::jsonb,
  constraint product_events_name_check check (
    event_name ~ '^[a-z][a-z0-9_]{1,63}$'
  )
);

alter table public.product_events add column if not exists anonymous_id text null;
alter table public.product_events add column if not exists device_type text null;
alter table public.product_events add column if not exists country text null;

update public.product_events
set session_id = 'legacy_unknown'
where session_id is null;

alter table public.product_events alter column session_id set not null;

create index if not exists product_events_created_at_idx
  on public.product_events (created_at desc);

create index if not exists product_events_name_created_idx
  on public.product_events (event_name, created_at desc);

create index if not exists product_events_session_created_idx
  on public.product_events (session_id, created_at desc);

create index if not exists product_events_user_created_idx
  on public.product_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists product_events_page_created_idx
  on public.product_events (page_path, created_at desc)
  where page_path is not null;

alter table public.product_events enable row level security;

revoke all on table public.product_events from public;
revoke all on table public.product_events from anon;
revoke all on table public.product_events from authenticated;
grant all on table public.product_events to service_role;

comment on table public.product_events is
  'First-party product funnel events. Inserts via service role only. No prompts or email in metadata.';

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

create or replace view public.v_analytics_daily_kpi as
with days as (
  select generate_series(
    (current_date - interval '29 days')::date,
    current_date,
    interval '1 day'
  )::date as day
),
ev as (
  select
    (created_at at time zone 'utc')::date as day,
    count(distinct session_id) filter (
      where event_name in ('session_start', 'page_view')
    ) as sessions,
    count(*) filter (where event_name = 'page_view') as page_views,
    count(*) filter (where event_name = 'recommend_started') as recommend_started,
    count(*) filter (where event_name = 'recommend_completed') as recommend_completed,
    count(*) filter (where event_name = 'recommend_failed') as recommend_failed,
    count(*) filter (where event_name = 'game_viewed') as game_views,
    count(*) filter (where event_name = 'store_clicked') as store_clicks,
    count(*) filter (where event_name = 'signup_completed') as signups_events,
    count(*) filter (where event_name = 'feedback_submitted') as feedback_submitted
  from public.product_events
  where created_at >= now() - interval '30 days'
  group by 1
),
prof_signups as (
  select (created_at at time zone 'utc')::date as day, count(*)::int as signups_profiles
  from public.profiles
  where created_at >= now() - interval '30 days'
  group by 1
),
session_durations as (
  select
    (min(created_at) at time zone 'utc')::date as day,
    session_id,
    extract(epoch from (max(created_at) - min(created_at)))::numeric as duration_seconds
  from public.product_events
  where created_at >= now() - interval '30 days'
    and event_name in ('session_start', 'page_view', 'session_heartbeat', 'session_end')
  group by 1, 2
),
avg_session as (
  select day, round(avg(duration_seconds))::int as avg_session_seconds
  from session_durations
  group by 1
),
rec_latency as (
  select
    (created_at at time zone 'utc')::date as day,
    round(avg((metadata->>'latencyMs')::numeric))::int as avg_recommend_latency_ms
  from public.product_events
  where event_name in ('recommend_completed', 'recommend_failed')
    and (metadata->>'latencyMs') ~ '^[0-9]+$'
    and created_at >= now() - interval '30 days'
  group by 1
)
select
  d.day as date,
  coalesce(ev.sessions, 0) as visitors_sessions,
  coalesce(ev.page_views, 0) as page_views,
  coalesce(ev.recommend_started, 0) as recommend_started,
  coalesce(ev.recommend_completed, 0) as recommend_completed,
  coalesce(ev.recommend_failed, 0) as recommend_failed,
  coalesce(ev.game_views, 0) as game_views,
  coalesce(ev.store_clicks, 0) as store_clicks,
  greatest(coalesce(ev.signups_events, 0), coalesce(ps.signups_profiles, 0)) as signups,
  coalesce(ev.feedback_submitted, 0) as feedback_submitted,
  coalesce(a.avg_session_seconds, 0) as avg_session_seconds,
  coalesce(rl.avg_recommend_latency_ms, 0) as avg_recommend_latency_ms
from days d
left join ev on ev.day = d.day
left join prof_signups ps on ps.day = d.day
left join avg_session a on a.day = d.day
left join rec_latency rl on rl.day = d.day
order by d.day desc;

create or replace view public.v_analytics_funnel_daily as
with per_session as (
  select
    (min(created_at) at time zone 'utc')::date as day,
    session_id,
    bool_or(event_name = 'recommend_started') as recommend_started,
    bool_or(event_name = 'recommend_completed') as recommend_completed,
    bool_or(event_name = 'game_viewed') as game_view,
    bool_or(event_name = 'store_clicked') as store_click,
    bool_or(event_name = 'signup_completed') as signup
  from public.product_events
  where created_at >= now() - interval '30 days'
  group by 1, 2
)
select
  day,
  count(*)::int as sessions,
  count(*) filter (where recommend_started)::int as sessions_with_recommend_started,
  count(*) filter (where recommend_completed)::int as sessions_with_recommend_completed,
  count(*) filter (where game_view)::int as sessions_with_game_view,
  count(*) filter (where store_click)::int as sessions_with_store_click,
  count(*) filter (where signup)::int as sessions_with_signup
from per_session
group by day
order by day desc;

create or replace view public.v_analytics_sessions as
select
  session_id,
  (array_agg(user_id order by created_at desc) filter (where user_id is not null))[1] as user_id,
  min(created_at) as first_seen_at,
  max(created_at) as last_seen_at,
  round(extract(epoch from (max(created_at) - min(created_at))))::int as duration_seconds,
  count(*) filter (where event_name = 'page_view')::int as page_views,
  count(*) filter (where event_name = 'recommend_started')::int as recommend_started,
  count(*) filter (where event_name = 'recommend_completed')::int as recommend_completed,
  count(*) filter (where event_name = 'game_viewed')::int as game_views,
  count(*) filter (where event_name = 'store_clicked')::int as store_clicks,
  count(*) filter (where event_name = 'signup_completed')::int as signup_completed,
  count(*) filter (where event_name = 'feedback_submitted')::int as feedback_submitted
from public.product_events
where created_at >= now() - interval '14 days'
group by session_id
order by last_seen_at desc;

create or replace view public.v_analytics_top_pages as
select
  coalesce(nullif(page_path, ''), '(unknown)') as page_path,
  count(*) filter (where event_name = 'page_view')::int as page_views,
  count(distinct session_id)::int as unique_sessions
from public.product_events
where created_at >= now() - interval '30 days'
  and event_name = 'page_view'
group by 1
order by page_views desc
limit 100;

create or replace view public.v_analytics_recommend_performance as
with base as (
  select
    (created_at at time zone 'utc')::date as day,
    event_name,
    (metadata->>'latencyMs')::numeric as latency_ms,
    (metadata->>'resultCount')::numeric as result_count,
    coalesce((metadata->>'cacheHit')::boolean, false) as cache_hit
  from public.product_events
  where event_name in ('recommend_completed', 'recommend_failed')
    and created_at >= now() - interval '30 days'
)
select
  day,
  count(*)::int as count,
  round(avg(latency_ms))::int as avg_latency_ms,
  round(
    (percentile_cont(0.5) within group (order by latency_ms)
      filter (where event_name = 'recommend_completed' and latency_ms is not null))
  )::int as p50_latency_ms,
  round(
    (percentile_cont(0.95) within group (order by latency_ms)
      filter (where event_name = 'recommend_completed' and latency_ms is not null))
  )::int as p95_latency_ms,
  round(avg(result_count) filter (where event_name = 'recommend_completed'))::int as avg_result_count,
  count(*) filter (where event_name = 'recommend_completed' and cache_hit)::int as cache_hit_count,
  count(*) filter (where event_name = 'recommend_failed')::int as failed_count
from base
group by day
order by day desc;

create or replace view public.v_analytics_event_stream_recent as
select
  id,
  created_at,
  event_name,
  session_id,
  user_id,
  page_path,
  device_type,
  country,
  metadata
from public.product_events
order by created_at desc
limit 200;

-- ---------------------------------------------------------------------------
-- Example queries
-- ---------------------------------------------------------------------------
-- Daily funnel (last 7 days):
--   select * from v_analytics_funnel_daily limit 7;
--
-- Session duration sanity:
--   select session_id, duration_seconds, page_views, recommend_completed
--   from v_analytics_sessions limit 20;
