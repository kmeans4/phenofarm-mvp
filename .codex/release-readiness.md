# Release Readiness Notes

Last updated: 2026-06-09

## Current Known State

- Branch: `main`
- Local status before this cleanup: `main...origin/main [ahead 58]` with a large dirty worktree.
- Deployment target: Vercel project `phenofarm-mvp`.
- Production domain: `https://phenofarm-mvp.vercel.app`.

## Required Checks Before Deploy

1. `npm run prisma:generate`
2. `npm run verify`
3. `npm run smoke`
4. Browser QA for:
   - Grower product management
   - Dispensary catalog saved state
   - Dispensary cart request review
   - Admin dashboard/settings
   - Grower subscription settings

## Intentional Exception

Demo sign-in credentials and demo seed access are intentionally retained by request. Review this before a public production launch.

## Data And Payment Rules

- Run migrations only after confirming the target database.
- Keep Stripe secrets outside code and docs.
- PhenoFarm handles cultivator subscriptions only.
- Wholesale buyer-seller settlement stays outside the app.
