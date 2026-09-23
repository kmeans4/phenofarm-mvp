# Retired integration removal — September 23, 2026

Removed METRC from the active app without retaining future-integration scaffolding:

- Removed the grower Settings integration card and its section-navigation link.
- Removed public and signed-in pricing claims, the landing-page marquee claim, and the FAQ promise. The FAQ now describes the product records the app actually stores.
- Removed current design/feature/route documentation and roadmap references, plus the unused public app URL configuration documentation.
- Removed the retired API key, secret, and URL from the ignored local environment files. Vercel production, preview, and development have no such keys.
- Verified there are no runtime services, API routes, navigation items, dependencies, Prisma models, scheduled tasks, or tests implementing the retired integration.

## Database removal

Migration `20260923010000_remove_retired_tracking_integration` drops `metrc_sync_logs` and `products.lastSyncedAt` in one transaction, with a five-second lock timeout and without cascading deletions. It is excluded from the additive-only migration phase.

Confirmed the production target against Vercel's current database setting and the Neon production endpoint. Production had zero sync logs and no populated sync timestamps. A recovery branch, `pre-tracking-removal-20260923` (`br-wild-butterfly-aizyaqre`), preserves the pre-removal database without an active compute.

Rehearsed the exact migration on a copy of production, then applied it to production. Before/after row counts and hashes matched for all 20 application tables (59 records). No retired database objects remain. All 21 previous migration checksums remain unchanged; the removal is the 22nd migration. Also executed the SQL against the isolated local test database, where both legacy objects were already absent, to verify that case succeeds.

## Validation

- `npm run verify`: passed (environment documentation, lint, Prisma generation, TypeScript, production build).
- `node --test scripts/prisma-env-wrapper.test.mjs`: 2 passed, including exclusion of both destructive migrations from additive deployments.
- Grower regressions and order/inventory/import workflows: 38 passed using an isolated local database.
- Landing page, grower Settings, and grower Plans checked at 390px and 1440px, including expanded plan features, the product-record FAQ, and the billing toggle. No retired copy, horizontal overflow, or browser runtime errors.
- Retired `/grower/metrc-sync` and `/api/metrc/sync` routes return 404.

Historical review reports/screenshots, Git history, and applied migration SQL remain accurate archives. They are not integration code or current setup instructions. The new forward migration removes the objects created by the original schema without rewriting applied history.
