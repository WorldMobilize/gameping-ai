-- Early-access user feedback (run in Supabase SQL editor)
-- Requires: pgcrypto for gen_random_uuid()

create extension if not exists "pgcrypto";

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users (id) on delete set null,
  type text not null default 'other',
  message text not null,
  page_url text null,
  context_area text null,
  email text null,
  user_agent text null,
  recommendation_context jsonb null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint feedback_reports_type_check check (
    type in (
      'something_wrong',
      'wrong_price',
      'recommendation_miss',
      'confusing_ux',
      'feature_idea',
      'other'
    )
  ),
  constraint feedback_reports_status_check check (
    status in ('new', 'reviewed', 'archived')
  )
);

create index if not exists feedback_reports_created_at_idx
  on public.feedback_reports (created_at desc);

create index if not exists feedback_reports_context_area_idx
  on public.feedback_reports (context_area);

create index if not exists feedback_reports_status_idx
  on public.feedback_reports (status);

create index if not exists feedback_reports_has_context_idx
  on public.feedback_reports ((recommendation_context is not null))
  where recommendation_context is not null;

alter table public.feedback_reports enable row level security;

-- Migration for existing deployments:
-- alter table public.feedback_reports
--   add column if not exists recommendation_context jsonb null;

-- Authenticated: insert own rows only
drop policy if exists "feedback_reports_insert_authenticated" on public.feedback_reports;
create policy "feedback_reports_insert_authenticated"
  on public.feedback_reports for insert
  to authenticated
  with check (user_id = auth.uid());

-- Anonymous: insert only when not tied to a user
drop policy if exists "feedback_reports_insert_anon" on public.feedback_reports;
create policy "feedback_reports_insert_anon"
  on public.feedback_reports for insert
  to anon
  with check (user_id is null);

-- No public select/update/delete (service role / dashboard admin only)
