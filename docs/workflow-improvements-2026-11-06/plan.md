# Ten workflow improvements — implementation and verification

Baseline: 9b63e2e. Branch: codex/workflow-improvements-20261106.
Scope: implement the ten recommendations, exercise both roles at desktop (1440), tablet (834), mobile (390), review, then release. Preserve the separate development checkout and its unpublished launch/referral/activity-email work. No payment activation or invented subscription entitlements.

| # | Change | Grower checks | Buyer checks | State |
| --- | --- | --- | --- | --- |
| 1 | Truthful subscription visibility and plan copy | Free preparation, active/inactive/expired access and license predicates | Catalog/cart/quotes/new requests gated; accepted history retained | Implemented; local checks passed |
| 2 | Review, edit and accept together | Negotiated quantities/prices; atomic accept, shortages, retries, stale edit conflicts | Final terms/status visible; pending stock unreserved | Implemented; local checks passed |
| 3 | Available products first | Stock changes propagate | Available default; sold-out opt-in, available-first ordering and compact sold-out controls | Implemented; local checks passed |
| 4 | Explicit draft/publish quick entry | Draft/publish, optional details, add another, honest visibility | Draft hidden; eligible published visible | Implemented; local checks passed |
| 5 | Active orders and history | Requests and fulfillment match buyer records | In progress/Past orders, messages and completed reorder | Implemented; local checks passed |
| 6 | Contextual quote defaults | Single/multiple item defaults, quantity/price/total editing | Receive/accept quote; quoted cap and price retained | Implemented; local checks passed |
| 7 | Pickup-aware fulfillment | Ready/collected vs on-way/delivered; batch/cancellation rules | Timeline and details match grower actions | Implemented; local checks passed |
| 8 | Per-grower fulfillment | Distinct method/window/address on each request | Mixed pickup/delivery, restored draft, review and checkout | Implemented; local checks passed |
| 9 | Reports lead to records | Product/customer destinations and month links retain meaning | Contributing completed orders agree with buyer history | Implemented; local checks passed |
| 10 | Fractional weights | Listing/import/edit, exact stock arithmetic and restoration | Cart/quotes/requests/reorder; count products reject fractions | Implemented; local checks passed |

Each row requires a desktop, tablet and mobile rendered check for its affected surfaces. Functional checks cover normal and relevant failure states; API/database checks cover concurrency and atomic rollback. Screenshots and private fixtures stay in the ignored task evidence folder. Public final report records only non-secret results.

Release gates: meaningful targeted tests; complete npm run verify; post-implementation review; reviewed migration rehearsal and production target/schema/backup checks; exact-source Git publication/deployment; canonical alias and live public plus signed-in read-only smoke where existing access permits. No production business transactions used for testing.

See [review and release record](README.md) for the final evidence and release status.
