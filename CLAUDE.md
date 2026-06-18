# GamePing AI

Premium AI-powered game discovery and deal-tracking app.

## Stack

- Next.js (App Router)
- TypeScript (strict)
- React 19
- Tailwind v4
- Supabase — auth, database, RLS
- OpenAI — recommendation pipeline
- RAWG — game data
- ITAD (IsThereAnyDeal) — pricing/deals
- Steam API
- CheapShark — pricing fallback
- Stripe — subscriptions
- Vercel — hosting

## Development Rules

### Default mode
UI-only changes unless explicitly requested otherwise.

### NEVER touch without explicit permission
- Supabase auth
- RLS policies
- Database schema
- Stripe checkout
- Stripe webhooks
- Recommendation pipeline
- AI prompts
- RAWG / ITAD / Steam integrations
- API routes
- Analytics

### Before editing
1. Inspect existing files/components.
2. Understand the current architecture.
3. Reuse the existing design system.
4. Make minimal, targeted changes.

### After editing
1. Run `npm run build`.
2. Report:
   - Changed files
   - What changed
   - Confirm protected systems were left untouched

## Current Project Phase

Full UI redesign / polish.

### Focus order
1. Finish `/upgrade` page
2. Landing page polish
3. `/recommend` page redesign
4. Game detail page redesign
5. Dashboard polish

## Design Direction

- Premium gaming discovery
- Clean but emotional — not generic SaaS
- Dark mode first; light mode supported
- Cyan GamePing identity
- Tasteful colors
- Soft cards
- Smooth motion

## Important

- Quality over speed.
- Avoid large rewrites.
