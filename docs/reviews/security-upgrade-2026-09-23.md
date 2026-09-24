# Security dependency update — September 23, 2026

Updated Next.js and its ESLint configuration to 16.3.6, React/React DOM to 19.3.0, NextAuth to stable v4.24.15, and csv-parse to 7.0.2. Refreshed vulnerable transitive dependencies in the lockfile. The full npm audit, including development dependencies, changed from 18 reported vulnerabilities to zero. This is dependency-advisory coverage, not a claim that the application has no security defects.

The release checks also exposed and corrected three regressions:

- Concurrent first submissions could race during receipt creation. An atomic conflict-tolerant insert now shares the original receipt without overwriting its payload. Eight simultaneous attempts return the same order, consume a quote once, and reserve inventory once.
- The notification bell could send two startup count requests during React's development effect remount. A cancelled startup no longer sends the redundant request; existing polling, visibility handling, details, and read retries remain covered.
- Daily delivered-value filtering compared UTC database timestamps with timezone-aware parameters implicitly. Bounds now convert explicitly to UTC, preserving the current calendar day when the database connection uses another timezone. Boundary and displayed-total checks cover the correction.

CSV export tests now use the parser's typed result API. The subscription test respects intentionally disabled billing instead of assuming that stored subscription IDs alone make the portal available. No billing provider is enabled by this release.

## Validation

- Full dependency audit: **0 vulnerabilities**.
- `npm run verify` passed: environment documentation, lint, Prisma generation, type checking, and optimized production build. Both `npm run smoke` checks passed. The smoke runner now honors the same optional `PLAYWRIGHT_CHANNEL` setting as the main workflow runner.
- **112 workflow tests passed** across account recovery, auth rollout, review regressions, grower/buyer workflows, order inventory/import, launch fixes, and admin/product APIs. The account suite includes both verification-enforced and pilot configurations on separate local servers.
- Tests used the isolated local `phenofarm_auth_security_20260923` database, with mail delivered to a local test sink. Production credentials and the ordinary development database were not used by these tests.
- Desktop/mobile coverage includes signup and recovery, profile saves, catalog/product management, lost-response recovery, concurrency, quotes, inventory, fulfillment, cancellation, settlement notes, CSV exports, admin approvals, and cross-account boundaries. Product-list screenshots were inspected at desktop and 390px widths.
- No database migration is required.

The custom website domain and support-email changes are a separate release step. They must wait for registrar access, working website DNS/HTTPS, and confirmed support forwarding before changing the production auth origin or public support links.
