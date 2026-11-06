# PhenoShop: ten workflow improvements

Reviewed November 6, 2026. Implements the ten approved recommendations against baseline `9b63e2e7721d14aab5236d77ff886ed4f08023a8`. The separate development checkout's 71 unpublished files are preserved and excluded from this release.

## What changed and how it was checked

Each affected grower and buyer journey was exercised in Chrome at desktop (1440 × 1000), tablet (834 × 1000) and mobile (390 × 844). Grower-only controls were checked against their resulting buyer state, rather than adding corresponding controls to the buyer app.

| # | Improvement | Verified outcome |
| --- | --- | --- |
| 1 | Free catalog preparation; accurate subscription visibility | Free growers can list/import products. Buyer visibility and new commerce require an active subscription and valid approved license. Expired access blocks new requests/quotes while accepted orders remain accessible. Online billing remains disabled. |
| 2 | Review, negotiate and accept in one workspace | Quantities, current stock, prices and fulfillment details appear together. Saving leaves a request pending. Acceptance checks and deducts final stock atomically. Conflicts leave the transaction unchanged. |
| 3 | Available products first | Available stock is the default. Buyers can include sold-out products; these appear after available products with a compact sold-out state. Drafts and ineligible growers stay hidden. |
| 4 | Clear quick-entry choices | Save draft and Publish product have explicit outcomes. Add another keeps the form open for the next listing. Fractional stock can be entered directly. |
| 5 | Buyer work in progress separated from history | Open requests/accepted orders appear under In progress; completed/cancelled records are under Past orders. Reorder is offered for completed purchases. |
| 6 | Quotes start with request details | Product, quantity and price prefill from a request. Multiple items get a line selector; single-item requests do not. The quoted total updates before sending. Buyer acceptance retains the quote's price and quantity cap. |
| 7 | Pickup and delivery use appropriate language | Pickup progresses through Ready for pickup and Collected. Delivery retains On the way and Delivered. Both roles see matching details; cancelling a ready pickup restores stock once. |
| 8 | Fulfillment can differ by grower | A shared default remains available; a grower can have its own pickup/delivery window and address. Restoring a cart draft and submitting two grower requests retains those differences. |
| 9 | Reports open the underlying records | Product/customer rankings link to existing records. Selected chart months open contributing completed orders using the report's fulfillment date basis and intersected date range. |
| 10 | Fractional weights work throughout | Weights support three decimal places; packs/pieces/pre-rolls remain whole counts. Listing edits/imports, carts, quotes, acceptance, batch actions, cancellation and reorder preserve quantities. Line prices round consistently to cents. |

## Verification and review

- 37 focused Playwright checks passed across `tests/workflow-improvements.spec.ts` (11), `tests/order-acceptance-inventory.spec.ts` (19), and `tests/chart-review-20261029.spec.ts` (7). The browser journeys include both roles at all three sizes. The final targeted rerun also exercises add-another, the sold-out filter control, and all report destinations.
- Inventory coverage includes competing requests, simultaneous acceptance, insufficient stock, repeated actions, negotiated quantities/prices, multi-item rollback, batch rollback, cancellation, legacy pending orders, fractional quotes and exact restoration.
- Chart coverage includes calendar/DST boundaries, value agreement, empty/zero/large states, keyboard/touch interaction and CSV/PDF exports.
- `npm run verify` passed: environment documentation, ESLint, Prisma generation, TypeScript and optimized production build. The isolated local email provider is intentionally incompatible with production email enforcement, so this local build used `AUTH_REQUIRE_EMAIL_VERIFICATION=false`. Production was separately verified to retain `true`, HTTPS, and Resend. No production setting was weakened.
- Reviewed source changes and captured screens after fixes. Review resolved a stale price-alert eligibility query, a blank pickup window in request review, delayed quote-product display, action-button contrast, and unstable report-row keys. Browser checks monitor uncaught errors, server errors and page overflow.
- Tests use an isolated local database. Existing production seed records are retained. Test-created local fixtures are cleaned up within the isolated test database; the original local audit database is unchanged. Private screenshots/logs remain under `.codex/tmp/workflow-improvements-2026-11-06/`.
- A Node tooling deprecation warning remains in the local build; lint, type checking and the build succeed. This is not a browser/runtime failure.

