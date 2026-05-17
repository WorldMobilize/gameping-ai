-- =============================================================================
-- GamePing AI — RLS hardening for internal/cache/log tables
-- =============================================================================
-- Suggested migration (review in staging; do NOT run blindly on production).
-- Does NOT change application code. service_role continues to bypass RLS.
--
-- Prereqs:
--   - Tables listed below already exist with RLS enabled.
--   - public.emails has column user_id uuid (FK to auth.users recommended).
--
-- Manual (not SQL): Supabase Dashboard → Authentication → Settings
--   → enable "Leaked password protection" (Have I Been Pwned) if your plan supports it.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- SECTION A — Server / service-role-only tables
-- ---------------------------------------------------------------------------
-- App access (verified in repo):
--   cached_ai_recommendations, cached_games     → src/lib/cache.ts (service role)
--   deal_quotes_cache, price_quotes             → src/lib/pricing/price-cache.ts
--   rate_limit_events                           → src/lib/rate-limit.ts, delete-account
--   recommend_daily_usage                       → RPC only (service role), not direct client
--   sent_alerts                                 → not referenced in app (legacy/log); service only
--
-- Pattern: RLS ON + no anon/authenticated policies + revoke direct table grants.
-- service_role bypasses RLS and keeps full API access.

do $rls$
declare
  t text;
begin
  foreach t in array array[
    'cached_ai_recommendations',
    'cached_games',
    'deal_quotes_cache',
    'price_quotes',
    'rate_limit_events',
    'recommend_daily_usage',
    'sent_alerts'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke all on table public.%I from authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end;
$rls$;

-- Optional: document intent (no permissive policies on these tables).
comment on table public.cached_ai_recommendations is
  'AI recommendation response cache; service_role only (RLS, no client policies).';
comment on table public.cached_games is
  'RAWG game payload cache; service_role only (RLS, no client policies).';
comment on table public.deal_quotes_cache is
  'Verified deal list cache; service_role only (RLS, no client policies).';
comment on table public.price_quotes is
  'Single-title price quote cache; service_role only (RLS, no client policies).';
comment on table public.rate_limit_events is
  'Rate-limit event log; service_role only (RLS, no client policies).';
comment on table public.recommend_daily_usage is
  'Daily recommend counters; service_role + try_increment_recommend_daily_usage() only.';
comment on table public.sent_alerts is
  'Alert send log (legacy/unused by current app); service_role only unless you add policies later.';

-- ---------------------------------------------------------------------------
-- SECTION B — public.emails (authenticated user-owned)
-- ---------------------------------------------------------------------------
-- App access:
--   POST /api/save-email → cookie client (authenticated) upsert with user_id
--   DELETE /api/delete-account → service_role delete by user_id
--
-- Strict per-user policies; no anon access.

alter table public.emails enable row level security;
alter table public.emails force row level security;

revoke all on table public.emails from public;
revoke all on table public.emails from anon;

grant select, insert, update, delete on table public.emails to authenticated;
grant all on table public.emails to service_role;

drop policy if exists emails_select_own on public.emails;
create policy emails_select_own
  on public.emails
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists emails_insert_own on public.emails;
create policy emails_insert_own
  on public.emails
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists emails_update_own on public.emails;
create policy emails_update_own
  on public.emails
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists emails_delete_own on public.emails;
create policy emails_delete_own
  on public.emails
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.emails is
  'User email/preferences capture; authenticated users may manage rows where user_id = auth.uid().';

-- ---------------------------------------------------------------------------
-- SECTION C — SECURITY DEFINER functions & search_path
-- ---------------------------------------------------------------------------

-- C1) Recommend daily usage RPC (server-only caller)
create or replace function public.try_increment_recommend_daily_usage(
  p_user_id uuid,
  p_ip_hash text,
  p_daily_limit int
)
returns table(allowed boolean, used_count int, daily_limit int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (timezone('utc', now()))::date;
  v_key text;
  v_id uuid;
  v_cnt int;
begin
  daily_limit := p_daily_limit;

  if p_user_id is not null then
    v_key := 'user:' || p_user_id::text;
  elsif p_ip_hash is not null then
    v_key := 'ip:' || p_ip_hash;
  else
    allowed := false;
    used_count := 0;
    return next;
    return;
  end if;

  select r.id, r.hit_count into v_id, v_cnt
  from public.recommend_daily_usage r
  where r.identity_key = v_key
    and r.route = 'recommend'
    and r.count_date = v_date
  for update;

  if found then
    if v_cnt >= p_daily_limit then
      allowed := false;
      used_count := v_cnt;
      return next;
      return;
    end if;

    update public.recommend_daily_usage
    set
      hit_count = hit_count + 1,
      updated_at = now()
    where id = v_id
    returning hit_count into used_count;

    allowed := true;
    return next;
    return;
  end if;

  begin
    insert into public.recommend_daily_usage (
      identity_key,
      user_id,
      ip_hash,
      route,
      count_date,
      hit_count
    )
    values (
      v_key,
      p_user_id,
      case when p_user_id is not null then null else p_ip_hash end,
      'recommend',
      v_date,
      1
    )
    returning hit_count into used_count;

    allowed := true;
    return next;
  exception
    when unique_violation then
      select r.id, r.hit_count into v_id, v_cnt
      from public.recommend_daily_usage r
      where r.identity_key = v_key
        and r.route = 'recommend'
        and r.count_date = v_date
      for update;

      if v_cnt >= p_daily_limit then
        allowed := false;
        used_count := v_cnt;
        return next;
        return;
      end if;

      update public.recommend_daily_usage
      set hit_count = hit_count + 1, updated_at = now()
      where id = v_id
      returning hit_count into used_count;

      allowed := true;
      return next;
  end;
end;
$$;

revoke all on function public.try_increment_recommend_daily_usage(uuid, text, int) from public;
revoke all on function public.try_increment_recommend_daily_usage(uuid, text, int) from anon;
revoke all on function public.try_increment_recommend_daily_usage(uuid, text, int) from authenticated;
grant execute on function public.try_increment_recommend_daily_usage(uuid, text, int) to service_role;

-- C2) Auth signup profile trigger (not callable by clients)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles as p (user_id, email, plan, created_at, updated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    'free',
    now(),
    now()
  )
  on conflict (user_id) do update
    set
      email = coalesce(nullif(excluded.email, ''), p.email),
      updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- C3) Deal quotes cache trigger (mutable search_path fix)
create or replace function public.deal_quotes_cache_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.deal_quotes_cache_set_updated_at() from public;
revoke all on function public.deal_quotes_cache_set_updated_at() from anon;
revoke all on function public.deal_quotes_cache_set_updated_at() from authenticated;

commit;

-- =============================================================================
-- Post-migration verification (run manually after commit)
-- =============================================================================
-- 1) Security Advisor: RLS enabled + policies (or revoked grants) for listed tables.
-- 2) Smoke: /api/recommend (daily limit RPC), game detail (caches), /api/save-email (if used).
-- 3) Cron: price alerts still write price_alert_events / tracked_games (service role).
-- 4) Functions: no EXECUTE for anon/authenticated on SECURITY DEFINER helpers above.
-- =============================================================================
