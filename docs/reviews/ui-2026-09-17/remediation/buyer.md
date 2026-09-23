# Buyer UI remediation — September 17, 2026

83 buyer-owned findings; shared BUY-059–064 and BUY-089–091 are recorded by root.

Local http://localhost:3144; isolated phenofarm_ui_fixes_20260917 clone; signed buyer fixture. No live app submissions, original database edits, commit, push or deployment by this work.

## Verification

- Each linked screenshot was freshly captured after the fix and visually inspected. Companion JSON/text files record DOM geometry and accessible structure.
- Evidence with stable in its filename was captured from the local production build. Earlier development-server captures are not used as final proof.
- Manual checks did not submit orders/messages, change saved products, or save settings. Only ephemeral browser draft state was adjusted and restored.
- Source review and scoped ESLint passed. Root reported aggregate npm run verify passed; five buyer layout regressions, 14 existing buyer regressions and five profile-settings regressions passed serially against the isolated clone.
- A later whole-app sweep reported intermittent React418 on buyer dashboard and several grower pages. Fresh isolated buyer diagnostic sessions (normal/reduced motion) had zero errors, raw SSR and hydrated dates matched, and root repeated the production buyer dashboard five times cleanly. No buyer source defect was reproduced; root is running a clean serialized whole-app repeat before final completion.

Status: {'fixed and verified': 83}

## Rendered coverage

- `/dispensary/dashboard` — 1440px, 390px: verified-buyer summary; recent orders; saved summary; empty weekly chart.
- `/dispensary/catalog` — 1440px, 390px, 360px: default Grid; mobile List; desktop filters open; mobile filter sheet; message/pricing composer; price-alert dialog; Compare two and three products.
- `/dispensary/cart` — 1440px, 390px, 360px: empty draft and suggestions; filled draft; review dialog; Back dismissal.
- `/dispensary/orders` — 1440px, 390px: desktop table; mobile linked rows; stats and filters; distinct legacy/current short IDs.
- `/dispensary/orders/[id]` — 1440px, 390px, 360px: default pending request; expanded timeline and history; withdraw confirmation canceled; editable Message grower update draft cleared without sending.
- `/dispensary/grower/[id]` — 1440px, 390px, 360px: default Grid; mobile List; Browse products anchor; expanded shop facts; quote-only composer dismissed.
- `/dispensary/settings` — 1440px, 390px: verified complete profile; license section; business profile; branding; Account.
- `/dispensary/saved` — 1440px, 390px, 360px: Favorites List; Favorites Grid; More/Clear confirmation with focus and Escape checks; Recent; Active alerts; Triggered empty; View Active Alerts transition; All label; More/Clear alerts confirmation canceled.

Redirect route files: `/dispensary/favorites` and `/dispensary/price-alerts` retain their Saved-tab destinations. Eight actual pages and two redirects are represented.

Limitations:

- Rendered detail checks used a pending request fixture; status-specific actions retain their existing guards and are covered by the broader existing workflow checks where applicable.
- The fixture has no triggered alert, so mark-seen visual state was reviewed in source; Active/Triggered/All controls and empty-state navigation were inspected.
- Manual browser verification did not send messages, submit orders, clear favorites/alerts, or save profile settings. Root executed functional regressions only against the isolated clone.

## Individual findings

### BUY-001 — Completed setup card remains oversized

**fixed and verified** · P2 · `/dispensary/dashboard`

Completed setup becomes a compact Verified buyer link.

Files: `app/dispensary/dashboard/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

Evidence: [dashboard-stable-desktop](buyer/dashboard-stable-desktop.png), [dashboard-stable-mobile](buyer/dashboard-stable-mobile.png).

### BUY-002 — Saved summary repeats labels and counts

**fixed and verified** · P2 · `/dispensary/dashboard`

Saved is one row with Favorites and Alerts counts.

Files: `app/dispensary/dashboard/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

Evidence: [dashboard-stable-desktop](buyer/dashboard-stable-desktop.png), [dashboard-stable-mobile](buyer/dashboard-stable-mobile.png).

### BUY-003 — Recent requests subtitle describes implementation

**fixed and verified** · P2 · `/dispensary/dashboard`

Removed the internal tracker-format explanation.

Files: `app/dispensary/dashboard/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

Evidence: [dashboard-stable-desktop](buyer/dashboard-stable-desktop.png), [dashboard-stable-mobile](buyer/dashboard-stable-mobile.png).

### BUY-004 — Dashboard cards leave large empty areas

**fixed and verified** · P2 · `/dispensary/dashboard`

Recent products fit their content; the empty weekly chart is a short message.

Files: `app/dispensary/dashboard/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

Evidence: [dashboard-stable-desktop](buyer/dashboard-stable-desktop.png), [dashboard-stable-mobile](buyer/dashboard-stable-mobile.png).

### BUY-005 — Mobile recent requests need compact rows

**fixed and verified** · P2 · `/dispensary/dashboard`

Dashboard shows three compact linked mobile order rows with short IDs, grower/date, amount and status.

