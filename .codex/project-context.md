# PhenoFarm Codex Context

## Identity
- App: `PhenoFarm`
- Repo path: `/Users/sam/.openclaw/workspace/phenofarm-mvp`
- Default branch: `main`
- GitHub remote: `https://github.com/kmeans4/phenofarm-mvp.git`

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
- Build: `npm run build`
- Lint: `npm run lint`
- Playwright test: `npm run test`
- Headed test: `npm run test:headed`
- Prisma generate: `npm run prisma:generate`
- Prisma migrate deploy: `npm run prisma:migrate`
- Prisma studio: `npm run prisma:studio`

## Repo notes
- Production auth is configured around `NEXTAUTH_URL`; the current production env points to `https://phenofarm-mvp.vercel.app`.
- This repo mixes local-only and production env files. Confirm the target before changing database or auth behavior.
- Stripe secrets exist outside version control and must stay external.

## Default validation order
1. Run `npm run lint` for broad app/UI changes.
2. Run `npm run build` when touching routing, auth, Prisma, or production config.
3. Run `npm run test` for user-facing flow changes when Playwright coverage applies.
4. Verify the live production URL after deploy when the task is deployable.
