# Order inventory lifecycle

## Contract

- Buyer checkout snapshots products, prices and accepted quotes into a PENDING request with `inventoryState=NOT_DEDUCTED`. It checks the currently displayed stock, but never reserves or deducts it. Different buyers may request the same stock. A receipt/idempotency key still prevents duplicate submission of one intent.
- Growers can negotiate quantities/prices on pending requests, including a quantity exceeding today's stock. Pending edits, line removals, withdrawals and declines do not change inventory. Existing accepted-quote price/quantity protections still apply.
- Acceptance claims the order's status/version, locks all affected products in ID order, aggregates split lines by product, checks/decrements final quantities, writes `DEDUCTED`, status, event and notification in one transaction. Insufficient stock rolls everything back and returns HTTP 409 with product/quantity details.
- Already accepted edits apply only the difference between old and final quantities. Cancellation restores the final deducted quantities exactly once and changes the accounting state to `NOT_DEDUCTED`. A repeated action is a no-op or a conflict; it never repeats a stock movement.
- Undoing acceptance returns the order to PENDING and releases its deduction. Undoing a pending cancellation does not deduct stock. Undoing an accepted cancellation must recheck and deduct stock; failure leaves the cancelled order unchanged.
- Batch changes claim all order rows in ID order, then lock their combined product IDs in order. A stock failure rolls back the entire batch. Existing invalid-transition/skipped-order reporting is retained.
- Grower-recorded phone orders remain immediately CONFIRMED: creation is the grower's acceptance, so their existing atomic stock deduction remains and is recorded as `DEDUCTED`. The explicit received-stock correction remains separately acknowledged in that flow.
- Growers may accept previously requested products they manually hid from the catalog if sufficient stock remains; deleted products cannot be newly deducted. Restoring stock reopens an exhausted published listing only, preserving manual hiding of stocked listings.

## Historical orders: explicit review required

The additive migration `20260930120000_order_inventory_lifecycle` adds an accounting enum/column. **It does not change inventory quantities.** Every preexisting order becomes `LEGACY_UNREVIEWED`; the database default also quarantines orders created by an old application version. New code explicitly writes the appropriate state.

We cannot safely conclude that a historical PENDING order is reserved simply from its status: earlier versions, manual fixtures or repairs may have used different accounting. The new code therefore blocks its acceptance, cancellation, undo and item edits with `LEGACY_INVENTORY_REVIEW_REQUIRED`. Accepted historical orders also require review before stock-affecting changes. This is deliberate, not an automatic backfill.

For each historical order, reconcile its current items, inventory ledger/exports/backups and known previous operations. Record whether its **current quantities are still deducted** (not merely whether there was ever a deduction). If the evidence is uncertain or only some quantities were deducted, leave the order blocked for individual reconciliation.

| Reviewed order | Required action |
| --- | --- |
| PENDING; current quantities already deducted | Atomically restore those quantities and mark NOT_DEDUCTED. Later acceptance performs the new deduction. |
| PENDING; no outstanding deduction | Mark NOT_DEDUCTED without changing stock. |
| CONFIRMED / PROCESSING / SHIPPED / DELIVERED; verified outstanding deduction | Mark DEDUCTED without changing stock. |
| CANCELLED; no outstanding deduction | Mark NOT_DEDUCTED without changing stock. |
| Accepted but never deducted, cancelled with outstanding deduction, partial or unknown accounting | Stop. Obtain an individually reviewed correction; do not guess or automatically change stock. |

`reconcileLegacyOrder` checks the reviewed `updatedAt` and the unknown accounting marker, claims the order, records an operator-review history note, and reconciles atomically. Repeating the same review cannot restore stock twice. The operational script defaults to a read-only dry run and **refuses all non-local databases**.

Example reviewed manifest (use actual internal order IDs and exact timestamps):

```json
[
  {
    "id": "reviewed-internal-order-id",
    "expectedUpdatedAt": "2026-09-30T12:00:00.000Z",
    "stockWasDeducted": true
  }
]
```

Local rehearsal commands (environment must identify the isolated local database):

