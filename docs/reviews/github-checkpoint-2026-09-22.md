# GitHub project checkpoint — September 22, 2026

This checkpoint preserves the accumulated application reviews and fixes, desktop/mobile UI work, database migrations and rollout scripts, persistent file storage, account recovery implementation, tests, and review evidence.

The checkpoint is published on `codex/project-checkpoint-2026-09-22` for review. Vercel is connected to `main` with automatic production deployment enabled; merging the full checkpoint would activate account-verification enforcement. Do not merge or deploy that enforcement until its mail provider and verified sender are configured and real delivery has been verified.

The September 18 storage/database production release deliberately retained the earlier sign-in flow. Full account recovery code is present in this checkpoint but remains an unfinished production activation item. Stripe eligibility also remains unresolved; no subscription billing activation is authorized by this GitHub checkpoint.

Validation for publication: `npm run verify` passed on September 22, covering environment documentation, ESLint, Prisma generation, TypeScript, and the production build. The earlier workflow and browser checks are recorded in [the launch report](launch-2026-09-18.md). Environment files, credentials, local uploads, and generated build/test output are excluded. Sanitized review evidence is included. A documentation example that matched the local authentication secret was replaced with a placeholder.

This is a GitHub publication checkpoint, not a new production deployment or database migration.
