-- =============================================================================
-- GamePing — Creator referral program (foundation schema)
-- Run in Supabase SQL editor. REVIEW BEFORE RUNNING — this only creates tables;
-- nothing else in the app depends on them until checkout/webhook are wired.
--
-- Design notes:
--  * Three tables: codes (per creator), referrals (per referred subscription),
--    commission ledger (per paid invoice — the money accrues here).
--  * Money is stored in integer CENTS to avoid float drift. Currency is USD.
--  * All three are SERVICE-ROLE ONLY: the server (Stripe webhook / admin report)
--    owns every write and read. No client policies — referrals hold another
--    user's id and the ledger is accounting, so we never expose them to the
--    browser. Creator-facing views go through a server route later (Phase 3).
--  * Idempotency: referrals are unique per stripe_subscription_id and ledger
--    rows unique per stripe_invoice_id, so replayed webhooks never double-count.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── 1. Creator codes ─────────────────────────────────────────────────────────
-- One row per code. A creator picks the TYPE their audience gets:
--   referral = no discount (commission on full price)
--   discount = shared Stripe 20% coupon applied at checkout
--   trial    = 7-day trial applied at checkout
create table if not exists public.creator_codes (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  type text not null check (type in ('referral', 'discount', 'trial')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Codes are case-insensitive and globally unique.
create unique index if not exists creator_codes_code_uq
  on public.creator_codes (lower(code));

-- At most one ACTIVE code per creator (they can rotate/switch type).
create unique index if not exists creator_codes_one_active_per_creator_uq
  on public.creator_codes (creator_user_id)
  where active;

alter table public.creator_codes enable row level security;
revoke all on table public.creator_codes from public;
revoke all on table public.creator_codes from anon;
revoke all on table public.creator_codes from authenticated;
grant all on table public.creator_codes to service_role;

comment on table public.creator_codes is
  'Creator referral codes. One active code per creator; type drives checkout behavior. Service-role only.';

-- ── 2. Referrals ─────────────────────────────────────────────────────────────
-- One row per referred SUBSCRIPTION (the idempotency key). status mirrors the
-- Stripe subscription so the monthly report can count "active" referrals.
create table if not exists public.creator_referrals (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  code_type text not null check (code_type in ('referral', 'discount', 'trial')),
  referred_user_id uuid null references auth.users (id) on delete set null,
  stripe_customer_id text null,
  stripe_subscription_id text not null,
  status text not null default 'incomplete'
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled')),
  started_at timestamptz null,
  canceled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A creator can never refer themselves.
  constraint creator_referrals_no_self_referral
    check (referred_user_id is null or referred_user_id <> creator_user_id)
);

create unique index if not exists creator_referrals_subscription_uq
  on public.creator_referrals (stripe_subscription_id);

create index if not exists creator_referrals_creator_status_idx
  on public.creator_referrals (creator_user_id, status);

create index if not exists creator_referrals_referred_user_idx
  on public.creator_referrals (referred_user_id);

alter table public.creator_referrals enable row level security;
revoke all on table public.creator_referrals from public;
revoke all on table public.creator_referrals from anon;
revoke all on table public.creator_referrals from authenticated;
grant all on table public.creator_referrals to service_role;

comment on table public.creator_referrals is
  'One row per referred Stripe subscription. Unique on stripe_subscription_id (idempotent webhooks). Service-role only.';

-- ── 3. Commission ledger ─────────────────────────────────────────────────────
-- One row per PAID invoice from a referred member. Basis is what Stripe actually
-- collected (post-discount; $0 during trial), so discount/trial/annual resolve
-- for free. commission_pct is snapshotted at accrual time.
create table if not exists public.creator_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users (id) on delete cascade,
  referral_id uuid null references public.creator_referrals (id) on delete set null,
  stripe_invoice_id text not null,
  period text not null, -- billing month, 'YYYY-MM'
  gross_collected_cents integer not null,
  currency text not null default 'usd',
  commission_pct integer not null,
  commission_cents integer not null,
  created_at timestamptz not null default now()
);

create unique index if not exists creator_commission_ledger_invoice_uq
  on public.creator_commission_ledger (stripe_invoice_id);

create index if not exists creator_commission_ledger_creator_period_idx
  on public.creator_commission_ledger (creator_user_id, period);

create index if not exists creator_commission_ledger_referral_idx
  on public.creator_commission_ledger (referral_id);

alter table public.creator_commission_ledger enable row level security;
revoke all on table public.creator_commission_ledger from public;
revoke all on table public.creator_commission_ledger from anon;
revoke all on table public.creator_commission_ledger from authenticated;
grant all on table public.creator_commission_ledger to service_role;

comment on table public.creator_commission_ledger is
  'Accrued commission per paid invoice (cents, USD). Unique on stripe_invoice_id (idempotent). Service-role only.';

-- ── Reporting ────────────────────────────────────────────────────────────────
-- No SQL views on purpose: the admin earnings report is assembled in application
-- code (src/lib/creator-referrals.ts → getCreatorEarningsReport) using the
-- service role, which keeps RLS intact. A public-schema view runs SECURITY
-- DEFINER and could expose this data via the API, so we avoid it.
--
-- Ad-hoc queries (run as service role in the SQL editor if needed):
--   select creator_user_id, period, sum(commission_cents)
--   from creator_commission_ledger group by creator_user_id, period;
--
--   select creator_user_id, count(*) as active_referrals
--   from creator_referrals where status in ('active', 'trialing')
--   group by creator_user_id;