```sh
node --env-file=/path/to/local-rehearsal.env node_modules/tsx/dist/cli.mjs scripts/reconcile-order-inventory.ts reviewed-manifest.json
node --env-file=/path/to/local-rehearsal.env node_modules/tsx/dist/cli.mjs scripts/reconcile-order-inventory.ts reviewed-manifest.json --apply
```

The `--apply` manifest is one transaction: any stale/inconsistent review rolls it all back. Large reconciliations should be split into small reviewed manifests while order mutations are paused.

### Production cutover procedure

1. Obtain approval for the schema migration, the reviewed manifest and the exact quantity changes. Take and verify a backup/export of affected orders, items and product balances.
2. Pause all order creation/edit/status/cancellation writers and drain in-flight requests, including old deployments. Do not overlap old and new writers: old cancellation code could incorrectly restore a new unreserved request.
3. Apply the additive schema migration through the existing guarded migration workflow. Reconcile only approved historical orders using a separately approved production procedure; the included CLI intentionally cannot target production.
4. Deploy the new application while writers remain paused, validate state/balance totals, and reopen writes. Keep ambiguous orders quarantined. Existing accepted-quote consumption is unchanged.
5. Observe acceptance, cancellation and insufficient-stock behavior, and compare balance movements with the reviewed baseline. An old application rollback is unsafe after new NOT_DEDUCTED requests exist; pause writers and plan a forward fix or a separately reconciled rollback instead.

**Approval recorded:** the user approved production migration, reconciliation and release after the local handoff. The September 30 production outcome is recorded below. Future legacy repairs still require evidence of their actual outstanding deductions.

## Verification record

Local baseline: checkout `9caa954`, with only the existing untracked `output/` directory before this work. That directory was preserved.

All database mutations and workflow tests use the isolated local database `phenofarm_auth_inventory_20260930` on localhost, with the app at `http://127.0.0.1:3145`. `.env.local` itself still targets the existing local `phenofarm` database and was not edited.

The complete historical migration chain could not bootstrap an empty database: an early migration expects `growers` to exist. Rehearsal therefore installed the schema from `9caa954` into the isolated database, then successfully applied the new migration SQL. This validates the incremental schema change; it does not certify fresh installs through the old migration chain.

### Results

**31 distinct targeted checks passed during initial local validation.** No production data or retained live fixtures were touched during that phase. The isolated regression fixtures were cleaned by their tests. The approved release added a writer-guard regression, making 32 distinct targeted checks; all 18 tests in the new inventory suite passed again before release.

| Coverage | Passing checks |
| --- | ---: |
| New inventory lifecycle suite: competing requests, concurrent accept/cancel, rollback, negotiation, split lines, batches, undo, racing edits, legacy reconciliation and local CLI guards | 15 API/database/CLI |
| New rendered grower/buyer flows at 1440px and 390px: edit quantities/pricing, save without deduction, fail acceptance without mutation, replenish and accept, pending and legacy messaging, no horizontal overflow | 2 browser |
| Checkout receipt deduplication, partial completion/retry and dropped-response recovery at both widths | 5 |
| Existing direct-order/status/quote/stock-correction and opposing-editor regressions | 4 |
| Existing accepted quote, unique direct order IDs, item editing/cancellation, fulfillment/batch transitions and locked catalog-price snapshot checks | 5 |

- `npm run verify`: passed environment validation, repository ESLint, Prisma generation, TypeScript validation and production build. After the final legacy UI copy/data selection changes, repository lint and then focused lint plus `npx tsc --noEmit` passed again. The final UI was rendered and exercised in the browser; the production build preceded that small UI follow-up.
- `git diff --check`: passed.
- The new additive SQL migration applied successfully to the isolated database containing the baseline schema.
- Screenshots were reviewed at desktop/mobile sizes. Saved examples: [request editor](order-inventory-evidence/editor-1440.png), [mobile stock error](order-inventory-evidence/insufficient-390.png), [buyer request](order-inventory-evidence/buyer-390.png).
- Existing stale fixtures were corrected: account-scoped cart storage, omitted prices when a test intends to retain/catalog-price a line, a batch transition from an already-confirmed direct order, current request labels, and PENDING inventory expectations. Browser selectors now exclude hidden retained pages and target the actual quantity field.

Commands used with the isolated environment exported:

