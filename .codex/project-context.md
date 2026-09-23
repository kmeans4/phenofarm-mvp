# PhenoFarm Codex Context

## Identity
- App: `PhenoFarm`
- Repo path: `/Users/sam/dev/phenofarm-mvp`
- Default branch: `main`
- GitHub remote: `https://github.com/kmeans4/phenofarm-mvp.git`
- External project tracker: none configured.

## Service bindings

### Vercel
- Team: `Kevin Means' projects`
- Team ID: `team_APmavOTWRi3vWAznGnDEny9T`
- Project name: `phenofarm-mvp`
- Project ID: `prj_9pLewagwNf3uOA2sle3r0O3RlQkv`
- Latest production deployment: `phenofarm-ohtolskyn-kevin-means-projects.vercel.app`
- Production domains:
  - `phenofarm-mvp.vercel.app`
  - `phenofarm-mvp-kevin-means-projects.vercel.app`
  - `phenofarm-mvp-kevin-means-4766-kevin-means-projects.vercel.app`

### Neon / Postgres
- Local env source: `.env.local`
- Production env source: `.env.production`
- Local database host: `localhost`
- Local database name: `phenofarm`
- Production pooled host: `ep-delicate-math-ai8g76ti-pooler.c-4.us-east-1.aws.neon.tech`
- Production database name: `neondb`
- Expected env vars:
  - `DATABASE_URL`
  - `NEXTAUTH_URL`
  - `AUTH_SECRET`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_API_URL`

## Working commands
- Install: `npm install`
- Dev: `npm run dev`
- Verify: `npm run verify`
- Build: `npm run build`
- Lint: `npm run lint`
- Playwright test: `npm run test`
- Headed test: `npm run test:headed`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate deploy: `npm run prisma:migrate`
- Prisma studio: `npm run prisma:studio`

## Repo notes
- Use `kmeans-app-workflow` when coordinating multiple projects or resolving shared workflow boundaries.
- Read `.codex/provider-runbook.md` before provider, env-var, auth, billing, database, or deployment work.
- Production auth is configured around `NEXTAUTH_URL`; the current production env points to `https://phenofarm-mvp.vercel.app`.
- This repo mixes local-only and production env files. Confirm the target before changing database or auth behavior.
- Stripe secrets exist outside version control and must stay external.
- Payment model note: `.codex/payment-model.md`. PhenoFarm processes cultivator subscriptions only; wholesale settlement stays direct between businesses.

## Default validation order
1. Run `npm run lint` for broad app/UI changes.
2. Run `npm run verify` when touching routing, auth, Prisma, or production config.
3. Run `npm run test` for user-facing flow changes when Playwright coverage applies.
4. Verify the live production URL after deploy when the task is deployable.

## Codex Guardrail Commands

- `npm run env:check`: validate that `.env.example` documents the required and optional keys for this app.
- `npm run env:check:runtime`: validate local runtime env files after secrets have been configured outside chat.
- `npm run smoke`: run the shared Codex smoke spec against `SMOKE_BASE_URL` or the local dev URL.
- `npm run verify`: app-level verification; this now starts with `env:check`.

## Task-scoped tools and context

- Start with `AGENTS.md`; load a provider runbook only when provider state or release behavior is in scope. Recorded deployment IDs, database counts, account access, and environment descriptions are snapshots; verify the active target before a live claim or mutation.
- Use skills actually available in the session when the task needs them. Prefer existing UI primitives and data-fetching patterns. UI work alone does not require shadcn, SWR, v0, or AI component libraries.
- Use the available browser tools for rendered checks. `playwright-interactive` is optional when its persistent runtime is already available; do not reconfigure Codex just for ordinary QA.
- Follow global RTK guidance for noisy commands. Use bounded `rg` searches and exact reads when needed; no separate Playground routing/workflow file is required.
- Run focused checks during iteration. Before broad changes or releases, run the aggregate verification once; its included checks do not need separate duplicate runs. Specialized release gates in `AGENTS.md` take precedence. Documentation-only changes need consistency/link checks, not an application build or deployment.