## Migration and compatibility

Migration `20261106120000_fractional_selling_quantities` widens four quantity columns to exact `NUMERIC(16,3)`, adds quantity checks, and advances the order-writer guard to `acceptance-v2`. Selling units/types cannot be changed after use in orders or quotes, preventing later restoration in a different unit.

The exact migration passed a separate local rehearsal. Normalized full-row fingerprints, counts, stock quantities, order quantities, quotes, messages and order statuses matched before/after. No order inventory states are reclassified or reconciled by this migration. `LEGACY_UNREVIEWED` orders remain blocked pending an explicit inventory review.

Production preflight found only this migration pending, no unresolved failed migrations, both inventory writer guards enabled, and no legacy-unreviewed orders. Existing production inventory states were two DEDUCTED and five NOT_DEDUCTED.

Release order: prepare a ready production candidate without moving domains; take a fresh database snapshot and baseline; apply the reviewed widening migration; verify unchanged business data; promote the prepared candidate; check the canonical domain. During the short migration/promotion interval, old order writers are rejected rather than allowed to change fractional data.

Rollback must preserve the widened schema and v2 writer guard. After fractional writes, do not narrow columns or promote the old integer-only application; use a forward fix. Snapshot recovery is a separate data-recovery operation, not a routine application rollback.

## Account and payment boundary

All five current production growers were free/inactive at preflight. Their statuses are preserved, so their listings become hidden under the approved subscription rule until access is activated. The local tests independently exercise active, inactive and expired subscriptions. This release does not grant test accounts a subscription, collect subscription fees, or process wholesale payments.

## Release record

- Application commit: `bf532ad11ba3bd64dbb121e4f4af19df84f7b267`, built from the clean task worktree. Release documentation is a subsequent documentation-only commit.
- Vercel deployment: `dpl_54PgRW8iT3RpAwcxkUjuUfLMBcPk`, READY. Built with production settings before migration, then promoted on November 6, 2026. Canonical `phenoshop.app` and the existing aliases were verified against this deployment. Immutable build: `https://phenofarm-pym3rkual-kevin-means-projects.vercel.app`.
- Fresh backup: Neon snapshot `snap-polished-lake-aijm22vl`, created at 19:32:59 UTC and retained through December 11, 2026. Existing daily backups and recovery history remain configured.
- Production migration completed at approximately 19:33 UTC. All 28 repository migrations are applied. All four quantity columns are `NUMERIC(16,3)` and the v2 writer guard is active. There are no invalid stock, item, offer or quote quantities.
- Business-data fingerprints matched before migration, immediately after migration, and after live smoke checks. Retained: 12 products with total stock 2,962 selling units, 7 orders, 10 order items, 21 conversation messages, 1 accepted quote, and unchanged grower/buyer profiles. The stock sum is an integrity check across differing selling units, not a business metric.
- 42 read-only live page checks passed: four public pages plus five grower and five buyer screens at each of the three widths. Thirty signed-in screenshots were captured and representative live layouts visually reviewed. No browser exceptions or HTTP 5xx responses were observed; Vercel returned no error/fatal runtime log groups for the checked deployment/window.
- Live authentication used temporary ten-minute sessions for existing verified `support+` seed accounts. Password sign-in, email delivery, billing and live business transactions were not retested. Browser mutations were blocked, including automatic price-alert refresh requests; price-alert refresh itself passed the isolated local regression test.

End-to-end business transactions were tested locally. Production checks did not submit requests, change inventory, send messages, activate subscriptions or delete seed records.