```sh
npm test -- tests/order-acceptance-inventory.spec.ts tests/launch-workflow-fixes.spec.ts tests/order-inventory-and-import.spec.ts tests/ux-grower-20260929.spec.ts --grep 'competing|simultaneous|insufficient stock|negotiated quantities|pending line|accepted edits|batch acceptance|mixed pending|undo acceptance|acceptance racing|legacy pending|legacy undeducted|legacy rehearsal|direct grower|grower and buyer see|request receipts|partial requests|lost response|server failure after|order edits reconcile|snapshot a new line|grower can accept|accepted quote is consumed|rapid direct|manual orders are|quoted manual|opposing order edits|explicit shortage correction' --reporter=line
npm test -- tests/order-acceptance-inventory.spec.ts tests/order-inventory-and-import.spec.ts --grep 'grower and buyer see|order edits reconcile|snapshot a new line|grower can accept' --reporter=line
npm test -- tests/order-acceptance-inventory.spec.ts tests/order-inventory-and-import.spec.ts --grep 'grower and buyer see|snapshot a new line|grower can accept' --reporter=line
npm run verify
npm run lint
npx tsc --noEmit
```

The main 31-check run passed 26 checks; the remaining five passed in focused reruns after the corrections above (one item-edit regression, then four UI/status/price-lock checks). Logs are in `/tmp/phenoshop-inventory-final-tests.log`, `/tmp/phenoshop-inventory-followup-tests.log`, `/tmp/phenoshop-inventory-final-ui.log`, `/tmp/phenoshop-inventory-verify.log`, `/tmp/phenoshop-inventory-final-types.log`, and `/tmp/phenoshop-inventory-final-lint.log`.

### Limits and unrelated findings

- This was targeted lifecycle validation, not a claim that every historical test in the repository passes. The older buyer audit received label updates but was not run in full.
- An earlier overly broad test filter included the unrelated product-import regression: it expected HTTP 422 but received 200. That import test/behavior was left outside this inventory change. Its failure is recorded in `/tmp/phenoshop-inventory-regressions.log`.
- Fresh-database migration-chain bootstrap remains unverified because of the preexisting missing-base-table failure described above. The incremental production migrations were applied successfully after approval.
- Initial handoff was local only. Production work started only after the subsequent explicit user approval; see the release record below.


## Approved production release — September 30, 2026

- Canonical URL: https://phenoshop.app.
- Ready deployment: `dpl_HC5CeedP7iaWqMfvm9nvm9aDLDBT`, `phenofarm-687tbp9a6-kevin-means-projects.vercel.app`; canonical alias read back after promotion.
- Prior deployment: `dpl_BMhYtutmFihVaodcgCWjbeTBr1rb`. An old application rollback is now intentionally blocked from order writes.
- Native Neon snapshot: `snap-jolly-leaf-aim1skeq`, created 2026-09-30 13:27:03 UTC on verified production branch `br-wandering-snow-aig9frhe` in project `little-salad-95928561`; snapshot listing confirmed it exists. No restore was performed over production.
- Private, mode-0600 before/after exports, reviewed manifest and live evidence: `.codex/tmp/inventory-cutover-20260930/` (ignored; not shipped or committed). Backup includes every order, item, product, accepted quote and status event. Pre-change export SHA-256: `348754b60208c2db5803511a92e5ba596ce8d9bff89152e9497e99785ce0b768`.
- Both migrations applied through the existing guarded production command: `20260930120000_order_inventory_lifecycle` and `20260930121000_order_inventory_writer_guard`. No other migrations were pending and no failed migration records existed.
- The candidate was built from `9caa954` plus the task's verified changes, excluding private env files, unrelated `output/`, uploads and QA artifacts. It was submitted with `--prod --skip-domain`, reached Ready, then was promoted after reconciliation. The canonical domain remained on the prior deployment until promotion.

### Old-deployment write protection

The second migration installs statement triggers on `orders` and `order_items`. Only transactions marked by `beginOrderMutation()` with `phenoshop.inventory_writer=acceptance-v1` may create, edit or delete order records. The marker is transaction-local and cannot leak between pooled sessions. New checkout, direct-order creation, claimed order changes, reconciliation and buyer acknowledgement set it. All supported order mutations still commit stock and order changes together.