Files: `app/dispensary/dashboard/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

Evidence: [dashboard-stable-desktop](buyer/dashboard-stable-desktop.png), [dashboard-stable-mobile](buyer/dashboard-stable-mobile.png).

### BUY-006 — Dashboard status labels are unclear

**fixed and verified** · P3 · `/dispensary/dashboard`

Awaiting response and In progress use distinct status counts; Request value is shorter and definitions are expandable.

Files: `app/dispensary/dashboard/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

Evidence: [dashboard-stable-desktop](buyer/dashboard-stable-desktop.png), [dashboard-stable-mobile](buyer/dashboard-stable-mobile.png).

### BUY-007 — Catalog hero delays product browsing

**fixed and verified** · P2 · `/dispensary/catalog`

Catalog uses a short heading and description.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-008 — Mobile catalog toolbar spans three rows

**fixed and verified** · P2 · `/dispensary/catalog`

Mobile search and toolbar use two compact rows and preserve named sort/filter/view controls.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-009 — Product cards repeat seller and stock details

**fixed and verified** · P2 · `/dispensary/catalog`

Removed per-card seller text inside grower groups and repeated group counts.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-010 — Desktop price and quantity controls compete for space

**fixed and verified** · P2 · `/dispensary/catalog`

Availability appears once per product, next to request controls.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-011 — Missing-photo placeholders dominate listings

**fixed and verified** · P2 · `/dispensary/catalog`

Lab guidance is shortened to Lab results on request.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-012 — Catalog repeats counts and view state

**fixed and verified** · P3 · `/dispensary/catalog`

Phone product images are shorter; missing-photo space no longer dominates cards.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-013 — Sparse grower groups retain a four-column grid

**fixed and verified** · P3 · `/dispensary/catalog`

Removed repeated view CTA and reduced end-of-list copy and spacing.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-014 — Empty draft repeats payment guidance

**fixed and verified** · P2 · `/dispensary/cart`

Empty draft has one short heading and helper line.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

Evidence: [cart-empty-stable-desktop](buyer/cart-empty-stable-desktop.png), [cart-empty-stable-mobile](buyer/cart-empty-stable-mobile.png).

### BUY-015 — Quote-only suggestions use an ambiguous Add action

**fixed and verified** · P2 · `/dispensary/cart`

Quote-only suggestions offer Request pricing instead of adding an unpriced item.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

Evidence: [cart-empty-stable-desktop](buyer/cart-empty-stable-desktop.png), [cart-empty-stable-mobile](buyer/cart-empty-stable-mobile.png).

### BUY-016 — Empty-state copy and illustration delay suggestions

**fixed and verified** · P3 · `/dispensary/cart`

Empty-state decorative padding and oversized icon are removed.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

Evidence: [cart-empty-stable-desktop](buyer/cart-empty-stable-desktop.png), [cart-empty-stable-mobile](buyer/cart-empty-stable-mobile.png).

### BUY-017 — Saved destination label is unnecessarily abstract

**fixed and verified** · P3 · `/dispensary/cart`

Suggestions use the concise Saved items heading.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

Evidence: [cart-empty-stable-desktop](buyer/cart-empty-stable-desktop.png), [cart-empty-stable-mobile](buyer/cart-empty-stable-mobile.png).

### BUY-018 — Draft repeats direct-payment guidance

**fixed and verified** · P2 · `/dispensary/cart`

Payment guidance appears once with payment terms.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

Evidence: [cart-stable-desktop](buyer/cart-stable-desktop.png), [cart-stable-mobile](buyer/cart-stable-mobile.png).

### BUY-019 — Default and refresh notices dominate mobile draft

**fixed and verified** · P2 · `/dispensary/cart`

Template actions are compact; reconciliation feedback appears only when product data changed.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

Evidence: [cart-stable-desktop](buyer/cart-stable-desktop.png), [cart-stable-mobile](buyer/cart-stable-mobile.png).

### BUY-020 — Optional fields appear as warnings

**fixed and verified** · P2 · `/dispensary/cart`

Removed nonblocking warning-style suggestions for optional fields.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

Evidence: [cart-stable-desktop](buyer/cart-stable-desktop.png), [cart-stable-mobile](buyer/cart-stable-mobile.png).

### BUY-021 — Mobile draft stepper duplicates visible sections

**fixed and verified** · P2 · `/dispensary/cart`

Items, Logistics and Terms are compact anchored navigation.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

Evidence: [cart-stable-desktop](buyer/cart-stable-desktop.png), [cart-stable-mobile](buyer/cart-stable-mobile.png).

### BUY-022 — Draft summary repeats form details

**fixed and verified** · P3 · `/dispensary/cart`

Draft summary shows one Total and item/grower count.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

Evidence: [cart-stable-desktop](buyer/cart-stable-desktop.png), [cart-stable-mobile](buyer/cart-stable-mobile.png).

### BUY-023 — Remove-item touch target is too narrow

**fixed and verified** · P2 · `/dispensary/cart`

Remove-item controls have 40px targets.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

Evidence: [cart-stable-desktop](buyer/cart-stable-desktop.png), [cart-stable-mobile](buyer/cart-stable-mobile.png).

### BUY-024 — Mobile order stats consume four rows

**fixed and verified** · P2 · `/dispensary/orders`

Order statistics use a two-column mobile grid.

