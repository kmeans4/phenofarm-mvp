# September 22 review remediation

Sources: the checkpoint review at `2a5775f` (reviews `d2379f6`) and the full review at `72fc09f` (reviews older `main`, `d3114dd`). Their original documents are preserved alongside this log. Changes are made and reviewed sequentially on `codex/project-checkpoint-2026-09-22` / draft PR #1. No production deployment or database mutation is part of this work.

The checkpoint independently marked 113 of the original 126 findings fixed. The remaining items are tracked below; full-review new IDs use `Full N-` to distinguish them from checkpoint IDs.

| Item | Status / evidence |
| --- | --- |
| PF-002 | Fixed: SQL projects only the first bounded image URL; catalog, favorites, alerts, and storefronts serve durable URLs directly. Legacy fallback is authenticated, owner-scoped, size-limited, and privately cached. Encoded upload transport still converts to storage URLs before persistence (verified by the product/batch API regression); existing production migration is recorded in the September 18 rollout. Four focused API/browser tests passed, including desktop/mobile legacy compatibility and oversized second-image exclusion. Logo remains selected only where the settings form renders it, as a persisted URL. |
| PF-005 | Skipped: METRC, per user instruction. |
| PF-009 | Fixed: testimonials and CTA copy now render on the server through small motion boundaries; FAQ uses native, keyboard-accessible details and works with JavaScript disabled. Motion was already lazy-loaded and standalone output removed. Interactive pricing/tours retained. Desktop/mobile + no-JavaScript browser check passed. |
| PF-038 | Fixed: product GET always returns a capped page; inventory shares the server query with global SQL totals and filters. Stock/order pickers use debounced, abortable server searches and explicit more-results controls. Four focused browser/API runs passed (55 products, three inventory pages, search beyond the first page, mobile overflow, preserved quantity editing); TypeScript passed. |
| PF-069 | Fixed: marketplace preview fetches 24 listings per page, projects bounded media references, counts globally in SQL, and matches buyer published/in-stock eligibility. Browser check passed with 55 seeded products, a hidden draft, pagination, and mobile width. |
| PF-071 | Fixed: missing and foreign customer/order edit records use the shared not-found page while retaining authorization checks. Four missing/foreign browser paths passed without list redirects or customer details. |
| PF-072 | Fixed: settings and first filtered catalog page load on the server through shared queries. Hydration skips duplicate GETs; filter URL updates use native history to avoid a duplicate server render. Five buyer API/browser checks passed: no duplicate reads, delayed search race, draft restoration, combined filters, and mobile filter state. TypeScript passed. |
| PF-074 | Fixed: storefront first page and subsequent searches use the shared buyer query, scoped to one verified grower; 24 products per page with explicit more-results. Search, type filters, and sorting run across the entire shop. Two desktop/mobile browser checks passed, including 52 products, later-page search, other-shop exclusion, and legacy images. TypeScript passed. |
| PF-088 | Already fixed in the reviewed checkpoint: touch handlers are attached only to the drag handle, not the sheet body. Added and passed a mobile regression proving a downward body gesture leaves the dialog open and the same handle gesture closes it. No unnecessary UI change. |
| PF-094 | Fixed: layout and alerts share an account-scoped session refresh promise; failed requests remain retryable, manual refresh still forces an update, and browser storage is optional. One locked SQL update plus batched notifications replaces per-alert writes. Four regression checks passed, including five concurrent refreshes producing one notification and malformed-response preservation. TypeScript passed. |
| PF-112 | Fixed: batch lists omit both testResults and terpenes. One SQL projection counts document objects without transferring their content. API regression passed with null/array/malformed document containers and multi-megabyte legacy values while detail data remains available. |
| PF-116 | Fixed: quantity edits retain persisted agreed-price snapshots; newly added lines use the current database catalog price. Client unitPrice is ignored and no longer submitted by the editor. Dirty detection compares editable fields and line identity/quantity. Three checks passed, including zero-price tampering, inventory reconciliation/cancellation, accepted-quote consumption, and rendered server pages. |
| PF-121 | Pending |
| N-001 | Pending |
| N-002 | Pending |
| N-003 | Pending |
| N-004 | Pending |
| N-005 | Pending |
| N-006 | Pending |
| N-007 | Pending |
| N-008 | Pending |
| N-009 | Pending |
| Full N-001 | Already fixed: managed customers are explicit off-platform contacts, without unusable User/password records. |
| Full N-002 | Covered by PF-116 and N-007 below. |
| Full N-003 | Checkout already clears availability at zero; direct orders covered by N-007. |
| Full N-004 | Already fixed: order detail uses narrow product and dispensary projections. |
| Full N-005 | Confirmed: product detail still includes full batch JSON. Pending. |

## Verification environment

Local app: `http://localhost:3150`; isolated local database: `phenofarm_auth_20260918`; authenticated local mail sink. Real mail delivery, production activation, and Stripe eligibility remain separate launch gates. The branch must remain unmerged until the release gates are satisfied.
