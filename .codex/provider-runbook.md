# PhenoFarm Provider Runbook

## Providers
- Vercel hosts the production app.
- Neon/Postgres stores marketplace data.
- NextAuth owns app authentication.
- Stripe owns checkout, subscriptions, payment, and webhook state.

## Expected Env Vars
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `AUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_API_URL`

## Verification Rules
- Do not ask the user to paste secrets into chat.
- Confirm whether the task targets local or production database state before migrations or auth changes.
- Keep Stripe secrets external to code, docs, logs, and tests.
- Use Playwright for user-facing flow checks when changing marketplace/auth/payment paths.

## Default Command
- `npm run verify`

## Flow Tests
- `npm run test`
- `npm run test:headed`
