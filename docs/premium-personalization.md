# Premium personalization (Weekly Picks / Deals For You / Monthly Recap)

Per-user personalized premium pages, built on the same caching pattern as
`discovery_rotations` but keyed by user. **Additive only** — no changes to auth,
Stripe, RLS on existing tables, the recommendation pipeline, or `discovery_rotations`.

## Pages

- `/weekly-picks` · `/deals-for-you` · `/monthly-recap`

Each renders one of three states:

- **generated** — the user's cached, published rotation (admin/premium).
- **empty** — premium/admin user with no taste signal yet → "import Steam" empty state.
- **locked** — free → upgrade CTA · anon → login CTA (only reachable when public).

### Access (dormant)

`src/lib/discovery/premium-page-access.ts` exports `PREMIUM_DISCOVERY_PUBLIC`
(currently **false**). While false, only `profiles.plan === 'admin'` can reach
the routes (everyone else gets `notFound()`), preserving the prior admin-only
behavior. Nav links remain admin-only. Flip the flag to `true` to expose premium
(personalized) + free/anon (locked preview) per the access rules.

Admins can preview any state with `?state=empty|locked|generated`.

## Database

`sql/user-personalization.sql` creates two tables (run in the Supabase SQL editor):

- `user_taste_profiles` — one cached taste summary per user. RLS: a user can
  SELECT only their own row; `service_role` writes.
- `user_premium_rotations` — cached personalized content per `(user_id, type,
  period_key)`. RLS: a user can SELECT only their own rows; `service_role`
  generates/publishes.

## Generation

Helpers (`src/lib/discovery/`):

- `buildUserTasteProfile(userId)` — aggregates saved searches, tracked games, and
  Steam import into a structured profile. Returns an **incomplete** profile when
  there's no signal (caller shows the empty state). Never invents data.
- `generateWeeklyPicks / generateDealsForYou / generateMonthlyRecap(userId)` —
  gather real signals (RAWG discovery, ITAD/Steam/CheapShark pricing, activity
  counts), then OpenAI **explains/ranks** on top (best-effort; deterministic
  fallback when `OPENAI_API_KEY` is absent or a call fails). OpenAI is never the
  source of truth.

Pages read the cache only (`resolveUserRotation`): current-period published →
latest published → empty state. They never generate on page load.

## Manual generation endpoint

`POST /api/admin/premium/generate` (or `GET` with query params). Auth mirrors
`/api/admin/discovery/generate`: admin session **or** `CRON_SECRET`.

```
# Admin (logged in), generate + publish for yourself:
POST /api/admin/premium/generate
{ "type": "weekly_picks", "publish": true }

# Cron / specific user:
GET /api/admin/premium/generate?type=deals_for_you&userId=<uuid>&publish=1&secret=<CRON_SECRET>
```

`type` ∈ `weekly_picks | deals_for_you | monthly_recap`. Omit `userId` as an
admin to target yourself. A failed generation is recorded (`status=failed`) and
never overwrites a previously published rotation.

## Manual test

1. Run `sql/user-personalization.sql` in Supabase (staging first); verify in the
   Security Advisor that RLS is on and the only authenticated policy is
   `SELECT WHERE auth.uid() = user_id`.
2. As an admin with some saved searches / tracked games / Steam import, call the
   endpoint with `publish: true` for each type.
3. Visit the page — it should show the **generated** state with an `Admin · …`
   meta line. Use `?state=empty` / `?state=locked` to preview the other states.
4. Confirm a non-admin still gets a 404 (flag is off).