Files: `app/dispensary/orders/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

Evidence: [orders-stable-desktop](buyer/orders-stable-desktop.png), [orders-stable-mobile](buyer/orders-stable-mobile.png).

### BUY-025 — Mobile order cards repeat labels and actions

**fixed and verified** · P2 · `/dispensary/orders`

Mobile orders are compact linked rows; legacy and current IDs retain distinguishable short labels.

Files: `app/dispensary/orders/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

Evidence: [orders-stable-desktop](buyer/orders-stable-desktop.png), [orders-stable-mobile](buyer/orders-stable-mobile.png).

### BUY-026 — Order page repeats its heading

**fixed and verified** · P3 · `/dispensary/orders`

Orders is the sole page heading; removed Request Tracker heading.

Files: `app/dispensary/orders/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

Evidence: [orders-stable-desktop](buyer/orders-stable-desktop.png), [orders-stable-mobile](buyer/orders-stable-mobile.png).

### BUY-027 — Order search placeholder is clipped

**fixed and verified** · P3 · `/dispensary/orders`

Search orders grows within the responsive filter row.

Files: `app/dispensary/orders/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

Evidence: [orders-stable-desktop](buyer/orders-stable-desktop.png), [orders-stable-mobile](buyer/orders-stable-mobile.png).

### BUY-028 — Order result count appears twice

**fixed and verified** · P3 · `/dispensary/orders`

A single result count accompanies pagination.

Files: `app/dispensary/orders/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

Evidence: [orders-stable-desktop](buyer/orders-stable-desktop.png), [orders-stable-mobile](buyer/orders-stable-mobile.png).

### BUY-029 — Order status wording differs across pages

**fixed and verified** · P3 · `/dispensary/orders`

Orders and dashboard use Awaiting response, In progress and Request value consistently.

Files: `app/dispensary/orders/page.tsx`, `app/dispensary/components/OrdersTable.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

Evidence: [orders-stable-desktop](buyer/orders-stable-desktop.png), [orders-stable-mobile](buyer/orders-stable-mobile.png).

### BUY-030 — Order status is repeated four times

**fixed and verified** · P2 · `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`

Status remains in the heading; timeline and history are collapsed until requested.

Files: `app/dispensary/orders/[id]/page.tsx`, `app/dispensary/orders/[id]/OrderDetailActions.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

Evidence: [detail-stable-desktop](buyer/detail-stable-desktop.png), [detail-stable-mobile](buyer/detail-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-withdraw-stable-desktop-viewport](buyer/detail-withdraw-stable-desktop-viewport.png), [detail-withdraw-stable-360-viewport](buyer/detail-withdraw-stable-360-viewport.png), [detail-message-stable-360-viewport](buyer/detail-message-stable-360-viewport.png).

### BUY-031 — Mobile timeline delays requested items

**fixed and verified** · P2 · `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`

Expandable timeline keeps requested items near the top; shared timeline removes repeated stage/pending copy.

Files: `app/dispensary/orders/[id]/page.tsx`, `app/dispensary/orders/[id]/OrderDetailActions.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

Evidence: [detail-stable-desktop](buyer/detail-stable-desktop.png), [detail-stable-mobile](buyer/detail-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-withdraw-stable-desktop-viewport](buyer/detail-withdraw-stable-desktop-viewport.png), [detail-withdraw-stable-360-viewport](buyer/detail-withdraw-stable-360-viewport.png), [detail-message-stable-360-viewport](buyer/detail-message-stable-360-viewport.png).

### BUY-032 — Buyer action copy is noisy and state-inaccurate

**fixed and verified** · P2 · `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`

Only available buyer actions are shown; withdrawal consequences appear in confirmation.

Files: `app/dispensary/orders/[id]/page.tsx`, `app/dispensary/orders/[id]/OrderDetailActions.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved. Opened withdrawal confirmation at desktop/360px and canceled; no order mutation.

Evidence: [detail-stable-desktop](buyer/detail-stable-desktop.png), [detail-stable-mobile](buyer/detail-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-withdraw-stable-desktop-viewport](buyer/detail-withdraw-stable-desktop-viewport.png), [detail-withdraw-stable-360-viewport](buyer/detail-withdraw-stable-360-viewport.png), [detail-message-stable-360-viewport](buyer/detail-message-stable-360-viewport.png).

### BUY-033 — Two message actions compete

**fixed and verified** · P3 · `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`

One Message grower action opens an editable update draft for active requests.

Files: `app/dispensary/orders/[id]/page.tsx`, `app/dispensary/orders/[id]/OrderDetailActions.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved. Opened Message grower; confirmed the editable update draft, then cleared it and closed without sending.

Evidence: [detail-stable-desktop](buyer/detail-stable-desktop.png), [detail-stable-mobile](buyer/detail-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-withdraw-stable-desktop-viewport](buyer/detail-withdraw-stable-desktop-viewport.png), [detail-withdraw-stable-360-viewport](buyer/detail-withdraw-stable-360-viewport.png), [detail-message-stable-360-viewport](buyer/detail-message-stable-360-viewport.png).

### BUY-034 — Request value is repeated

**fixed and verified** · P3 · `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`

