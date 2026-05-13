-- Daily recommendation usage (run in Supabase SQL editor)
-- Server-side only via service role; RLS enabled with no policies = client cannot read/write.

create extension if not exists "pgcrypto";

create table if not exists public.recommend_daily_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users (id) on delete cascade,
  ip_hash text null,
  identity_key text not null,
  route text not null default 'recommend',
  count_date date not null,
  hit_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recommend_daily_usage_identity_kind check (
    (user_id is not null and ip_hash is null)
    or (user_id is null and ip_hash is not null)
  ),
  constraint recommend_daily_usage_identity_key_match check (
    (user_id is not null and identity_key = ('user:' || user_id::text))
    or (user_id is null and ip_hash is not null and identity_key = ('ip:' || ip_hash))
  ),
  unique (identity_key, route, count_date)
);

create index if not exists recommend_daily_usage_user_idx
  on public.recommend_daily_usage (user_id)
  where user_id is not null;

create index if not exists recommend_daily_usage_date_idx
  on public.recommend_daily_usage (count_date);

alter table public.recommend_daily_usage enable row level security;

comment on table public.recommend_daily_usage is 'Daily /api/recommend counts (hit_count); service role only.';
comment on column public.recommend_daily_usage.hit_count is 'Requests counted that day (same meaning as count in product spec).';

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

grant execute on function public.try_increment_recommend_daily_usage(uuid, text, int) to service_role;
