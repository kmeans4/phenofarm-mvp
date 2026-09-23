# Emerald UI redesign — task coverage

Selected reference: `selected-overview.png` (Option 1, 1487 × 1058). Source numbers/products are illustrative; production UI uses actual account data. Additional existing workflows remain accessible. Landing is the visual source, so its design is preserved.

## Validation environment

Local development on port 3144, isolated disposable PostgreSQL database `phenofarm_ui_fixes_emerald_20260923`, no production data/provider writes. Existing migration history lacks a fresh-database baseline; the isolated visual test database uses the current Prisma schema. This task does not change database schema or production migration history.

## Work sequence

1. Shared semantic theme and portal shell: complete, including responsive search, mobile navigation, shared forms, panels, buttons, badges, loading/error/empty styles, toasts, sticky actions, and print colors.
2. Grower overview: complete; source comparison, mobile/desktop/tablet/narrow views, expanded states, and data/focus regressions passed.
3. Grower operational pages: complete — 26 page entries at both widths: products/add/edit/import, inventory/update, requests/add/detail/edit/history, catalog/preview, customers/add/edit/statement, strains/add/edit, batches/add/edit, reports, settings, pricing, overview.
4. Buyer pages: complete — 10 page/view entries at both widths: overview, catalog, storefront, saved/favorites/alerts, draft, requests/detail, settings. Empty and populated drafts and catalog dialogs were reviewed separately.
5. Admin/auth: complete — five admin pages and eight account pages at both widths, plus expanded policy/checklist/developer panels and verification confirmation.
6. Shared overlays: complete — mobile menu, search, notifications, record actions, product import/quick add, strain/batch controls, product details, filter sheet, comparison, save filter, price alert, request review, pricing message, chat/quote composer, recent activity, confirmations, setup, plan features, dirty settings, and draft notices. Shared UI primitives also cover conditional provider/error/toast variants; native browser/OS pickers remain platform-rendered.
7. Public pages: home, help, contact, three legal pages, and not-found reviewed at both widths. Their existing landing aesthetic is preserved.
8. Validation: 57 distinct focused regressions passed; final focused rerun and aggregate verification passed. Independent final diff review: no findings. Release evidence is recorded separately after Git publication/deployment.

## Evidence

56 page/view entries, 112 captures at 360 × 800 and 1440 × 1000. All recorded entries had matching viewport/document widths and no application-error screen. See [route-checks.json](route-checks.json).

The [root QA report](../../../design-qa.md) links the source, combined comparisons, final overview captures, and representative page/dialog contact sheets. Full transient capture set: `/tmp/phenofarm-emerald/screenshots/`.
