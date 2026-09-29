# September 29 UX audit implementation

This work implements the 270 findings in the [supplied audit](source-audit.md), including the overlapping removals in section 4. The starting revision was `b9273dc` on `main`.

## Item-by-item record

| Area | Findings | Implementation and evidence |
| --- | --- | --- |
| Shared UI, navigation, public pages, account access, messaging and admin | 96 | [Shared and admin checklist](shared-admin-auth.md) |
| Grower overview, orders, customers, reports, settings and billing | 72 | [Grower checklist](grower-orders.md) |
| Products, imports, inventory, strains, batches and lab documents | 49 | [Products checklist](products.md) |
| Buyer onboarding, catalog, cart, orders, saved items and alerts | 53 | [Buyer checklist](buyer.md) |

The checklists distinguish source review, actual browser/API/database checks, and mocked provider states. Low-risk wording changes do not each have a separate test.

## Implementation decisions

- One Products page owns product details, price, stock and availability. Old Catalog and Inventory links redirect into it.
- Phone navigation exposes the main tasks, with More for secondary pages. Shared form controls, clearer borders, readable labels, larger targets, inline errors, restore prompts and Undo replace repeated instructions and confirmation steps.
- Verification signs users in automatically. A link opened in its original signup browser needs no password re-entry. A different browser asks the mailbox owner to choose a **new** password, preventing someone else from pre-creating an account with a password they know. Reset also signs in and revokes old sessions.
- Whole-number stock remains the underlying inventory contract. Weight listings explain how to choose a smaller selling unit for fractional quantities; the audit explicitly allowed this alternative.
- All supported US states and territories remain available. Vermont and New Jersey have direct registry links; other states use the regulator directory. No Vermont-only account restriction was introduced.
- Manual orders can explicitly record newly received stock before reservation. The adjustment and reservation are audited and transactional; ordinary buyer orders cannot oversell.
- Wholesale settlement remains between businesses. Subscription activation/error UI is tested with controlled responses; paid checkout is not enabled by this release.

## Database rehearsal

A fresh production backup was restored into an isolated PostgreSQL 17 container with no network access. The additive migration was applied first inside a transaction and rolled back, then applied and committed. All 24 table row counts were preserved. The 12 new columns, trigram extension, and approved-grower backfill were verified. No production records were changed by the rehearsal.

The migration adds account suspension/signup proof, license review metadata, account cart/defaults, and order-history Undo metadata. It removes no tables or columns. The previous application can run against the expanded schema if code rollback is needed; keep the additive fields rather than discarding new cart/history records.

The private pre-migration archive and detailed rehearsal output are stored outside the repository at `/tmp/phenoshop-ux-20260929/`. Credentials, archive contents, and browser authentication state are excluded from Git and deployment.

## Local verification

The aggregate `npm run verify` passed: environment documentation, ESLint, Prisma generation, TypeScript and the production build. A source-to-ledger check found all **270 unique audit IDs**, with none missing or duplicated.

| Check | Passing workflows |
| --- | ---: |
| Shared account access, admin, messaging, notifications and public pages | 11 |
| Grower orders, customers, settings, reports and concurrency | 11 |
| Product editing, imports, strains, batches and uploads | 10 |
| Buyer catalog, saved items, cart, orders and mobile navigation | 9 |
| Lab download/access regressions | 5 |
| Public account recovery, callback safety and responsive landing page | 5 |
| Lost-response, duplicate-submission and transactional recovery regressions | 3 |
| General smoke checks | 2 |
| Retained-page form labels and validation focus | 4 |

These **60 distinct checks** passed across the integrated run and focused post-fix reruns. Fixtures used an isolated local database and mail sink. The responsive landing checks cover 320, 390, 768 and 1280px, including all five feature previews. Portal checks cover desktop and mobile pages, dialogs, sticky controls, navigation, field validation and rendering errors. Screenshot paths and exact scope are recorded in the area ledgers.

The four additional form-focus regressions covered customer add-to-edit, inline customer creation, order add-to-edit, and product add-to-edit. No duplicate or retained hidden field IDs were reproduced on those paths; no speculative form changes were made.

Additional review fixes included stale admin-decision protection, quote-product draft preservation, transactional stock locking, retained-form label IDs, responsive mobile tab height, and stable reduced-motion/modal hydration.

## Release verification

Production migration `20260929100000_ux_workflows` was applied successfully after a second fresh backup and a rehearsal of the exact atomic SQL. Readback confirmed the source checksum, all 12 new columns, and unchanged business-table record counts. The migration changes are additive; the existing live application remains compatible during the code rollout.

The main implementation was published and merged through [PR #10](https://github.com/kmeans4/phenofarm-mvp/pull/10), commit `9cc32edfbf268d521886779b96fbac1b6fcbb305`. GitHub verification and the Vercel preview passed. Vercel's production build log confirms that exact commit, and the canonical [phenoshop.app](https://phenoshop.app) alias was verified against the Ready production deployment `dpl_FvhDyqzWwLenvBBWLhzXyhTpK6uU`.

### Live production workflow

The complete live check passed on September 29, 2026, from **21:03:21 to 21:04:15 UTC**, using three temporary, clearly labeled accounts:

- Real signup, current policy-acceptance readback, Resend verification links, same-browser automatic sign-in, and a fresh admin session.
- License submission and admin approval for a grower and buyer.
- Real Blob image and **3,000,000-byte PDF** uploads, product/batch persistence, and byte-for-byte readback.
- Buyer COA download through the rendered button, saved download/hash verification, hidden missing-lab controls, anonymous-download rejection and buyer-write rejection.
- Quote acceptance, account-backed cart persistence and restoration in a fresh browser.
- Order submission/retry returning the same receipt, exactly one order, quoted pricing, stock reservation, and the visible Accept/Undo controls.
- Fulfillment through delivery, settlement notes on both detail pages and CSV export, cancellation reason history and restored stock.
- **32 desktop/mobile screenshots** covering the affected admin, grower and buyer surfaces; no page/console errors or horizontal overflow. Representative screenshots were inspected visually, including product detail, cart, delivered orders, reports and settings.

Cleanup removed all accounts, records, notifications and Blob objects created by that run. Database row fingerprints confirmed that all pre-existing business records and retained `TEST` fixtures were unchanged. Shared security counters retain their normal expiry and were deliberately excluded from cleanup. The independent production smoke suite also passed both checks.

Earlier attempts exposed test-harness errors, not application failures: a native response-method mismatch, an unscoped modal selector, and a receipt comparison sensitive to JSON property order. These were corrected, each run's test data was cleaned up, and the complete workflow was repeated successfully. Private evidence is retained at `/tmp/phenoshop-ux-20260929/live-release-mun5yb7ld3689d/proof.json`; it is excluded from Git/deployment.

The final visual review also corrected the timeline's remaining `Ready` label to the shared `On the way` vocabulary, aligned its help text with the shared status description, and removed uppercase styling from the remaining portal/dialog field labels. The nine buyer checks passed again, and the actual order timeline and label layout were checked at 390 and 1280px with no overflow or browser errors. These presentation changes leave the verified API, account, inventory and database behavior unchanged; the aggregate build check and final alias smoke accompany the follow-up release.

### Verification limits

Resend's labeled test recipients prove provider delivery events and working account links, not placement in a human inbox. Synthetic licenses test the review workflow, not real-world license validity. No real payment or subscription charge was attempted. Concurrent-order and injected-failure coverage comes from the isolated local regression suite rather than deliberately interrupting production.