A single Total replaces duplicate item/request totals when there are no fees.

Files: `app/dispensary/orders/[id]/page.tsx`, `app/dispensary/orders/[id]/OrderDetailActions.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

Evidence: [detail-stable-desktop](buyer/detail-stable-desktop.png), [detail-stable-mobile](buyer/detail-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-withdraw-stable-desktop-viewport](buyer/detail-withdraw-stable-desktop-viewport.png), [detail-withdraw-stable-360-viewport](buyer/detail-withdraw-stable-360-viewport.png), [detail-message-stable-360-viewport](buyer/detail-message-stable-360-viewport.png).

### BUY-035 — Export occupies a separate row

**fixed and verified** · P3 · `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`

Export CSV is in the page header action group.

Files: `app/dispensary/orders/[id]/page.tsx`, `app/dispensary/orders/[id]/OrderDetailActions.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

Evidence: [detail-stable-desktop](buyer/detail-stable-desktop.png), [detail-stable-mobile](buyer/detail-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-withdraw-stable-desktop-viewport](buyer/detail-withdraw-stable-desktop-viewport.png), [detail-withdraw-stable-360-viewport](buyer/detail-withdraw-stable-360-viewport.png), [detail-message-stable-360-viewport](buyer/detail-message-stable-360-viewport.png).

### BUY-036 — Neutral details use warning styling

**fixed and verified** · P3 · `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`

Request details use neutral styling and Payment terms.

Files: `app/dispensary/orders/[id]/page.tsx`, `app/dispensary/orders/[id]/OrderDetailActions.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

Evidence: [detail-stable-desktop](buyer/detail-stable-desktop.png), [detail-stable-mobile](buyer/detail-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-expanded-stable-desktop](buyer/detail-expanded-stable-desktop.png), [detail-expanded-stable-mobile](buyer/detail-expanded-stable-mobile.png), [detail-withdraw-stable-desktop-viewport](buyer/detail-withdraw-stable-desktop-viewport.png), [detail-withdraw-stable-360-viewport](buyer/detail-withdraw-stable-360-viewport.png), [detail-message-stable-360-viewport](buyer/detail-message-stable-360-viewport.png).

### BUY-037 — Shop repeats verification and category details

**fixed and verified** · P2 · `/dispensary/grower/grower-001`

Verification/license appear once in a compact shop header; product types remain in filters.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-list-stable-mobile](buyer/shop-list-stable-mobile.png), [shop-composer-stable-360-viewport](buyer/shop-composer-stable-360-viewport.png).

### BUY-038 — Commercial terms delay the mobile product list

**fixed and verified** · P2 · `/dispensary/grower/grower-001`

A short fulfillment/minimum line precedes products; full shop details expand beneath them.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-list-stable-mobile](buyer/shop-list-stable-mobile.png), [shop-composer-stable-360-viewport](buyer/shop-composer-stable-360-viewport.png).

### BUY-039 — Shop message label opens an anchor

**fixed and verified** · P2 · `/dispensary/grower/grower-001`

Browse products accurately describes the header anchor action.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-list-stable-mobile](buyer/shop-list-stable-mobile.png), [shop-composer-stable-360-viewport](buyer/shop-composer-stable-360-viewport.png).

### BUY-040 — Shop placeholders dominate mobile product cards

**fixed and verified** · P2 · `/dispensary/grower/grower-001`

Shop phone product images are 96px tall, bringing the first product into the first screen.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-list-stable-mobile](buyer/shop-list-stable-mobile.png), [shop-composer-stable-360-viewport](buyer/shop-composer-stable-360-viewport.png).

### BUY-041 — Shop card wording differs from catalog

**fixed and verified** · P3 · `/dispensary/grower/grower-001`

Shop cards share catalog THC colors, product-type normalization, price units, request labels and one stock statement.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls. Toggled List, opened quote-only Request pricing at360px, confirmed16px textarea, and dismissed without sending.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-list-stable-mobile](buyer/shop-list-stable-mobile.png), [shop-composer-stable-360-viewport](buyer/shop-composer-stable-360-viewport.png).

### BUY-042 — Commercial terms mix topics and repeat payment copy

**fixed and verified** · P3 · `/dispensary/grower/grower-001`

Shop details separate minimum, reply window, fulfillment and direct payment facts.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-list-stable-mobile](buyer/shop-list-stable-mobile.png), [shop-composer-stable-360-viewport](buyer/shop-composer-stable-360-viewport.png).

### BUY-043 — Shop repeats product-list context

**fixed and verified** · P3 · `/dispensary/grower/grower-001`

Products (count) is the single product-list context label.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-details-stable-desktop](buyer/shop-details-stable-desktop.png), [shop-details-stable-mobile](buyer/shop-details-stable-mobile.png), [shop-list-stable-mobile](buyer/shop-list-stable-mobile.png), [shop-composer-stable-360-viewport](buyer/shop-composer-stable-360-viewport.png).

### BUY-044 — Desktop branding card stretches into empty space

**fixed and verified** · P2 · `/dispensary/settings`

Branding fits its content while business fields use a two-column desktop layout.

Files: `app/dispensary/settings/page.tsx`, `app/dispensary/settings/components/SettingsForm.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