The trigger installation drains active order writers through table locks. After installation, an older checkout/edit/cancellation transaction fails and rolls back any preceding stock adjustment. This protects direct URLs for older deployments as well as the previous canonical alias. Keep the guard in place; restoring older application code or removing the guard is not a safe rollback. Operator scripts that modify orders must use the same explicit transaction helper after reviewing their stock accounting.

Local regression installed the production guard and verified: old-style stock restoration followed by cancellation rolls back, unmarked item edits fail, current checkout/direct creation/edit/batch/cancel/reconciliation/acknowledgement succeed, and the transaction marker does not leak. All **18 inventory-suite checks passed** after this change. `npm run verify` passed again on the final application source, including lint, TypeScript and production build; Vercel's build also passed.

### Reviewed historical accounting

The five production records and balances matched the retained September 24 QA evidence in `docs/reviews/grower-manual-seed-2026-09-24/BUYER-GROWER-TEST.md` and its machine-readable snapshot. Classification was based on that evidence and the matching current records, not status alone.

| Existing request | Reviewed state | Reconciliation |
| --- | --- | --- |
| `ORD-20260924-9E5D5M` | Accepted, verified deduction | DEDUCTED; stock unchanged |
| `ORD-20260924-J25YTY` | Delivered, verified deduction | DEDUCTED; stock unchanged |
| `ORD-20260924-Q4L4DQ` | Cancelled, restoration verified | NOT_DEDUCTED; stock unchanged |
| `ORD-20260924-VMQT5E` | Cancelled, restoration verified | NOT_DEDUCTED; stock unchanged |
| `ORD-20260924-DCHIYM` | Pending, one Aurora Mint unit still deducted | Released one unit: **11 → 12**; NOT_DEDUCTED |

The reviewed manifest was applied as one transaction after comparing all original order/item/product/quote/event records against the backup under row locks. A first attempt rejected a manifest timestamp that had lost millisecond precision; the entire transaction rolled back without changes. The corrected manifest used the exact exported timestamps and succeeded. Readback confirmed all five original order business fields, statuses, items and accepted quotes were preserved; only the approved stock release, accounting markers, order version timestamps and five audit-history entries changed. **Zero orders remained LEGACY_UNREVIEWED.**

### Live functional proof

Using the existing labelled test grower and buyer, two additional requests were created and **retained**, with notes stating that no real shipment or payment was intended:

- [First QA request](https://phenoshop.app/dispensary/orders/cmuo59pys0002ii041xxo0rmm): accepted, then cancelled after verification.
- [Competing QA request](https://phenoshop.app/dispensary/orders/cmuo59q3y000aii04xlepgldj): acceptance rejected for insufficient stock, then withdrawn.

Both requested the same eight units of TEST — Frosted Pine Flower. Stock remained 8 after both submissions, became 0 when the grower accepted the first, stayed 0 after a repeated acceptance and the competing acceptance failure, stayed 0 after withdrawing the unaccepted request, and returned to 8 exactly once after cancelling the accepted order. A repeated cancellation left stock at 8. A production database old-style cancellation attempt was rejected by the guard and its attempted stock restoration rolled back.

Grower acceptance and the insufficient-stock message were exercised in Chrome at desktop/mobile widths; buyer cancellation history was checked at 390px without horizontal overflow. [Live mobile stock error](order-inventory-evidence/live-insufficient-mobile.png) and [buyer history](order-inventory-evidence/live-buyer-mobile.png) were visually reviewed. The two original public smoke checks also passed (2/2). Final readback confirmed the five original orders were untouched by these new tests and every product's stock/availability matched the post-reconciliation baseline.

Release logs: `/tmp/phenoshop-inventory-cutover-tests.log`, `/tmp/phenoshop-inventory-cutover-verify.log`, `/tmp/phenoshop-inventory-production-migrate.log`, `/tmp/phenoshop-inventory-production-reconcile-v2.log`, `/tmp/phenoshop-inventory-production-verify.log`, `/tmp/phenoshop-inventory-live-proof.log`, `/tmp/phenoshop-inventory-live-smoke.log`, and `/tmp/phenoshop-inventory-promote.log`.
