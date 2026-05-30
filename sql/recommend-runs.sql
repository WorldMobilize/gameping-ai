-- =============================================================================
-- GamePing — Recommendation run log (manual quality inspection)
-- Run in Supabase SQL editor (production).
-- Service role insert only; no user_id, email, IP, or session_id.
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.recommend_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prompt_text text not null,
  latency_ms integer null,
  results_count integer null,
  result_titles text[] null,
  success boolean not null default true,
  error_code text null
);

create index if not exists recommend_runs_created_at_idx
  on public.recommend_runs (created_at desc);

create index if not exists recommend_runs_success_created_idx
  on public.recommend_runs (success, created_at desc);

alter table public.recommend_runs enable row level security;

revoke all on table public.recommend_runs from public;
revoke all on table public.recommend_runs from anon;
revoke all on table public.recommend_runs from authenticated;
grant all on table public.recommend_runs to service_role;

comment on table public.recommend_runs is
  'Server-side recommend run log for manual QA; service_role only. Stores prompt text (max 500 chars at insert).';

create or replace view public.v_recommend_runs_recent as
select
  id,
  created_at,
  prompt_text,
  latency_ms,
  results_count,
  result_titles,
  success,
  error_code
from public.recommend_runs
order by created_at desc
limit 200;

comment on view public.v_recommend_runs_recent is
  'Latest 200 recommendation runs for Supabase SQL editor inspection.';

-- Example queries:
-- select * from v_recommend_runs_recent;
--
-- select
--   success,
--   count(*),
--   round(avg(latency_ms)) as avg_latency_ms
-- from recommend_runs
-- group by success;
--
-- select prompt_text, latency_ms, results_count, result_titles
-- from recommend_runs
-- order by created_at desc
-- limit 50;