Evidence: [settings-stable-desktop](buyer/settings-stable-desktop.png), [settings-stable-mobile](buyer/settings-stable-mobile.png).

### BUY-045 — Complete account still receives setup instructions

**fixed and verified** · P2 · `/dispensary/settings`

Completed accounts show Verified through; setup guidance is conditional on missing required fields.

Files: `app/dispensary/settings/page.tsx`, `app/dispensary/settings/components/SettingsForm.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

Evidence: [settings-stable-desktop](buyer/settings-stable-desktop.png), [settings-stable-mobile](buyer/settings-stable-mobile.png).

### BUY-046 — License fields are grouped under the wrong section

**fixed and verified** · P2 · `/dispensary/settings`

License number, state and expiry controls moved into License & verification with existing validation intact.

Files: `app/dispensary/settings/page.tsx`, `app/dispensary/settings/components/SettingsForm.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

Evidence: [settings-stable-desktop](buyer/settings-stable-desktop.png), [settings-stable-mobile](buyer/settings-stable-mobile.png).

### BUY-047 — Settings labels repeat account context

**fixed and verified** · P3 · `/dispensary/settings`

Settings and field labels omit redundant dispensary/business prefixes.

Files: `app/dispensary/settings/page.tsx`, `app/dispensary/settings/components/SettingsForm.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

Evidence: [settings-stable-desktop](buyer/settings-stable-desktop.png), [settings-stable-mobile](buyer/settings-stable-mobile.png).

### BUY-048 — Persistent footer repeats draft and shortcut guidance

**fixed and verified** · P3 · `/dispensary/settings`

Save bars show relevant Saving, Unsaved changes or Saved status; removed persistent browser/keyboard instructions.

Files: `app/dispensary/settings/page.tsx`, `app/dispensary/settings/components/SettingsForm.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

Evidence: [settings-stable-desktop](buyer/settings-stable-desktop.png), [settings-stable-mobile](buyer/settings-stable-mobile.png).

### BUY-049 — Sign-out action lacks a visible label

**fixed and verified** · P3 · `/dispensary/settings`

Account offers a visibly labelled Sign out button.

Files: `app/dispensary/settings/page.tsx`, `app/dispensary/settings/components/SettingsForm.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

Evidence: [settings-stable-desktop](buyer/settings-stable-desktop.png), [settings-stable-mobile](buyer/settings-stable-mobile.png).

### BUY-050 — Saved header and tabs delay the first product

**fixed and verified** · P2 · `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`

Saved uses a short heading, compact horizontal tabs and one sorting/view toolbar.

Files: `app/dispensary/saved/SavedContent.tsx`, `app/dispensary/favorites/FavoritesContent.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Saved at both widths and toggled named List/Grid controls; default list and quote-only Request pricing remain readable.

Evidence: [saved-stable-desktop](buyer/saved-stable-desktop.png), [saved-stable-mobile](buyer/saved-stable-mobile.png), [saved-grid-stable-desktop](buyer/saved-grid-stable-desktop.png), [saved-grid-stable-mobile](buyer/saved-grid-stable-mobile.png).

### BUY-051 — Clear favorites is too prominent

**fixed and verified** · P2 · `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`

Clear favorites moved into More and retains confirmation.

Files: `app/dispensary/saved/SavedContent.tsx`, `app/dispensary/favorites/FavoritesContent.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Opened More then Clear favorites at both widths; shared confirmation stays above navigation, traps focus and dismisses with Cancel/Escape. No favorites cleared.

Evidence: [saved-stable-desktop](buyer/saved-stable-desktop.png), [saved-stable-mobile](buyer/saved-stable-mobile.png), [favorites-clear-stable-desktop](buyer/favorites-clear-stable-desktop.png), [favorites-clear-stable-mobile](buyer/favorites-clear-stable-mobile.png).

### BUY-052 — Saved quote-only card repeats pricing guidance

**fixed and verified** · P3 · `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`

Quote-only favorites show one Request pricing action without duplicated guidance.

Files: `app/dispensary/saved/SavedContent.tsx`, `app/dispensary/favorites/FavoritesContent.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Saved at both widths and toggled named List/Grid controls; default list and quote-only Request pricing remain readable.

Evidence: [saved-stable-desktop](buyer/saved-stable-desktop.png), [saved-stable-mobile](buyer/saved-stable-mobile.png), [saved-grid-stable-desktop](buyer/saved-grid-stable-desktop.png), [saved-grid-stable-mobile](buyer/saved-grid-stable-mobile.png).

### BUY-053 — Sparse favorites grid wastes space

**fixed and verified** · P3 · `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`

Favorites default to compact List; Grid remains available with shorter images.

Files: `app/dispensary/saved/SavedContent.tsx`, `app/dispensary/favorites/FavoritesContent.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Saved at both widths and toggled named List/Grid controls; default list and quote-only Request pricing remain readable.

Evidence: [saved-stable-desktop](buyer/saved-stable-desktop.png), [saved-stable-mobile](buyer/saved-stable-mobile.png), [saved-grid-stable-desktop](buyer/saved-grid-stable-desktop.png), [saved-grid-stable-mobile](buyer/saved-grid-stable-mobile.png).

### BUY-054 — Alert summary delays the first mobile product

**fixed and verified** · P2 · `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`

Alerts use compact Saved tabs and a single toolbar above the first product.

Files: `app/dispensary/price-alerts/PriceAlertsContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

