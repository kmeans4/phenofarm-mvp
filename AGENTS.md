<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## PhenoFarm Codex Workspace

Read `.codex/project-context.md` for substantive app work or when project identity, commands, or provider boundaries are needed. It contains the repo's current service bindings, validation commands, and deployment targets.

### Operating rules
- Never hardcode secrets. Use env vars from local env files or platform config.
- This repo has both local and production database targets. Confirm which env file is active before running migrations, auth changes, or deploys.
- Prefer existing npm scripts for build, test, lint, and Prisma work instead of ad hoc commands.
- For deployable changes, run the smallest meaningful validation before deploy and verify the production URL after deploy.
- Do not expose Stripe or auth secrets in code, logs, docs, or test fixtures.

## Focused checks

`npm test` runs Playwright workflows, not a unit-only suite. Select the relevant spec and confirm its base URL/database before running it. Use `npm run verify` for broad app changes/releases. Prisma generation belongs before standalone type checks on a clean checkout. Read `.codex/payment-model.md` for billing work; subscriptions and wholesale settlement have different ownership. Cleanup, backfill, and migration commands mutate data and are not routine checks.
