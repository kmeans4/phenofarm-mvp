# PhenoFarm Codex Context

## Identity
- App: `PhenoFarm`
- Repo path: `/Users/sam/dev/phenofarm-mvp`
- Default branch: `main`
- GitHub remote: `https://github.com/kmeans4/phenofarm-mvp.git`
- Linear project: `PhenoFarm` (`https://linear.app/kmeans/project/phenofarm-84a18a3ae4fa`)

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
- Use the `kmeans-app-workflow` skill for implementation, provider, deploy, and browser-QA work.
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

## Codex Skill Routing

- Default workflow skill: `kmeans-app-workflow`.
- Skill routing matrix: `/Users/sam/Documents/Playground/.codex/skill-routing.md`.
- Workspace skill list: `.codex/workspace.json` under `skills`.
- Invoke provider-specific skills when the work touches Vercel, Neon, Stripe, GitHub, Linear, browser QA, docs, or spreadsheet/data workflows.

## UI Design Skill Defaults

- Use `vercel:shadcn` for production component composition and app UI patterns.
- Use `vercel:react-best-practices` after broad TSX edits.
- Use `vercel:geist` for typography, density, and visual hierarchy polish.
- Use `vercel:v0-dev` for UI ideation and alternate screen drafts.
- Use `vercel:swr` for client-side loading, pagination, optimistic updates, and revalidation.
- Use `vercel:ai-elements` and `vercel:json-render` for AI/chat or structured output interfaces.
- Verify UI changes with `browser:control-in-app-browser`; use `playwright-interactive` or `screenshot` when deeper visual QA is needed.

## RTK Token Efficiency

- RTK is installed globally at `/opt/homebrew/bin/rtk`.
- Shared workflow: `/Users/sam/Documents/Playground/.codex/rtk-workflow.md`.
- Use `rtk-token-efficiency` for noisy shell output, broad repo exploration, test/build output, git diffs/status/logs, and GitHub CLI output.
- Prefer `rtk git status`, `rtk git diff`, `rtk grep`, `rtk find`, `rtk npm run verify`, `rtk npm run build`, and `rtk gh ...` when output may be large.
- Use normal shell commands or `rtk proxy <cmd>` when exact output, full logs, or exact line text matters.
- Telemetry is disabled and should stay disabled unless explicitly requested.