Evidence: [alerts-stable-desktop](buyer/alerts-stable-desktop.png), [alerts-stable-mobile](buyer/alerts-stable-mobile.png).

### BUY-055 — Alert counts appear three times

**fixed and verified** · P3 · `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`

Alert counts appear once in Active and Triggered tabs.

Files: `app/dispensary/price-alerts/PriceAlertsContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

Evidence: [alerts-stable-desktop](buyer/alerts-stable-desktop.png), [alerts-stable-mobile](buyer/alerts-stable-mobile.png).

### BUY-056 — Alert cards repeat target price and units

**fixed and verified** · P3 · `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`

Current and target per-unit prices are paired; removed repeated unit/target badges.

Files: `app/dispensary/price-alerts/PriceAlertsContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

Evidence: [alerts-stable-desktop](buyer/alerts-stable-desktop.png), [alerts-stable-mobile](buyer/alerts-stable-mobile.png).

### BUY-057 — Manual price-check explanation needs shorter copy

**fixed and verified** · P3 · `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`

Manual-check copy is one line; Refresh remains visible and Clear alerts is under More.

Files: `app/dispensary/price-alerts/PriceAlertsContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

Evidence: [alerts-stable-desktop](buyer/alerts-stable-desktop.png), [alerts-stable-mobile](buyer/alerts-stable-mobile.png).

### BUY-058 — Recent tab repeats its purpose and metadata

**fixed and verified** · P3 · `/dispensary/saved?tab=recent`

Recent products omit repeated intro copy and use compact grower/count/date metadata and unit notation.

Files: `app/dispensary/saved/SavedContent.tsx`, `app/dispensary/favorites/FavoritesContent.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected Recent at both widths: grower/count/date metadata on one compact line with price per unit and retained navigation actions.

Evidence: [recent-stable-desktop](buyer/recent-stable-desktop.png), [recent-stable-mobile](buyer/recent-stable-mobile.png).

### BUY-065 — Catalog shows an orphan draft-count badge

**fixed and verified** · P2 · `/dispensary/catalog`

Catalog draft count is attached to a View draft link; navigation badge remains valid inline markup.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected View draft link/count in Catalog. Source review confirms navigation CartBadge stays inline, avoiding nested links.

Evidence: [catalog-stable-desktop](buyer/catalog-stable-desktop.png), [catalog-stable-mobile](buyer/catalog-stable-mobile.png).

### BUY-066 — Open desktop filters clip product action controls

**fixed and verified** · P1 · `/dispensary/catalog`

Auto-fit cards enforce a usable minimum width; price sits above full-width quantity/Add controls with filters open.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected actual open desktop filter sidebar: cards retain minimum width, price row is separate and quantity/Add controls remain within card padding. Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

Evidence: [filters-stable-desktop](buyer/filters-stable-desktop.png).

### BUY-067 — Filter shortcuts are oversized

**fixed and verified** · P2 · `/dispensary/catalog`

Filter shortcuts are compact checkboxes.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected open desktop filter sidebar and mobile sheet; compact checkboxes, Favorites only label, one price-unit label and reachable Apply filters.

Evidence: [filters-stable-desktop](buyer/filters-stable-desktop.png), [filters-stable-mobile](buyer/filters-stable-mobile.png).

### BUY-068 — Filter action and toggle labels are unclear

**fixed and verified** · P3 · `/dispensary/catalog`

Favorites only is a labelled checkbox and the sheet ends with Apply filters.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected open desktop filter sidebar and mobile sheet; compact checkboxes, Favorites only label, one price-unit label and reachable Apply filters.

Evidence: [filters-stable-desktop](buyer/filters-stable-desktop.png), [filters-stable-mobile](buyer/filters-stable-mobile.png).

### BUY-069 — Price filters repeat unit wording

**fixed and verified** · P3 · `/dispensary/catalog`

Price per unit is stated once above shortened range options.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected open desktop filter sidebar and mobile sheet; compact checkboxes, Favorites only label, one price-unit label and reachable Apply filters.

Evidence: [filters-stable-desktop](buyer/filters-stable-desktop.png), [filters-stable-mobile](buyer/filters-stable-mobile.png).

### BUY-070 — Mobile message context truncates both names

**fixed and verified** · P2 · `/dispensary/catalog`

Message context uses wrapping product and To: grower lines.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected composer at desktop and 360px: wrapping product/grower context, concise templates, 16px mobile textarea and reachable actions. No message sent.

Evidence: [composer-stable-desktop](buyer/composer-stable-desktop.png), [composer-stable-360-viewport](buyer/composer-stable-360-viewport.png).

### BUY-071 — Mobile message input text is small

**fixed and verified** · P2 · `/dispensary/catalog`

Catalog message input uses 16px text on phones.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected composer at desktop and 360px: wrapping product/grower context, concise templates, 16px mobile textarea and reachable actions. No message sent.

