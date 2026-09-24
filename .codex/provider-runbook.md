# PhenoFarm Provider Runbook

## Providers
- Vercel hosts the production app.
- Canonical website/auth origin: `https://phenoshop.app`. The `www` name and former `phenofarm-mvp.vercel.app` canonical hostname redirect there with status 308.
- Neon/Postgres stores marketplace data.
- NextAuth owns app authentication.
- Resend delivers account verification and password-reset emails from `accounts@phenoshop.app` through a Vercel Marketplace integration.
- Porkbun hosts the human support mailbox `support@phenoshop.app`. Keep its root MX/SPF and `default._domainkey` separate from Resend's `send` MX/SPF and `resend._domainkey`; both senders use the same domain.
- Stripe is intended for cultivator software subscriptions; wholesale orders and settlement remain direct between businesses. Follow `.codex/payment-model.md` before billing changes.

## Expected Env Vars
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `AUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_API_URL`
- `AUTH_MAIL_PROVIDER` (`resend` in production)
- `AUTH_MAIL_FROM` (`PhenoFarm <accounts@phenoshop.app>` in production)
- `AUTH_MAIL_REPLY_TO` (`support@phenoshop.app`; the Porkbun mailbox has been created and incoming delivery verified)
- `RESEND_API_KEY` (provided by the Marketplace integration; never print its value)
- `AUTH_REQUIRE_EMAIL_VERIFICATION` (`true` in production)

## Verification Rules
- Do not ask the user to paste secrets into chat.
- Confirm whether the task targets local or production database state before migrations or auth changes.
- Keep Stripe secrets external to code, docs, logs, and tests.
- Use Playwright for user-facing flow checks when changing marketplace/auth/payment paths.
- Email enforcement is active after verified sender DNS and a real inbox-delivery confirmation. Do not mark accounts verified manually or reset a real user's password during tests. Resend's labeled test recipients support isolated end-to-end links but do not prove real inbox placement.

## Default Command
- `npm run verify`

## Flow Tests
- `npm run test`
- `npm run test:headed`
