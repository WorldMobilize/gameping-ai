# Cached discovery rotations — Hidden Gems & Games of the Week

Connects `/hidden-gems` (monthly) and `/games-of-the-week` (weekly) to real
RAWG-generated data via **cached Supabase rotations**. Pages read the latest
*published* rotation from Supabase — no RAWG/ITAD calls on every visit — and fall
back safely to the last published rotation, then to the static curated list.

These pages remain **admin-only** (`AdminOnlyPageGate`). Nothing here is public.

## What was added

- **Table:** `public.discovery_rotations` (service-role only; RLS, no client policies).
  Migration: [`sql/discovery-rotations.sql`](../sql/discovery-rotations.sql).
- **Store helpers:** `src/lib/discovery/rotation-store.ts`
  (`getPublishedRotation`, `getLatestRotation`, `saveRotation`, `publishRotation`,
  `saveFailedRotation`, `resolveRotation`, period-key helpers).
- **Generator:** `src/lib/discovery/generate-rotation.ts` — wraps the existing
  RAWG discovery in `src/lib/discovery/live-discovery.ts` (no new API client/keys).
- **API route:** `src/app/api/admin/discovery/generate/route.ts` (POST + GET).
- **Pages:** `hidden-gems` / `games-of-the-week` now read rotations with fallback
  and show a subtle admin-only metadata line (period, generated time, source).

No new env vars. Uses the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`CRON_SECRET`, and `RAWG_API_KEY`.

## Period keys

- Hidden Gems — monthly, UTC: `2026-06`
- Games of the Week — ISO week, UTC: `2026-W26`

## Fallback order (page reads)

1. Published rotation for the **current** period.
2. Latest published rotation of the same type (shown as a fallback; admin line notes it).
3. Static curated list (`src/lib/discovery/curated-picks.ts`).

Generation failures are recorded as `status = 'failed'` and **never** affect reads.

## Step 1 — run the migration

Run [`sql/discovery-rotations.sql`](../sql/discovery-rotations.sql) in the Supabase
SQL editor (review in staging first). It only creates the new table + trigger and
enables RLS; it does not touch any existing table, policy, or auth.

## Step 2 — generate / publish

### Auth

Either is accepted:

- **Admin session** — logged in with `profiles.plan = 'admin'` (used by an admin button/curl from the browser).
- **Cron secret** — `Authorization: Bearer $CRON_SECRET` or `?secret=$CRON_SECRET` (used by Vercel cron and manual server-side curl).

### Manual curl (cron-secret auth)

```bash
# Hidden Gems — generate a draft only
curl -X POST "https://<your-domain>/api/admin/discovery/generate?secret=$CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"hidden_gems","publish":false}'

# Hidden Gems — generate and publish
curl -X POST "https://<your-domain>/api/admin/discovery/generate?secret=$CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"hidden_gems","publish":true}'

# Games of the Week — generate and publish
curl -X POST "https://<your-domain>/api/admin/discovery/generate?secret=$CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"games_of_the_week","publish":true}'

# GET form (same thing; handy for a browser/cron)
curl "https://<your-domain>/api/admin/discovery/generate?type=games_of_the_week&publish=1&secret=$CRON_SECRET"
```

Local dev: replace the host with `http://localhost:3000`. If `CRON_SECRET` is
unset locally, use an admin session in the browser instead.

### Response

```json
{ "ok": true, "type": "hidden_gems", "periodKey": "2026-06",
  "status": "published", "via": "cron", "itemCount": 11, "featuredCount": 1,
  "sourceSummary": { "source": "rawg", "generator": "live-discovery:getLiveHiddenGemPicks", "itemCount": 11, "featuredCount": 1 } }
```

A failed generation returns HTTP 200 with `"ok": false, "status": "failed"` and an
`error` string — the previously published rotation is untouched.

## Step 3 — manual test checklist

1. `POST … type=hidden_gems, publish=false` → row exists as `draft`.
2. `POST … type=hidden_gems, publish=true` → row flips to `published`.
3. Open `/hidden-gems` as admin → grid shows the new picks; admin line shows the period + generated time.
4. `POST … type=games_of_the_week, publish=true`.
5. Open `/games-of-the-week` as admin → shows the new weekly picks.
6. Fallback: with no published rotation for the current period, the page shows the
   latest published one (admin line notes "showing latest published (fallback)"),
   and with no rows at all it shows the static curated list.

## Cron recommendation (NOT auto-added — see note)

`vercel.json` already defines one cron (`/api/cron`, daily). To automate
rotations, add these entries. Vercel Cron sends `GET` with
`Authorization: Bearer $CRON_SECRET`, which this route accepts.

```jsonc
{
  "crons": [
    { "path": "/api/cron", "schedule": "0 8 * * *" },
    // Games of the Week — every Monday 09:00 UTC
    { "path": "/api/admin/discovery/generate?type=games_of_the_week&publish=1", "schedule": "0 9 * * 1" },
    // Hidden Gems — 1st of each month 09:00 UTC
    { "path": "/api/admin/discovery/generate?type=hidden_gems&publish=1", "schedule": "0 9 1 * *" }
  ]
}
```

> **Why these are documented, not committed:** the Vercel **Hobby** plan caps cron
> jobs (2) and frequency. Adding a third cron there can fail the deploy. Confirm
> the plan limits first, then add the two entries above to `vercel.json`. Until
> then, generate/publish manually with the curl commands. Adding the entries is
> the only change needed — no code change.