Evidence: [composer-stable-desktop](buyer/composer-stable-desktop.png), [composer-stable-360-viewport](buyer/composer-stable-360-viewport.png).

### BUY-072 — Pricing composer repeats explanations

**fixed and verified** · P3 · `/dispensary/catalog`

Pricing templates are concise and Replies in Messages is a single quiet line.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected composer at desktop and 360px: wrapping product/grower context, concise templates, 16px mobile textarea and reachable actions. No message sent.

Evidence: [composer-stable-desktop](buyer/composer-stable-desktop.png), [composer-stable-360-viewport](buyer/composer-stable-360-viewport.png).

### BUY-073 — Price alert dialog omits manual-check limitation

**fixed and verified** · P2 · `/dispensary/catalog`

Target-price dialog states that checking occurs on visits or refresh.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected target-price dialog at both widths: explicit manual check timing and matching target/current sale-unit notation. No alert submitted.

Evidence: [price-alert-stable-desktop](buyer/price-alert-stable-desktop.png), [price-alert-stable-mobile](buyer/price-alert-stable-mobile.png), [price-alert-stable-360-viewport](buyer/price-alert-stable-360-viewport.png), [price-alert-stable-360-viewport](buyer/price-alert-stable-360-viewport.png).

### BUY-074 — Price alert dialog omits sale unit

**fixed and verified** · P3 · `/dispensary/catalog`

Target-price input and current price show their sale unit without nested card decoration.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected target-price dialog at both widths: explicit manual check timing and matching target/current sale-unit notation. No alert submitted.

Evidence: [price-alert-stable-desktop](buyer/price-alert-stable-desktop.png), [price-alert-stable-mobile](buyer/price-alert-stable-mobile.png), [price-alert-stable-360-viewport](buyer/price-alert-stable-360-viewport.png), [price-alert-stable-360-viewport](buyer/price-alert-stable-360-viewport.png).

### BUY-075 — Comparison dialog sits behind navigation

**fixed and verified** · P1 · `/dispensary/catalog`

Compare is portaled above navigation with a bounded, scrolling panel and reachable close control.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected comparison at 1440/390/360px, including three products at 360px: portaled above navigation, shared attribute labels, separate request rows and reachable close control. Escape dismisses. Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

Evidence: [compare-stable-desktop](buyer/compare-stable-desktop.png), [compare-stable-mobile](buyer/compare-stable-mobile.png), [compare-stable-360-viewport](buyer/compare-stable-360-viewport.png).

### BUY-076 — Mobile comparison columns are too narrow

**fixed and verified** · P2 · `/dispensary/catalog`

Comparison uses shared attribute labels, short units, compact headers and separate action rows; full quantity selection remains expandable.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected comparison at 1440/390/360px, including three products at 360px: portaled above navigation, shared attribute labels, separate request rows and reachable close control. Escape dismisses.

Evidence: [compare-stable-desktop](buyer/compare-stable-desktop.png), [compare-stable-mobile](buyer/compare-stable-mobile.png), [compare-stable-360-viewport](buyer/compare-stable-360-viewport.png).

### BUY-077 — Comparison repeats decorative and explanatory content

**fixed and verified** · P3 · `/dispensary/catalog`

Compare title and thumbnails are compact; grower appears once per product.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected comparison at 1440/390/360px, including three products at 360px: portaled above navigation, shared attribute labels, separate request rows and reachable close control. Escape dismisses.

Evidence: [compare-stable-desktop](buyer/compare-stable-desktop.png), [compare-stable-mobile](buyer/compare-stable-mobile.png), [compare-stable-360-viewport](buyer/compare-stable-360-viewport.png).

### BUY-078 — Mobile draft Add link is ambiguous

**fixed and verified** · P3 · `/dispensary/cart`

Mobile draft shortcut reads Add items.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected mobile Add items shortcut and desktop draft navigation; existing link destination preserved.

Evidence: [cart-stable-desktop](buyer/cart-stable-desktop.png), [cart-stable-mobile](buyer/cart-stable-mobile.png).

### BUY-079 — Mobile review dialog clips submission and back actions

**fixed and verified** · P1 · `/dispensary/cart`

Review is portaled above navigation with fixed header/footer and a scrollable body; Back and Submit remain inside the viewport.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected review at 1440/390/360px: header and Back/Submit remain visible above navigation, body scrolls and final recap has one Total. Dismissed without submitting. Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

Evidence: [review-stable-desktop](buyer/review-stable-desktop.png), [review-stable-mobile](buyer/review-stable-mobile.png), [review-stable-360-viewport](buyer/review-stable-360-viewport.png).

### BUY-080 — Review dialog repeats its purpose and summary

**fixed and verified** · P2 · `/dispensary/cart`

Review request is the sole title; details use a compact grid.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected review at 1440/390/360px: header and Back/Submit remain visible above navigation, body scrolls and final recap has one Total. Dismissed without submitting.

Evidence: [review-stable-desktop](buyer/review-stable-desktop.png), [review-stable-mobile](buyer/review-stable-mobile.png), [review-stable-360-viewport](buyer/review-stable-360-viewport.png).

### BUY-081 — Review edit links are small and recap repeats copy

