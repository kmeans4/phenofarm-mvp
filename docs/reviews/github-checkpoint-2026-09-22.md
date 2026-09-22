# GitHub project checkpoint — September 22, 2026

This checkpoint preserves the accumulated application reviews and fixes, desktop/mobile UI work, database migrations and rollout scripts, persistent file storage, account recovery implementation, tests, and review evidence.

The checkpoint is published on `codex/project-checkpoint-2026-09-22` for review. Vercel is connected to `main` with automatic production deployment enabled. The September 22 remediation now gates verification enforcement with `AUTH_REQUIRE_EMAIL_VERIFICATION`, defaulting to false so existing pilot logins keep working and public signup stays closed. Keep this PR in draft; production mail delivery and the migration rollout still need their release checks before merge or deployment.

The September 18 storage/database production release deliberately retained the earlier sign-in flow. Full account recovery code is present in this checkpoint but remains an unfinished production activation item. Stripe eligibility also remains unresolved; no subscription billing activation is authorized by this GitHub checkpoint.

Validation for publication: `npm run verify` passed on September 22, covering environment documentation, ESLint, Prisma generation, TypeScript, and the production build. The earlier workflow and browser checks are recorded in [the launch report](launch-2026-09-18.md). Environment files, credentials, local uploads, and generated build/test output are excluded. Sanitized review evidence is included. A documentation example that matched the local authentication secret was replaced with a placeholder. GitHub verification now supplies build-only loopback URLs and an ephemeral authentication key because private environment files are no longer tracked; it receives no production credentials.

This is a GitHub publication checkpoint, not a new production deployment or database migration.

The [September 22 item-by-item remediation log](2026-09-22-remediation.md) records 22 resolved or verified non-METRC findings, focused checks, independent follow-up reviews, and the broader 81-test regression pass. METRC was intentionally skipped. The new additive `20260922010000_order_price_audit` migration was rehearsed only on the isolated local test clone and must precede any future app release.
