-- =============================================================================
-- GamePing — one saved run per identical search
--
-- ┌───────────────────────────────────────────────────────────────────────────┐
-- │ NOT APPLIED. Unlike every other file in sql/, this one has NOT been run.  │
-- │ Deliberately parked 2026-07-17: the client-side guard below already fixes │
-- │ the reported bug, so this is defence in depth, not a fix.                 │
-- │                                                                           │
-- │ DO NOT RUN IT ALONE. /api/save-search maps any database error to a bare   │
-- │ 500 "Database error", so with this index live, re-saving a search would   │
-- │ answer a duplicate (23505) with a server error instead of "you already    │
-- │ saved this" — worse than the duplicate it prevents. The route must learn  │
-- │ 23505 first; then this, then they ship together.                          │
-- └───────────────────────────────────────────────────────────────────────────┘
--
-- WHY
-- A double-click on "Save recommendations" saved the same run twice:
-- /api/save-search INSERTs unconditionally and nothing downstream caught it.
-- The client now guards the double submit (recommend/page.tsx, saveBusyRef),
-- which fixes the reported bug; this index is the second line — it makes the
-- duplicate impossible rather than merely unlikely, and closes the race the
-- client cannot: the quota check and the INSERT are two separate round-trips,
-- so two concurrent requests can both pass the cap check and both write.
--
-- Not cosmetic: the saved-run cap counts ROWS (plan-enforcement.ts →
-- countUserResourceRows), and Free has three (PLAN_QUOTAS.freeSavedSearches).
-- A stray double-click spent two of them on one recommendation.
--
-- WHAT COUNTS AS "THE SAME SEARCH"
-- The PREFERENCES — the prompt and filters the user actually asked for. Not the
-- `games` (the same query can legitimately return different results as prices
-- and the catalogue move) and not `name` (derived from preferences anyway).
-- So: re-saving a search you already have is refused; running it again and
-- getting fresh results is not affected.
--
-- Deliberately NOT partial on is_active: a run deactivated by a Free-plan cap
-- still exists on the dashboard, so "you already saved this" is still true.
--
-- Verified before writing this: search_profiles held 3 rows and 0 duplicates,
-- so the index applies cleanly. If it ever fails with "could not create unique
-- index", duplicates appeared in between — resolve them deliberately rather
-- than deleting rows blind, they are someone's saved work.
-- =============================================================================

-- md5 of the canonical text, not the raw jsonb: keeps the index key small and
-- well inside the btree limit however large a preferences blob gets. jsonb sorts
-- its keys on storage, so two logically identical objects always hash the same —
-- this would NOT hold for a `json` column, which preserves input order verbatim.
create unique index if not exists search_profiles_user_preferences_uq
  on public.search_profiles (user_id, md5(preferences::text));

comment on index public.search_profiles_user_preferences_uq is
  'One saved run per (user, identical preferences). Duplicate save => 23505, which /api/save-search maps to a friendly "already saved" response.';