**fixed and verified** · P3 · `/dispensary/cart`

Review edit controls have 40px targets; final recap has one Total and short direct-payment note.

Files: `app/dispensary/cart/page.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected review at 1440/390/360px: header and Back/Submit remain visible above navigation, body scrolls and final recap has one Total. Dismissed without submitting.

Evidence: [review-stable-desktop](buyer/review-stable-desktop.png), [review-stable-mobile](buyer/review-stable-mobile.png), [review-stable-360-viewport](buyer/review-stable-360-viewport.png).

### BUY-082 — Shop anchor hides its destination heading

**fixed and verified** · P3 · `/dispensary/grower/grower-001`

Browse products anchor uses a mobile-header scroll offset.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Clicked Browse products; product heading lands below fixed mobile header. No application data changed. Product heading top95.75px versus fixed header65px.

Evidence: [shop-anchor-stable-mobile](buyer/shop-anchor-stable-mobile.png), [shop-anchor-stable-mobile-viewport](buyer/shop-anchor-stable-mobile-viewport.png).

### BUY-083 — Shop action button reaches beyond card padding

**fixed and verified** · P3 · `/dispensary/grower/grower-001`

Shop price has its own row above quantity/Add, preserving card padding.

Files: `app/dispensary/grower/[id]/page.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected desktop/mobile shop cards: separate price row and quantity/Add controls fully contained within card padding.

Evidence: [shop-stable-desktop](buyer/shop-stable-desktop.png), [shop-stable-mobile](buyer/shop-stable-mobile.png).

### BUY-084 — Saved mobile view controls have no accessible names

**fixed and verified** · P2 · `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`

Saved view controls have Grid view/List view labels and pressed states.

Files: `app/dispensary/saved/SavedContent.tsx`, `app/dispensary/favorites/FavoritesContent.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Toggled accessible Grid view and List view controls; pressed state and visible card layout changed correctly.

Evidence: [saved-stable-desktop](buyer/saved-stable-desktop.png), [saved-stable-mobile](buyer/saved-stable-mobile.png), [saved-grid-stable-desktop](buyer/saved-grid-stable-desktop.png), [saved-grid-stable-mobile](buyer/saved-grid-stable-mobile.png).

### BUY-085 — Mobile alert icons have no accessible names

**fixed and verified** · P2 · `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`

Alert Refresh, More, delete and mark-seen actions have accessible names.

Files: `app/dispensary/price-alerts/PriceAlertsContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected named Refresh, More, delete and clear actions; opened Clear alerts confirmation and canceled. Mark-seen naming reviewed in source because the fixture has no triggered alert. No alerts changed.

Evidence: [alerts-stable-desktop](buyer/alerts-stable-desktop.png), [alerts-stable-mobile](buyer/alerts-stable-mobile.png), [alerts-menu-stable-mobile](buyer/alerts-menu-stable-mobile.png).

### BUY-086 — Triggered-alert empty state repeats instructions

**fixed and verified** · P3 · `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`

Triggered empty state is compact; View active alerts switches to Active.

Files: `app/dispensary/price-alerts/PriceAlertsContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected compact Triggered empty state at both widths; View active alerts switches to Active and restores the product list.

Evidence: [alerts-triggered-stable-desktop](buyer/alerts-triggered-stable-desktop.png), [alerts-triggered-stable-mobile](buyer/alerts-triggered-stable-mobile.png).

### BUY-087 — Alert History lacks dates or events

**fixed and verified** · P3 · `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`

The combined alert tab is correctly named All.

Files: `app/dispensary/price-alerts/PriceAlertsContent.tsx`.

Checks: Scoped ESLint passed. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected accurately named All tab beside counted Active and Triggered tabs; combined-list behavior preserved.

Evidence: [alerts-stable-desktop](buyer/alerts-stable-desktop.png), [alerts-stable-mobile](buyer/alerts-stable-mobile.png).

### BUY-088 — Saved mobile list view overlaps product text

**fixed and verified** · P1 · `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`

Saved list has readable thumbnail/identity and separate mobile price/actions rows.

Files: `app/dispensary/saved/SavedContent.tsx`, `app/dispensary/favorites/FavoritesContent.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected default Saved list at 1440/390/360px: product identity is readable and quote request/message/remove controls occupy a separate mobile row. Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

Evidence: [saved-stable-desktop](buyer/saved-stable-desktop.png), [saved-stable-mobile](buyer/saved-stable-mobile.png), [saved-list-stable-360](buyer/saved-list-stable-360.png).

### BUY-092 — Catalog mobile list hides prices and Add buttons

**fixed and verified** · P1 · `/dispensary/catalog`

Catalog list separates mobile identity, price and request controls into full-width areas.

Files: `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/catalog/components/CartBadge.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`.

Checks: Scoped ESLint passed after this implementation batch. Initial fix visually inspected; final repeat and focused geometry regression remain pending. Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts. Rendered verification: Inspected catalog List at 390/360px: full identity, price and request actions in separate rows without overlap. Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

Evidence: [catalog-list-stable-mobile](buyer/catalog-list-stable-mobile.png), [catalog-list-stable-360](buyer/catalog-list-stable-360.png).
