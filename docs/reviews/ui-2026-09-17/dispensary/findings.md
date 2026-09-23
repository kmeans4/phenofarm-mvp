# PhenoFarm buyer UI review — September 17, 2026

Two fresh visual passes covered all 8 buyer pages and both redirect routes at 1440×1000 and 390×844. Additional dialogs, tabs, alternate views and a 360px Settings check bring the evidence set to 82 inspected screenshots. This is a read-only local review; no app changes were made.

92 distinct findings: 5 P1, 42 P2, 45 P3. The duplicate Favorites redirect and Saved default observations are consolidated; no distinct low-priority item has been omitted.

Priority: **P1** hides or obstructs important content/actions; **P2** meaningfully affects clarity, efficiency or accessibility; **P3** improves wording, hierarchy or polish.

[Machine-readable findings](findings.json) · [Complete coverage and limits](coverage.json) · [Per-screen working notes](notes.jsonl)

## Coverage

| Route | Kind | Pass 1 | Pass 2 |
|---|---|---|---|
| `/dispensary/dashboard` | page | [Pass 1 desktop](p1-01-dashboard-desktop.png) · [Pass 1 mobile](p1-01-dashboard-mobile.png) | [Pass 2 desktop](p2-01-dashboard-desktop.png) · [Pass 2 mobile](p2-01-dashboard-mobile.png) |
| `/dispensary/catalog` | page | [Pass 1 desktop](p1-02-catalog-desktop.png) · [Pass 1 mobile](p1-02-catalog-mobile.png) | [Pass 2 desktop](p2-02-catalog-desktop.png) · [Pass 2 mobile](p2-02-catalog-mobile.png) |
| `/dispensary/cart` | page | [Pass 1 desktop](p1-03-cart-empty-desktop.png) · [Pass 1 mobile](p1-03-cart-empty-mobile.png) | [Pass 2 desktop](p2-03-cart-empty-desktop.png) · [Pass 2 mobile](p2-03-cart-empty-mobile.png) |
| `/dispensary/orders` | page | [Pass 1 desktop](p1-04-orders-desktop.png) · [Pass 1 mobile](p1-04-orders-mobile.png) | [Pass 2 desktop](p2-04-orders-desktop.png) · [Pass 2 mobile](p2-04-orders-mobile.png) |
| `/dispensary/orders/[id]` | page | [Pass 1 desktop](p1-05-order-detail-desktop.png) · [Pass 1 mobile](p1-05-order-detail-mobile.png) | [Pass 2 desktop](p2-05-order-detail-desktop.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png) |
| `/dispensary/grower/[id]` | page | [Pass 1 desktop](p1-06-grower-shop-desktop.png) · [Pass 1 mobile](p1-06-grower-shop-mobile.png) | [Pass 2 desktop](p2-06-grower-shop-desktop.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) |
| `/dispensary/settings` | page | [Pass 1 desktop](p1-07-settings-desktop.png) · [Pass 1 mobile](p1-07-settings-mobile.png) | [Pass 2 desktop](p2-07-settings-desktop.png) · [Pass 2 mobile](p2-07-settings-mobile.png) |
| `/dispensary/saved` | page | [Pass 1 desktop](p1-10-saved-desktop.png) · [Pass 1 mobile](p1-10-saved-mobile.png) | [Pass 2 desktop](p2-10-saved-desktop.png) · [Pass 2 mobile](p2-10-saved-mobile.png) |
| `/dispensary/favorites` | redirect | [Pass 1 desktop](p1-08-favorites-alias-desktop.png) · [Pass 1 mobile](p1-08-favorites-alias-mobile.png) | [Pass 2 desktop](p2-08-favorites-alias-desktop.png) · [Pass 2 mobile](p2-08-favorites-alias-mobile.png) |
| `/dispensary/price-alerts` | redirect | [Pass 1 desktop](p1-09-price-alerts-alias-desktop.png) · [Pass 1 mobile](p1-09-price-alerts-alias-mobile.png) | [Pass 2 desktop](p2-09-price-alerts-alias-desktop.png) · [Pass 2 mobile](p2-09-price-alerts-alias-mobile.png) |

Filled and empty drafts and the Saved Recent tab each received fresh desktop/mobile captures in both passes. The route-level passes were complete before additional pass-two controls were inspected. Redirects are counted separately from pages.

## Highest-priority findings

- **BUY-066 — Open desktop filters clip product action controls** (desktop). Opening the desktop filter sidebar retains a four-column product grid in the reduced content width. Product cards narrow to about 190px and clip quantity increment controls and the Add to Request buttons at their right edges. [Pass 2 desktop](p2-catalog-filters-desktop.png)
- **BUY-075 — Comparison dialog sits behind navigation** (desktop, mobile). Comparison dialog sits behind the fixed navigation. Desktop sidebar obscures the dialog left edge, including title, first product name and row labels; mobile header overlaps the comparison heading. [Pass 2 desktop](p2-catalog-compare-desktop.png) · [Pass 2 mobile](p2-catalog-compare-mobile.png) · [Pass 2 mobile](p2-catalog-compare-lower-mobile.png)
- **BUY-079 — Mobile review dialog clips submission and back actions** (mobile). At 390x844 the review panel ends at y802 with overflow hidden, while Submit Order Request runs y777–817 and Back to Draft runs y829–871. Submit is partly cut off and Back is entirely invisible. The fixed mobile header also overlaps the dialog title. [Pass 2 mobile viewport](p2-cart-review-viewport-mobile.png) · [Pass 2 mobile](p2-cart-review-mobile.png)
- **BUY-088 — Saved mobile list view overlaps product text** (mobile). At 390px the list row compresses the product-name column to 60px, while price copy and request/message controls overlay the product title and grower text. Multiple text layers collide inside the card. [Pass 2 mobile](p2-saved-list-mobile.png)
- **BUY-092 — Catalog mobile list hides prices and Add buttons** (mobile). At 390px catalog List view keeps a desktop horizontal row: product-name columns shrink to 57–91px, pricing/message controls overlap text, prices disappear off the right edge, and Add buttons sit at x400–440 outside the 390px viewport. The document still reports 390px width because overflow is clipped internally. [Pass 2 mobile](p2-catalog-list-mobile.png)

## Complete findings


### Dashboard

**BUY-001 · P2 · Completed setup card remains oversized**

Route: `/dispensary/dashboard`. Affected: desktop, mobile.

Completed setup consumes a full card and lists internal feature readiness on every dashboard visit.

Recommendation: Replace with a compact Verified buyer chip or dismissible setup confirmation.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

[Pass 1 desktop](p1-01-dashboard-desktop.png) · [Pass 1 mobile](p1-01-dashboard-mobile.png) · [Pass 2 desktop](p2-01-dashboard-desktop.png) · [Pass 2 mobile](p2-01-dashboard-mobile.png)

**BUY-002 · P2 · Saved summary repeats labels and counts**

Route: `/dispensary/dashboard`. Affected: desktop, mobile.

Favorites block repeats Saved for later / Favorites and price alerts / explanatory sentence / FAVORITES 1 / 1 product.

Recommendation: Use one Saved row: Favorites 1 · Price alerts 1.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

[Pass 1 desktop](p1-01-dashboard-desktop.png) · [Pass 1 mobile](p1-01-dashboard-mobile.png) · [Pass 2 desktop](p2-01-dashboard-desktop.png) · [Pass 2 mobile](p2-01-dashboard-mobile.png)

**BUY-003 · P2 · Recent requests subtitle describes implementation**

Route: `/dispensary/dashboard`. Affected: desktop, mobile.

Recent Requests subtitle explains shared tracker formatting instead of helping the buyer.

Recommendation: Remove it; keep Recent requests and View all.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

[Pass 1 desktop](p1-01-dashboard-desktop.png) · [Pass 1 mobile](p1-01-dashboard-mobile.png) · [Pass 2 desktop](p2-01-dashboard-desktop.png) · [Pass 2 mobile](p2-01-dashboard-mobile.png)

**BUY-004 · P2 · Dashboard cards leave large empty areas**

Route: `/dispensary/dashboard`. Affected: desktop.

Desktop recently requested card has about 270px of unused lower space; empty chart card is over 400px tall.

Recommendation: Size recent list to content and replace empty chart with a compact No requests this week row.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

[Pass 1 desktop](p1-01-dashboard-desktop.png) · [Pass 2 desktop](p2-01-dashboard-desktop.png)

**BUY-005 · P2 · Mobile recent requests need compact rows**

Route: `/dispensary/dashboard`. Affected: mobile.

On mobile recent requests begin below y949 and occupy five tall repeated cards.

Recommendation: Show three compact rows with ID suffix, grower, amount/status; move date into one secondary line.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

[Pass 1 mobile](p1-01-dashboard-mobile.png) · [Pass 2 mobile](p2-01-dashboard-mobile.png)

**BUY-006 · P3 · Dashboard status labels are unclear**

Route: `/dispensary/dashboard`. Affected: desktop, mobile.

Requests Waiting and Active Requests are adjacent but their distinction is unclear; Estimated Request Value is verbose in a small KPI label.

Recommendation: Use Awaiting response, In progress, and Request value; add definition on demand.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

[Pass 1 desktop](p1-01-dashboard-desktop.png) · [Pass 1 mobile](p1-01-dashboard-mobile.png) · [Pass 2 desktop](p2-01-dashboard-desktop.png) · [Pass 2 mobile](p2-01-dashboard-mobile.png)


### Catalog

**BUY-007 · P2 · Catalog hero delays product browsing**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Marketing title and explanatory copy dominate a task screen and push product content below the first mobile viewport.

Recommendation: Use Catalog and a single short line: Browse verified growers. Use a 24–28px mobile title.

Pass 1: observed. Pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 1 desktop](p1-02-catalog-desktop.png) · [Pass 1 mobile](p1-02-catalog-mobile.png) · [Pass 2 desktop](p2-02-catalog-desktop.png) · [Pass 2 mobile](p2-02-catalog-mobile.png)

**BUY-008 · P2 · Mobile catalog toolbar spans three rows**

Route: `/dispensary/catalog`. Affected: mobile.

Mobile sort/filter/view controls occupy three rows; the sort arrow sits detached at the far right.

Recommendation: Put Sort and Filters in one row with view icons beside them; use Search products or growers as placeholder.

Pass 1: observed. Pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 1 mobile](p1-02-catalog-mobile.png) · [Pass 2 mobile](p2-02-catalog-mobile.png)

**BUY-009 · P2 · Product cards repeat seller and stock details**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Each listing repeats the grower name under an existing grower group, In stock plus Stock N units plus N Available, and a long identical lab-result note.

Recommendation: Keep stock once; omit redundant grouped grower byline; shorten shared note to Lab results on request.

Pass 1: observed. Pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 1 desktop](p1-02-catalog-desktop.png) · [Pass 1 mobile](p1-02-catalog-mobile.png) · [Pass 2 desktop](p2-02-catalog-desktop.png) · [Pass 2 mobile](p2-02-catalog-mobile.png)

**BUY-010 · P2 · Desktop price and quantity controls compete for space**

Route: `/dispensary/catalog`. Affected: desktop.

Price and unit break across lines on desktop while quantity controls and Add to Request crowd the same area.

Recommendation: Give price its own compact row; place quantity and Add to draft together beneath it.

Pass 1: observed. Pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 1 desktop](p1-02-catalog-desktop.png) · [Pass 2 desktop](p2-02-catalog-desktop.png)

**BUY-011 · P2 · Missing-photo placeholders dominate listings**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Missing-photo fallback is a large repeated leaf occupying 192px per card and contributes to 2845px for only three products.

Recommendation: Use a compact thumbnail row for missing images or a shorter fallback aspect ratio.

Pass 1: observed. Pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 1 desktop](p1-02-catalog-desktop.png) · [Pass 1 mobile](p1-02-catalog-mobile.png) · [Pass 2 desktop](p2-02-catalog-desktop.png) · [Pass 2 mobile](p2-02-catalog-mobile.png)

**BUY-012 · P3 · Catalog repeats counts and view state**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Counts repeat in 3 of 3 products, grower 3 products, and a large bottom end-of-results notice; View: Grid repeats the selected toggle.

Recommendation: Show the count once and remove View: Grid; reduce end marker to End of results.

Pass 1: observed. Pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 1 desktop](p1-02-catalog-desktop.png) · [Pass 1 mobile](p1-02-catalog-mobile.png) · [Pass 2 desktop](p2-02-catalog-desktop.png) · [Pass 2 mobile](p2-02-catalog-mobile.png)

**BUY-013 · P3 · Sparse grower groups retain a four-column grid**

Route: `/dispensary/catalog`. Affected: desktop.

Desktop grid leaves an entire unused fourth-column slot for a three-item grower group.

Recommendation: Let low-count groups fit three useful-width cards instead of fixed four narrow columns.

Pass 1: observed. Pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 1 desktop](p1-02-catalog-desktop.png) · [Pass 2 desktop](p2-02-catalog-desktop.png)


### Empty request draft

**BUY-014 · P2 · Empty draft repeats payment guidance**

Route: `/dispensary/cart`. Affected: desktop, mobile.

No wholesale payment is collected is explained both under Request draft and again inside the empty state.

Recommendation: Keep one short sentence: Send requests here; arrange payment with the grower.

Pass 1: observed. Pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

[Pass 1 desktop](p1-03-cart-empty-desktop.png) · [Pass 1 mobile](p1-03-cart-empty-mobile.png) · [Pass 2 desktop](p2-03-cart-empty-desktop.png) · [Pass 2 mobile](p2-03-cart-empty-mobile.png)

**BUY-015 · P2 · Quote-only suggestions use an ambiguous Add action**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Quote only suggestion presents the same Add action as a priced product.

Recommendation: Use Request pricing for quote-only suggestions or clearly indicate that a quote is needed before submission.

Pass 1: observed. Pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

[Pass 1 desktop](p1-03-cart-empty-desktop.png) · [Pass 1 mobile](p1-03-cart-empty-mobile.png) · [Pass 2 desktop](p2-03-cart-empty-desktop.png) · [Pass 2 mobile](p2-03-cart-empty-mobile.png)

**BUY-016 · P3 · Empty-state copy and illustration delay suggestions**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Start a request from the catalog plus a multi-line process explanation and large plus icon delay suggestions.

Recommendation: Use Your draft is empty with Add products to get started; reduce illustration padding.

Pass 1: observed. Pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

[Pass 1 desktop](p1-03-cart-empty-desktop.png) · [Pass 1 mobile](p1-03-cart-empty-mobile.png) · [Pass 2 desktop](p2-03-cart-empty-desktop.png) · [Pass 2 mobile](p2-03-cart-empty-mobile.png)

**BUY-017 · P3 · Saved destination label is unnecessarily abstract**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Open saved workspace is longer and more abstract than the destination content.

Recommendation: Use Saved items.

Pass 1: observed. Pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

[Pass 1 desktop](p1-03-cart-empty-desktop.png) · [Pass 1 mobile](p1-03-cart-empty-mobile.png) · [Pass 2 desktop](p2-03-cart-empty-desktop.png) · [Pass 2 mobile](p2-03-cart-empty-mobile.png)


### Populated request draft

**BUY-018 · P2 · Draft repeats direct-payment guidance**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Payment outside PhenoFarm is repeated in the page introduction, Terms helper, summary notice, and selected Handled directly summary.

Recommendation: Keep one concise note below payment terms: Arrange payment directly with the grower.

Pass 1: observed. Pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

[Pass 1 desktop](p1-03-cart-filled-desktop.png) · [Pass 1 mobile](p1-03-cart-filled-mobile.png) · [Pass 2 desktop](p2-03-cart-filled-desktop.png) · [Pass 2 mobile](p2-03-cart-filled-mobile.png) · [Pass 2 mobile viewport](p2-cart-sticky-viewport-mobile.png)

**BUY-019 · P2 · Default and refresh notices dominate mobile draft**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Smart request defaults and an always-visible inventory-refreshed banner consume about 190px on mobile before the one item. Banner discusses unavailable items even when none are unavailable.

Recommendation: Use a small Reuse last request control; show a change banner only when something actually changed.

Pass 1: observed. Pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

[Pass 1 desktop](p1-03-cart-filled-desktop.png) · [Pass 1 mobile](p1-03-cart-filled-mobile.png) · [Pass 2 desktop](p2-03-cart-filled-desktop.png) · [Pass 2 mobile](p2-03-cart-filled-mobile.png) · [Pass 2 mobile viewport](p2-cart-sticky-viewport-mobile.png)

**BUY-020 · P2 · Optional fields appear as warnings**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Yellow Optional fixes before review presents missing optional timing/notes as warning cards and repeats both field prompts.

Recommendation: Keep (optional) next to fields; remove warnings unless a required action blocks submission.

Pass 1: observed. Pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

[Pass 1 desktop](p1-03-cart-filled-desktop.png) · [Pass 1 mobile](p1-03-cart-filled-mobile.png) · [Pass 2 desktop](p2-03-cart-filled-desktop.png) · [Pass 2 mobile](p2-03-cart-filled-mobile.png) · [Pass 2 mobile viewport](p2-cart-sticky-viewport-mobile.png)

**BUY-021 · P2 · Mobile draft stepper duplicates visible sections**

Route: `/dispensary/cart`. Affected: mobile.

Mobile four-step tracker takes two rows even though all form sections are already displayed together.

Recommendation: Use a compact Draft / Review indicator or section anchors in one row.

Pass 1: observed. Pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

[Pass 1 mobile](p1-03-cart-filled-mobile.png) · [Pass 2 mobile](p2-03-cart-filled-mobile.png) · [Pass 2 mobile viewport](p2-cart-sticky-viewport-mobile.png)

**BUY-022 · P3 · Draft summary repeats form details**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Summary repeats single-grower request count, fulfillment and payment terms already shown in the form.

Recommendation: Show total and grower count compactly; reserve the full recap for Review.

Pass 1: observed. Pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

[Pass 1 desktop](p1-03-cart-filled-desktop.png) · [Pass 1 mobile](p1-03-cart-filled-mobile.png) · [Pass 2 desktop](p2-03-cart-filled-desktop.png) · [Pass 2 mobile](p2-03-cart-filled-mobile.png) · [Pass 2 mobile viewport](p2-cart-sticky-viewport-mobile.png)

**BUY-023 · P2 · Remove-item touch target is too narrow**

Route: `/dispensary/cart`. Affected: mobile.

Remove-item target is only 16px wide at mobile size (40px high).

Recommendation: Provide at least a 40px square icon-button target without increasing the icon.

Pass 1: observed. Pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

[Pass 1 mobile](p1-03-cart-filled-mobile.png) · [Pass 2 mobile](p2-03-cart-filled-mobile.png) · [Pass 2 mobile viewport](p2-cart-sticky-viewport-mobile.png)


### Order list

**BUY-024 · P2 · Mobile order stats consume four rows**

Route: `/dispensary/orders`. Affected: mobile.

Mobile stacks all four summary cards vertically unlike the dashboard two-column layout.

Recommendation: Use a two-by-two compact grid or a single summary line; put search/list first.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

[Pass 1 mobile](p1-04-orders-mobile.png) · [Pass 2 mobile](p2-04-orders-mobile.png)

**BUY-025 · P2 · Mobile order cards repeat labels and actions**

Route: `/dispensary/orders`. Affected: mobile.

Each mobile request occupies a large card with separate Date/Est. value labels, repeated View request button, and long full request ID.

Recommendation: Use a compact two-line tappable row: short ID + status, grower/date + amount. Keep full ID on the detail screen.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

[Pass 1 mobile](p1-04-orders-mobile.png) · [Pass 2 mobile](p2-04-orders-mobile.png)

**BUY-026 · P3 · Order page repeats its heading**

Route: `/dispensary/orders`. Affected: desktop, mobile.

Order Requests then Request Tracker repeats the section purpose.

Recommendation: Use Orders as the page title and omit the inner tracker heading.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

[Pass 1 desktop](p1-04-orders-desktop.png) · [Pass 1 mobile](p1-04-orders-mobile.png) · [Pass 2 desktop](p2-04-orders-desktop.png) · [Pass 2 mobile](p2-04-orders-mobile.png)

**BUY-027 · P3 · Order search placeholder is clipped**

Route: `/dispensary/orders`. Affected: desktop, mobile.

Search request or grower is clipped in a fixed-width field even on desktop.

Recommendation: Use Search orders and allow the input to grow within the filter row.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

[Pass 1 desktop](p1-04-orders-desktop.png) · [Pass 1 mobile](p1-04-orders-mobile.png) · [Pass 2 desktop](p2-04-orders-desktop.png) · [Pass 2 mobile](p2-04-orders-mobile.png)

**BUY-028 · P3 · Order result count appears twice**

Route: `/dispensary/orders`. Affected: desktop, mobile.

Showing 19 of 19 requests and Page 1 · 19 matching requests repeat the same total.

Recommendation: Keep a single 19 requests summary next to pagination.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

[Pass 1 desktop](p1-04-orders-desktop.png) · [Pass 1 mobile](p1-04-orders-mobile.png) · [Pass 2 desktop](p2-04-orders-desktop.png) · [Pass 2 mobile](p2-04-orders-mobile.png)

**BUY-029 · P3 · Order status wording differs across pages**

Route: `/dispensary/orders`. Affected: desktop, mobile.

Waiting on Growers here differs from Requests Waiting on the dashboard; Estimated Request Value is verbose.

Recommendation: Use Awaiting response and Request value consistently.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

[Pass 1 desktop](p1-04-orders-desktop.png) · [Pass 1 mobile](p1-04-orders-mobile.png) · [Pass 2 desktop](p2-04-orders-desktop.png) · [Pass 2 mobile](p2-04-orders-mobile.png)


### Order detail

**BUY-030 · P2 · Order status is repeated four times**

Route: `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`. Affected: desktop, mobile.

Submitted is shown as the header badge, timeline step, Currently: Submitted banner, and a one-entry History card.

Recommendation: Keep status once near the heading and a compact progress line; collapse History behind View history.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

[Pass 1 desktop](p1-05-order-detail-desktop.png) · [Pass 1 mobile](p1-05-order-detail-mobile.png) · [Pass 2 desktop](p2-05-order-detail-desktop.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png)

**BUY-031 · P2 · Mobile timeline delays requested items**

Route: `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`. Affected: mobile.

Five vertical fulfillment stages and Pending on every future stage create a large mobile block before the requested product.

Recommendation: Show Submitted · Awaiting grower with a compact expandable timeline; remove 5 stages and repeated Pending.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

[Pass 1 mobile](p1-05-order-detail-mobile.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png)

**BUY-032 · P2 · Buyer action copy is noisy and state-inaccurate**

Route: `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`. Affected: desktop, mobile.

Buyer Actions explains three actions, then a red withdrawal explanation appears before any withdrawal intent. The paragraph also promises rebuilding although this pending-order state has no rebuild action.

Recommendation: Show the available actions directly; place withdrawal consequences in its confirmation and tailor copy to the current state.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

[Pass 1 desktop](p1-05-order-detail-desktop.png) · [Pass 1 mobile](p1-05-order-detail-mobile.png) · [Pass 2 desktop](p2-05-order-detail-desktop.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png)

**BUY-033 · P3 · Two message actions compete**

Route: `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`. Affected: desktop, mobile.

Message Grower and Request Update are adjacent variants of contacting the same person.

Recommendation: Use one Message grower action with an optional Request an update suggestion in the composer.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

[Pass 1 desktop](p1-05-order-detail-desktop.png) · [Pass 1 mobile](p1-05-order-detail-mobile.png) · [Pass 2 desktop](p2-05-order-detail-desktop.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png)

**BUY-034 · P3 · Request value is repeated**

Route: `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`. Affected: desktop, mobile.

Item value and request value both show the same $25.00, followed by another payment-outside-app explanation.

Recommendation: Show one Total unless fees change it; keep direct-payment terms in Request details.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

[Pass 1 desktop](p1-05-order-detail-desktop.png) · [Pass 1 mobile](p1-05-order-detail-mobile.png) · [Pass 2 desktop](p2-05-order-detail-desktop.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png)

**BUY-035 · P3 · Export occupies a separate row**

Route: `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`. Affected: desktop, mobile.

Export record (CSV) occupies its own separate row/card gap.

Recommendation: Place Export CSV in the heading overflow/actions menu.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

[Pass 1 desktop](p1-05-order-detail-desktop.png) · [Pass 1 mobile](p1-05-order-detail-mobile.png) · [Pass 2 desktop](p2-05-order-detail-desktop.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png)

**BUY-036 · P3 · Neutral details use warning styling**

Route: `/dispensary/orders/cmre7ky2400aaekhl0qlnwhqd`. Affected: desktop, mobile.

Neutral request details use warning-like amber type and verbose DIRECT PAYMENT TERMS label.

Recommendation: Use neutral text and Payment terms.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

[Pass 1 desktop](p1-05-order-detail-desktop.png) · [Pass 1 mobile](p1-05-order-detail-mobile.png) · [Pass 2 desktop](p2-05-order-detail-desktop.png) · [Pass 2 mobile](p2-05-order-detail-mobile.png)


### Grower shop

**BUY-037 · P2 · Shop repeats verification and category details**

Route: `/dispensary/grower/grower-001`. Affected: desktop, mobile.

Verified badge/license in the hero are repeated in a separate License card; product types appear in both a large stat and product filters.

Recommendation: Keep verification/license in the header; combine product count and types into one short line.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 1 desktop](p1-06-grower-shop-desktop.png) · [Pass 1 mobile](p1-06-grower-shop-mobile.png) · [Pass 2 desktop](p2-06-grower-shop-desktop.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-shop-message-anchor-mobile.png)

**BUY-038 · P2 · Commercial terms delay the mobile product list**

Route: `/dispensary/grower/grower-001`. Affected: mobile.

Four separate commercial-term cards stack before any products on mobile.

Recommendation: Show a compact Pickup/delivery · No minimum summary and expandable Shop details beneath the product list.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 1 mobile](p1-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-shop-message-anchor-mobile.png)

**BUY-039 · P2 · Shop message label opens an anchor**

Route: `/dispensary/grower/grower-001`. Affected: desktop, mobile.

Message from a listing is the prominent header CTA but it scrolls toward products instead of opening a message composer.

Recommendation: Label it View products or Browse listings, or offer a direct Message grower action with clear context.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 1 desktop](p1-06-grower-shop-desktop.png) · [Pass 1 mobile](p1-06-grower-shop-mobile.png) · [Pass 2 desktop](p2-06-grower-shop-desktop.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-shop-message-anchor-mobile.png)

**BUY-040 · P2 · Shop placeholders dominate mobile product cards**

Route: `/dispensary/grower/grower-001`. Affected: mobile.

Mobile product images are large square repeated placeholders; only three listings yield 3670px of page height.

Recommendation: Use shorter image ratios or compact missing-photo rows and bring a product name/price into the first screen.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 1 mobile](p1-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-shop-message-anchor-mobile.png)

**BUY-041 · P3 · Shop card wording differs from catalog**

Route: `/dispensary/grower/grower-001`. Affected: desktop, mobile.

Product card language/styles differ from catalog: purple THC badge, Featured sort vs Grouped by grower, Request Pricing vs Request pricing, gram casing, and a second In Stock below quantity availability.

Recommendation: Reuse consistent card tokens/labels and one availability statement across catalog and shop.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 1 desktop](p1-06-grower-shop-desktop.png) · [Pass 1 mobile](p1-06-grower-shop-mobile.png) · [Pass 2 desktop](p2-06-grower-shop-desktop.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-shop-message-anchor-mobile.png)

**BUY-042 · P3 · Commercial terms mix topics and repeat payment copy**

Route: `/dispensary/grower/grower-001`. Affected: desktop, mobile.

Order minimums card also contains response time; settlement card repeats direct payment twice.

Recommendation: Separate factual short labels: Minimum: none set · Replies: 1 business day · Payment: direct.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 1 desktop](p1-06-grower-shop-desktop.png) · [Pass 1 mobile](p1-06-grower-shop-mobile.png) · [Pass 2 desktop](p2-06-grower-shop-desktop.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-shop-message-anchor-mobile.png)

**BUY-043 · P3 · Shop repeats product-list context**

Route: `/dispensary/grower/grower-001`. Affected: desktop, mobile.

All Products / Browse the full catalog / Showing 3 of 3 products repeats context.

Recommendation: Use Products (3) beside the search controls.

Pass 1: observed. Pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 1 desktop](p1-06-grower-shop-desktop.png) · [Pass 1 mobile](p1-06-grower-shop-mobile.png) · [Pass 2 desktop](p2-06-grower-shop-desktop.png) · [Pass 2 mobile](p2-06-grower-shop-mobile.png) · [Pass 2 mobile](p2-shop-message-anchor-mobile.png)


### Settings

**BUY-044 · P2 · Desktop branding card stretches into empty space**

Route: `/dispensary/settings`. Affected: desktop.

Branding panel is as tall as the full business form although it contains only a small logo uploader, wasting most of the desktop right column.

Recommendation: Make branding a compact top card and use available width for two-column form groups; align cards to content height.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

[Pass 1 desktop](p1-07-settings-desktop.png) · [Pass 2 desktop](p2-07-settings-desktop.png)

**BUY-045 · P2 · Complete account still receives setup instructions**

Route: `/dispensary/settings`. Affected: desktop, mobile.

Verified/complete account still shows REQUIRED FIRST and tells the buyer to finish already completed fields.

Recommendation: Show this guidance only when required information is missing; otherwise keep one Verified through date line.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

[Pass 1 desktop](p1-07-settings-desktop.png) · [Pass 1 mobile](p1-07-settings-mobile.png) · [Pass 2 desktop](p2-07-settings-desktop.png) · [Pass 2 mobile](p2-07-settings-mobile.png)

**BUY-046 · P2 · License fields are grouped under the wrong section**

Route: `/dispensary/settings`. Affected: desktop, mobile.

License & verification contains only notices; license number/state/expiry fields are under Business profile.

Recommendation: Move those three fields into License & verification so section links match the work.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

[Pass 1 desktop](p1-07-settings-desktop.png) · [Pass 1 mobile](p1-07-settings-mobile.png) · [Pass 2 desktop](p2-07-settings-desktop.png) · [Pass 2 mobile](p2-07-settings-mobile.png)

**BUY-047 · P3 · Settings labels repeat account context**

Route: `/dispensary/settings`. Affected: desktop, mobile.

Long labels repeat account context: Dispensary Settings, Dispensary License Number, Business Email/Phone/Description.

Recommendation: Use Settings, License number, Email, Phone, Description where the section already supplies context.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

[Pass 1 desktop](p1-07-settings-desktop.png) · [Pass 1 mobile](p1-07-settings-mobile.png) · [Pass 2 desktop](p2-07-settings-desktop.png) · [Pass 2 mobile](p2-07-settings-mobile.png)

**BUY-048 · P3 · Persistent footer repeats draft and shortcut guidance**

Route: `/dispensary/settings`. Affected: desktop, mobile.

Persistent save footer always says Settings drafts save in this browser and shows keyboard instructions, including Ctrl+S on this Mac review.

Recommendation: Show Unsaved changes / Saved status only when relevant; use platform-appropriate shortcut hints or omit them.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

[Pass 1 desktop](p1-07-settings-desktop.png) · [Pass 1 mobile](p1-07-settings-mobile.png) · [Pass 2 desktop](p2-07-settings-desktop.png) · [Pass 2 mobile](p2-07-settings-mobile.png)

**BUY-049 · P3 · Sign-out action lacks a visible label**

Route: `/dispensary/settings`. Affected: desktop, mobile.

Bottom Account section explains signing out but uses only an unlabeled-in-appearance exit icon for the action.

Recommendation: Use a plainly labelled Sign out button and remove the explanatory sentence.

Pass 1: observed. Pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

[Pass 1 desktop](p1-07-settings-desktop.png) · [Pass 1 mobile](p1-07-settings-mobile.png) · [Pass 2 desktop](p2-07-settings-desktop.png) · [Pass 2 mobile](p2-07-settings-mobile.png)


### Saved favorites

**BUY-050 · P2 · Saved header and tabs delay the first product**

Route: `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`. Affected: desktop, mobile.

Saved Workspace introduction, three descriptive tabs, My Favorites/count card and separate sorting card push the first product name to y1063 on mobile. Tabs alone occupy roughly 225px.

Recommendation: Use Saved as the heading; a compact horizontal Favorites 1 / Alerts 1 / Recent 1 tab row; combine count, sort and view controls in one toolbar.

Pass 1: observed. Pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

[Pass 1 desktop](p1-08-favorites-alias-desktop.png) · [Pass 1 mobile](p1-08-favorites-alias-mobile.png) · [Pass 2 desktop](p2-08-favorites-alias-desktop.png) · [Pass 2 mobile](p2-08-favorites-alias-mobile.png) · [Pass 1 desktop](p1-10-saved-desktop.png) · [Pass 1 mobile](p1-10-saved-mobile.png) · [Pass 2 desktop](p2-10-saved-desktop.png) · [Pass 2 mobile](p2-10-saved-mobile.png)

**BUY-051 · P2 · Clear favorites is too prominent**

Route: `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`. Affected: desktop, mobile.

Clear All is a prominent red standalone action in a large count card even with only one favorite, competing with the product task.

Recommendation: Move Clear favorites into an overflow menu; show a small count beside the active tab.

Pass 1: observed. Pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

[Pass 1 desktop](p1-08-favorites-alias-desktop.png) · [Pass 1 mobile](p1-08-favorites-alias-mobile.png) · [Pass 2 desktop](p2-08-favorites-alias-desktop.png) · [Pass 2 mobile](p2-08-favorites-alias-mobile.png) · [Pass 1 desktop](p1-10-saved-desktop.png) · [Pass 1 mobile](p1-10-saved-mobile.png) · [Pass 2 desktop](p2-10-saved-desktop.png) · [Pass 2 mobile](p2-10-saved-mobile.png)

**BUY-052 · P3 · Saved quote-only card repeats pricing guidance**

Route: `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`. Affected: desktop, mobile.

Hidden-price product says Request pricing in the section label and the button, with a full explanation between them.

Recommendation: Keep one Request pricing button plus a short Prices on request label, or remove the label entirely.

Pass 1: observed. Pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

[Pass 1 desktop](p1-08-favorites-alias-desktop.png) · [Pass 1 mobile](p1-08-favorites-alias-mobile.png) · [Pass 2 desktop](p2-08-favorites-alias-desktop.png) · [Pass 2 mobile](p2-08-favorites-alias-mobile.png) · [Pass 1 desktop](p1-10-saved-desktop.png) · [Pass 1 mobile](p1-10-saved-mobile.png) · [Pass 2 desktop](p2-10-saved-desktop.png) · [Pass 2 mobile](p2-10-saved-mobile.png)

**BUY-053 · P3 · Sparse favorites grid wastes space**

Route: `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`. Affected: desktop, mobile.

An isolated narrow card leaves most of the desktop content area empty, while its large decorative fallback image is dominant on mobile.

Recommendation: Use a compact list row when there are few saved products, or give the grid a sensible wider minimum card size and a shorter image fallback.

Pass 1: observed. Pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

[Pass 1 desktop](p1-08-favorites-alias-desktop.png) · [Pass 1 mobile](p1-08-favorites-alias-mobile.png) · [Pass 2 desktop](p2-08-favorites-alias-desktop.png) · [Pass 2 mobile](p2-08-favorites-alias-mobile.png) · [Pass 1 desktop](p1-10-saved-desktop.png) · [Pass 1 mobile](p1-10-saved-mobile.png) · [Pass 2 desktop](p2-10-saved-desktop.png) · [Pass 2 mobile](p2-10-saved-mobile.png)


### Saved price alerts

**BUY-054 · P2 · Alert summary delays the first mobile product**

Route: `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`. Affected: mobile.

Saved navigation plus the alert summary occupies most of the first mobile screen; the first product title is y962. The mobile summary becomes a large vertical stack of two counts and two isolated icons.

Recommendation: Use the compact Saved tabs and one alert toolbar: Active 1 · Triggered 0, Refresh icon with an accessible name; keep secondary counts off the main hierarchy.

Pass 1: observed. Pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

[Pass 1 mobile](p1-09-price-alerts-alias-mobile.png) · [Pass 2 mobile](p2-09-price-alerts-alias-mobile.png)

**BUY-055 · P3 · Alert counts appear three times**

Route: `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`. Affected: desktop, mobile.

Desktop repeats 1 active/0 triggered, 1 Active Alerts/0 Price Drops, and Active 1.

Recommendation: Show counts once in Active (1), Triggered (0), History tabs.

Pass 1: observed. Pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

[Pass 1 desktop](p1-09-price-alerts-alias-desktop.png) · [Pass 1 mobile](p1-09-price-alerts-alias-mobile.png) · [Pass 2 desktop](p2-09-price-alerts-alias-desktop.png) · [Pass 2 mobile](p2-09-price-alerts-alias-mobile.png)

**BUY-056 · P3 · Alert cards repeat target price and units**

Route: `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`. Affected: desktop, mobile.

Target price $20.00 repeats in both a price box and Alert at $20.00 badge; gram appears as a separate product badge and twice below prices.

Recommendation: Keep Current $25/g and Target $20/g together; remove the duplicate target badge and standalone unit badge.

Pass 1: observed. Pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

[Pass 1 desktop](p1-09-price-alerts-alias-desktop.png) · [Pass 1 mobile](p1-09-price-alerts-alias-mobile.png) · [Pass 2 desktop](p2-09-price-alerts-alias-desktop.png) · [Pass 2 mobile](p2-09-price-alerts-alias-mobile.png)

**BUY-057 · P3 · Manual price-check explanation needs shorter copy**

Route: `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`. Affected: desktop, mobile.

Important manual-check limitation is a long sentence; Clear All and Refresh Prices lose all visible text on mobile.

Recommendation: Shorten to Checks when you visit or refresh. Put Clear all in an overflow menu and retain a compact Refresh label.

Pass 1: observed. Pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

[Pass 1 desktop](p1-09-price-alerts-alias-desktop.png) · [Pass 1 mobile](p1-09-price-alerts-alias-mobile.png) · [Pass 2 desktop](p2-09-price-alerts-alias-desktop.png) · [Pass 2 mobile](p2-09-price-alerts-alias-mobile.png)


### Saved recent

**BUY-058 · P3 · Recent tab repeats its purpose and metadata**

Route: `/dispensary/saved?tab=recent`. Affected: desktop, mobile.

Recently Requested tab description, section title and Use these products as a starting point for repeat order requests all explain the same task. Product metadata repeats ordered twice.

Recommendation: Use Recent in the tab and omit the explanation. Metadata: Vermont Nurseries · 19 requests · Jul 9. Shorten price to $25/g where unit meaning is established.

Pass 1: observed. Pass 2: confirmed. Second freshly reopened Recent tab confirms the one pass-one copy finding. Product row itself remains compact and sound.

[Pass 1 desktop](p1-10-saved-recent-desktop.png) · [Pass 1 mobile](p1-10-saved-recent-mobile.png) · [Pass 2 desktop](p2-10-saved-recent-desktop.png) · [Pass 2 mobile](p2-10-saved-recent-mobile.png)


### Shared mobile navigation

**BUY-059 · P3 · Mobile navigation has unnecessary categories**

Route: `/dispensary/*`. Affected: mobile.

Six navigation destinations are split under five tiny letter-spaced section labels, while the menu header also repeats Dispensary Portal. This adds hierarchy with little information.

Recommendation: Use one straightforward list, optionally a single Shop grouping; remove the role subtitle. Keep the current 14px link text and generous rows.

Pass 1: control-state-not-inspected. Pass 2: discovered. Inspected the open menu and confirmed Escape closes it.

[Pass 2 mobile](p2-shared-menu-mobile.png)


### Shared search dialog

**BUY-060 · P3 · Search empty state repeats instructions**

Route: `/dispensary/*`. Affected: mobile.

Long mobile search placeholder crowds the close control; the empty state repeats Start typing to search and three category chips, and the footer says 0 results before a query exists.

Recommendation: Use Search PhenoFarm or Search products and orders; hide result counts until a query is entered.

Pass 1: control-state-not-inspected. Pass 2: discovered. Empty and populated search states inspected at both widths; query was typed without a form submission.

[Pass 2 mobile](p2-shared-search-mobile.png) · [Pass 2 mobile](p2-shared-search-results-mobile.png)

**BUY-061 · P3 · Touch search shows keyboard hints and plural error**

Route: `/dispensary/*`. Affected: mobile.

Mobile fullscreen search displays tiny keyboard navigation/Enter/Escape instructions even though the interface is being used as a touch layout; 1 results is also ungrammatical.

Recommendation: Hide keyboard hints on touch widths and use 1 result / N results.

Pass 1: control-state-not-inspected. Pass 2: discovered. Empty and populated search states inspected at both widths; query was typed without a form submission.

[Pass 2 mobile](p2-shared-search-results-mobile.png)

**BUY-062 · P3 · Search result secondary actions are small**

Route: `/dispensary/*`. Affected: mobile.

Saved and message icons in search results are only 32x32px on mobile.

Recommendation: Use at least 40x40px touch areas, or move secondary actions to the destination screen.

Pass 1: control-state-not-inspected. Pass 2: discovered. Empty and populated search states inspected at both widths; query was typed without a form submission.

[Pass 2 mobile](p2-shared-search-results-mobile.png)


### Shared notifications

**BUY-063 · P2 · Notifications omit distinguishing product context**

Route: `/dispensary/*`. Affected: desktop, mobile.

Rows repeat Quote accepted or New quote terms plus generic multi-line explanations, but omit the product/grower that would distinguish entries. Eighteen older rows are visually near-identical.

Recommendation: Use a specific one-line event such as Vermont Nurseries accepted Purple Haze quote, then a short date. Group related older events where appropriate.

Pass 1: control-state-not-inspected. Pass 2: discovered. Panel opened independently at each width and inspected; no notification or mark-read action used.

[Pass 2 desktop](p2-shared-notifications-desktop.png) · [Pass 2 mobile](p2-shared-notifications-mobile.png)

**BUY-064 · P3 · Notification panel opens far from its trigger**

Route: `/dispensary/*`. Affected: desktop.

Desktop notifications opens at the far upper-right even though its trigger is in the left sidebar, increasing the visual distance between action and result.

Recommendation: Anchor the desktop panel beside the sidebar trigger or use a consistently placed notification drawer.

Pass 1: control-state-not-inspected. Pass 2: discovered. Panel opened independently at each width and inspected; no notification or mark-read action used.

[Pass 2 desktop](p2-shared-notifications-desktop.png)


### Catalog

**BUY-065 · P2 · Catalog shows an orphan draft-count badge**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

With a populated draft, the catalog header displays a standalone red 2 badge without a cart icon, label or action. It floats at the far right on desktop and creates a new row beneath the intro on mobile.

Recommendation: Attach the count to a clear View draft button or remove it here because the main navigation already shows the draft count.

Pass 1: control-state-not-inspected. Pass 2: discovered. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

[Pass 2 desktop](p2-02-catalog-desktop.png) · [Pass 2 mobile](p2-02-catalog-mobile.png)


### Catalog filters

**BUY-066 · P1 · Open desktop filters clip product action controls**

Route: `/dispensary/catalog`. Affected: desktop.

Opening the desktop filter sidebar retains a four-column product grid in the reduced content width. Product cards narrow to about 190px and clip quantity increment controls and the Add to Request buttons at their right edges.

Recommendation: Reduce the column count while filters are open, enforce a minimum usable card width, and stack price above quantity/action when needed. Verify controls inside the card bounds, not just page overflow.

Pass 1: control-state-not-inspected. Pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

[Pass 2 desktop](p2-catalog-filters-desktop.png)

**BUY-067 · P2 · Filter shortcuts are oversized**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Favorites and Recently Added each take a large decorative card before the actual filter groups, pushing Unit Price below the initial mobile sheet viewport.

Recommendation: Use two compact checkbox or switch rows: Favorites (1) and Added in 7 days. Keep product type, THC and unit price visible with less padding.

Pass 1: control-state-not-inspected. Pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

[Pass 2 desktop](p2-catalog-filters-desktop.png) · [Pass 2 mobile](p2-catalog-filters-mobile.png)

**BUY-068 · P3 · Filter action and toggle labels are unclear**

Route: `/dispensary/catalog`. Affected: mobile.

Mobile primary action reads Apply Filters All; All does not explain whether it is a result count or state. Favorites toggle is named only Off in the accessibility snapshot.

Recommendation: Use Show 3 products or Apply filters; label the toggle Favorites only with a separate on/off state.

Pass 1: control-state-not-inspected. Pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

[Pass 2 mobile](p2-catalog-filters-mobile.png)

**BUY-069 · P3 · Price filters repeat unit wording**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Each price option repeats per unit below Unit Price and Wholesale price per unit.

Recommendation: Keep Price per unit as the heading and use < $10, $10–25, $25–50, $50+ as options.

Pass 1: control-state-not-inspected. Pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

[Pass 2 desktop](p2-catalog-filters-desktop.png) · [Pass 2 mobile](p2-catalog-filters-mobile.png)


### Catalog pricing message dialog

**BUY-070 · P2 · Mobile message context truncates both names**

Route: `/dispensary/catalog`. Affected: mobile.

Mobile product and grower names are both truncated inside one compact pill, obscuring the recipient/context before sending.

Recommendation: Use two short wrapping lines: product name and To: grower, with no pill width constraint.

Pass 1: control-state-not-inspected. Pass 2: discovered. Opened the unsent composer at both widths; did not submit.

[Pass 2 mobile](p2-catalog-pricing-dialog-mobile.png)

**BUY-071 · P2 · Mobile message input text is small**

Route: `/dispensary/catalog`. Affected: mobile.

The message textarea uses 14px text on mobile, smaller than the 16px form fields elsewhere.

Recommendation: Use 16px input text on small screens while keeping labels and supporting text compact.

Pass 1: control-state-not-inspected. Pass 2: discovered. Opened the unsent composer at both widths; did not submit.

[Pass 2 mobile](p2-catalog-pricing-dialog-mobile.png)

**BUY-072 · P3 · Pricing composer repeats explanations**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Title is followed by Send a note to the grower about this listing; three long template chips stack vertically; a separate green box explains drawer behavior in two sentences.

Recommendation: Remove the subtitle, shorten templates to Pricing & MOQ / Availability / Introduction, and use Replies in Messages as a single quiet line.

Pass 1: control-state-not-inspected. Pass 2: discovered. Opened the unsent composer at both widths; did not submit.

[Pass 2 desktop](p2-catalog-pricing-dialog-desktop.png) · [Pass 2 mobile](p2-catalog-pricing-dialog-mobile.png)


### Catalog price alert dialog

**BUY-073 · P2 · Price alert dialog omits manual-check limitation**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

The dialog says Alert me when the product drops below this target price, but omits the manual-check limitation disclosed on Saved alerts. It can imply monitoring outside the app.

Recommendation: Use Track a target price, with Checks when you visit or refresh Saved. Keep the limitation short and visible before saving.

Pass 1: control-state-not-inspected. Pass 2: discovered. Opened unsaved alert dialog at both widths; inspected without submitting.

[Pass 2 desktop](p2-catalog-alert-dialog-desktop.png) · [Pass 2 mobile](p2-catalog-alert-dialog-mobile.png)

**BUY-074 · P3 · Price alert dialog omits sale unit**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Target price and Current $60 omit the sale unit, and the dialog uses an inner floating card inside another modal card.

Recommendation: Label Target price ($/g), show Current $60/g, and remove the nested shadow/card padding.

Pass 1: control-state-not-inspected. Pass 2: discovered. Opened unsaved alert dialog at both widths; inspected without submitting.

[Pass 2 desktop](p2-catalog-alert-dialog-desktop.png) · [Pass 2 mobile](p2-catalog-alert-dialog-mobile.png)


### Catalog comparison

**BUY-075 · P1 · Comparison dialog sits behind navigation**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Comparison dialog sits behind the fixed navigation. Desktop sidebar obscures the dialog left edge, including title, first product name and row labels; mobile header overlaps the comparison heading.

Recommendation: Render the comparison overlay at the shared modal layer above all navigation, and keep the panel within the visible viewport.

Pass 1: control-state-not-inspected. Pass 2: discovered. Two browser-local comparison selections opened; initial and scrolled mobile content inspected.

[Pass 2 desktop](p2-catalog-compare-desktop.png) · [Pass 2 mobile](p2-catalog-compare-mobile.png) · [Pass 2 mobile](p2-catalog-compare-lower-mobile.png)

**BUY-076 · P2 · Mobile comparison columns are too narrow**

Route: `/dispensary/catalog`. Affected: mobile.

Mobile comparison uses two 115px-wide content columns, each repeating every attribute label beside its value. Prices, product types and headings wrap heavily; key controls are far below the first view.

Recommendation: Use one shared label per attribute with two values beneath it, compact product headers, and short unit notation. Keep comparison actions outside narrow value columns.

Pass 1: control-state-not-inspected. Pass 2: discovered. Two browser-local comparison selections opened; initial and scrolled mobile content inspected.

[Pass 2 mobile](p2-catalog-compare-mobile.png) · [Pass 2 mobile](p2-catalog-compare-lower-mobile.png)

**BUY-077 · P3 · Comparison repeats decorative and explanatory content**

Route: `/dispensary/catalog`. Affected: desktop, mobile.

Two giant repeated leaf placeholders and Comparing 2 products side-by-side consume space that does not help compare products. Grower appears under the title and again in an attribute row.

Recommendation: Use small thumbnails, a concise Compare (2) title, omit the explanatory subtitle and show grower once.

Pass 1: control-state-not-inspected. Pass 2: discovered. Two browser-local comparison selections opened; initial and scrolled mobile content inspected.

[Pass 2 desktop](p2-catalog-compare-desktop.png) · [Pass 2 mobile](p2-catalog-compare-mobile.png) · [Pass 2 mobile](p2-catalog-compare-lower-mobile.png)


### Populated request draft

**BUY-078 · P3 · Mobile draft Add link is ambiguous**

Route: `/dispensary/cart`. Affected: mobile.

The sticky mobile secondary action is labeled only Add, which does not identify that it returns to the catalog.

Recommendation: Use Add items or Browse catalog.

Pass 1: control-state-not-inspected. Pass 2: discovered. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

[Pass 2 mobile viewport](p2-cart-sticky-viewport-mobile.png)


### Cart request review dialog

**BUY-079 · P1 · Mobile review dialog clips submission and back actions**

Route: `/dispensary/cart`. Affected: mobile.

At 390x844 the review panel ends at y802 with overflow hidden, while Submit Order Request runs y777–817 and Back to Draft runs y829–871. Submit is partly cut off and Back is entirely invisible. The fixed mobile header also overlaps the dialog title.

Recommendation: Use a modal above navigation with a flex column layout: fixed header/footer and a flexing scrollable body. Ensure both footer actions fit inside the panel at mobile heights.

Pass 1: control-state-not-inspected. Pass 2: discovered. Review-only dialog opened and inspected at both widths; actual viewport capture and element geometry confirmed clipping. No submission.

[Pass 2 mobile viewport](p2-cart-review-viewport-mobile.png) · [Pass 2 mobile](p2-cart-review-mobile.png)

**BUY-080 · P2 · Review dialog repeats its purpose and summary**

Route: `/dispensary/cart`. Affected: desktop, mobile.

Review Order Request, its long confirmation subtitle, REVIEW MODE and Confirm before submitting repeat the same instruction. Four separate summary tiles stack before the actual product.

Recommendation: Use Review request as the sole heading; one compact line for item/grower count and a 2x2 detail grid or labeled rows.

Pass 1: control-state-not-inspected. Pass 2: discovered. Review-only dialog opened and inspected at both widths; actual viewport capture and element geometry confirmed clipping. No submission.

[Pass 2 desktop](p2-cart-review-desktop.png) · [Pass 2 mobile](p2-cart-review-mobile.png) · [Pass 2 mobile viewport](p2-cart-review-viewport-mobile.png)

**BUY-081 · P3 · Review edit links are small and recap repeats copy**

Route: `/dispensary/cart`. Affected: mobile.

Each Edit link is only 21px wide, and payment/estimated-value explanations repeat the draft screen.

Recommendation: Make each detail row itself an edit target, retain one final Total and a short Payment arranged with grower note.

Pass 1: control-state-not-inspected. Pass 2: discovered. Review-only dialog opened and inspected at both widths; actual viewport capture and element geometry confirmed clipping. No submission.

[Pass 2 mobile](p2-cart-review-mobile.png) · [Pass 2 mobile viewport](p2-cart-review-viewport-mobile.png)


### Grower shop

**BUY-082 · P3 · Shop anchor hides its destination heading**

Route: `/dispensary/grower/grower-001`. Affected: mobile.

The Message from a listing anchor lands with the All Products heading hidden behind the fixed mobile header.

Recommendation: Rename the action Browse products and offset the anchor so the section heading remains visible.

Pass 1: control-state-not-inspected. Pass 2: discovered. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 2 mobile](p2-shop-message-anchor-mobile.png)

**BUY-083 · P3 · Shop action button reaches beyond card padding**

Route: `/dispensary/grower/grower-001`. Affected: desktop.

Desktop product price and request controls exceed the padded card width. The Add button reaches x830 while the first priced card ends at x828, clipping its outer edge; the price/unit and button are cramped together.

Recommendation: Put price on its own row above quantity and Add to draft; preserve consistent padding instead of letting controls touch the card edge.

Pass 1: control-state-not-inspected. Pass 2: discovered. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

[Pass 2 desktop](p2-06-grower-shop-desktop.png)


### Saved favorites

**BUY-084 · P2 · Saved mobile view controls have no accessible names**

Route: `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`. Affected: mobile.

Mobile Grid and List controls are icon-only buttons with no accessible names in the rendered accessibility snapshot.

Recommendation: Add Grid view and List view accessible labels, matching the catalog controls.

Pass 1: control-state-not-inspected. Pass 2: discovered. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

[Pass 2 mobile](p2-08-favorites-alias-mobile.png)


### Saved price alerts

**BUY-085 · P2 · Mobile alert icons have no accessible names**

Route: `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`. Affected: mobile.

Mobile Clear all and Refresh prices are unlabeled icon buttons in the accessibility snapshot, including the destructive clear-all action.

Recommendation: Give them explicit accessible names; retain Refresh as compact visible text and move Clear all into a labeled overflow action.

Pass 1: control-state-not-inspected. Pass 2: discovered. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

[Pass 2 mobile](p2-09-price-alerts-alias-mobile.png)


### Alerts triggered empty state

**BUY-086 · P3 · Triggered-alert empty state repeats instructions**

Route: `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`. Affected: desktop, mobile.

The empty state repeats No Triggered Alerts with No products have dropped below your target prices yet, adds an enthusiastic instruction and a View Active Alerts button even though the Active tab is immediately above.

Recommendation: Use No price drops yet with one compact View active alerts link and less vertical padding.

Pass 1: control-state-not-inspected. Pass 2: discovered. Empty triggered tab inspected at both widths.

[Pass 2 desktop](p2-alerts-triggered-desktop.png) · [Pass 2 mobile](p2-alerts-triggered-mobile.png)


### Alerts history tab

**BUY-087 · P3 · Alert History lacks dates or events**

Route: `/dispensary/saved?tab=alerts`, `/dispensary/price-alerts`. Affected: desktop, mobile.

History presents the active target/current-price card without dates or events, so its label suggests information the screen does not show.

Recommendation: If this tab is the union of active and triggered alerts, label it All. Reserve History for dated price/alert events.

Pass 1: control-state-not-inspected. Pass 2: discovered. History tab inspected at both widths; it displays the same active alert card in this fixture.

[Pass 2 desktop](p2-alerts-history-desktop.png) · [Pass 2 mobile](p2-alerts-history-mobile.png)


### Saved favorites list view

**BUY-088 · P1 · Saved mobile list view overlaps product text**

Route: `/dispensary/saved`, `/dispensary/saved?tab=favorites`, `/dispensary/favorites`. Affected: mobile.

At 390px the list row compresses the product-name column to 60px, while price copy and request/message controls overlay the product title and grower text. Multiple text layers collide inside the card.

Recommendation: Give the product identity a full-width row on mobile, with a small thumbnail beside it; place price and actions in separate rows below. Do not preserve the desktop multi-column row at this width.

Pass 1: control-state-not-inspected. Pass 2: discovered. List mode inspected at both widths. Desktop compact row works; mobile visibly overlaps.

[Pass 2 mobile](p2-saved-list-mobile.png)


### Messages drawer list

**BUY-089 · P3 · Empty message pane repeats its instruction**

Route: `/dispensary/*`. Affected: desktop.

Desktop repeats Select a conversation in the pane heading, empty-state card, and composer placeholder while exposing pricing controls before a conversation is selected.

Recommendation: Use one centered Choose a conversation prompt; reveal the composer and relevant pricing actions after selection.

Pass 1: control-state-not-inspected. Pass 2: discovered. Drawer list inspected at both widths; existing conversations were not opened because that marks messages read.

[Pass 2 desktop](p2-shared-messages-list-desktop.png)

**BUY-090 · P3 · Message footer repeats role and payment guidance**

Route: `/dispensary/*`. Affected: desktop.

The permanent desktop footer explains You are messaging as Dispensary and Quotes set terms only; wholesale payment is handled directly in small text, adding role and settlement copy to every conversation.

Recommendation: Keep necessary settlement guidance beside a quote action or its confirmation, and remove the redundant role sentence.

Pass 1: control-state-not-inspected. Pass 2: discovered. Drawer list inspected at both widths; existing conversations were not opened because that marks messages read.

[Pass 2 desktop](p2-shared-messages-list-desktop.png)


### Recent activity drawer

**BUY-091 · P3 · Recent activity uses route-like page names**

Route: `/dispensary/*`. Affected: desktop.

The recently used list names the visited shop Grower 001 instead of Vermont Nurseries, and prefixes familiar account pages with Dispensary.

Recommendation: Use the business name for shop visits and the same short Dashboard, Settings, and Saved labels as navigation.

Pass 1: control-state-not-inspected. Pass 2: discovered. Desktop drawer inspected; this control is not present at the mobile breakpoint.

[Pass 2 desktop](p2-shared-activity-desktop.png)


### Catalog list view

**BUY-092 · P1 · Catalog mobile list hides prices and Add buttons**

Route: `/dispensary/catalog`. Affected: mobile.

At 390px catalog List view keeps a desktop horizontal row: product-name columns shrink to 57–91px, pricing/message controls overlap text, prices disappear off the right edge, and Add buttons sit at x400–440 outside the 390px viewport. The document still reports 390px width because overflow is clipped internally.

Recommendation: Switch list rows to a mobile stack with a compact thumbnail beside full-width identity, then price/availability and full-width actions below. Assert that each price and action fits within the visible card.

Pass 1: control-state-not-inspected. Pass 2: discovered. Fresh alternate layout inspected in both sizes; desktop readable, mobile severely clipped.

[Pass 2 mobile](p2-catalog-list-mobile.png)


## Screens without an additional finding

- **Favorites redirect:** Correct destination and tab in both fresh passes at both widths. Destination design findings are tracked under Saved favorites.
- **Price alerts redirect:** Correct destination and tab in both fresh passes at both widths. Destination design findings are tracked under Saved price alerts.
- **Grower shop mobile filters:** Compact options fit; no additional finding beyond surrounding page density.
- **Settings at 360px:** No new reflow issue; 16px fields fit the viewport.
- **Saved recent product row:** Compact desktop and mobile row fits price/actions; surrounding copy finding remains.
- **Messages mobile conversation list:** No new mobile layout issue; desktop idle-pane copy findings remain.

## Review limits

- Local review only at http://localhost:3144 using a temporary cloned database (phenofarm_ui_review_20260917); original database and production were not reviewed or changed.
- No app source edits, order submissions, message sends, account changes, uploads, favorite mutations, alert saves/deletes/refreshes, sign-out, or notification read actions were performed.
- Opening an existing message thread sends a read acknowledgement. Conversation detail and quote-action states were therefore not opened under the read-only constraint; the conversation list and unsent listing-pricing composer were reviewed.
- Order detail used an existing submitted request. Withdraw/reorder/request-update confirmations and post-submit outcomes were not activated. Active, accepted and cancelled states were visible in the order list; other detailed order states were not fabricated.
- Price alerts contained one active alert and no triggered event. The empty Triggered and populated History tabs were inspected, but historical triggered events were not fabricated.
- Browser-local cart and comparison state was temporarily staged for filled draft/review/comparison inspection, then cleared. Navigation history and view selection changed only in the dedicated browser session.
- Desktop viewport was 1440×1000; standard mobile viewport 390×844, with an additional 360×844 Settings check. These are responsive Chrome checks, not physical-device or virtual-keyboard tests.
- Two full fresh route passes are complete. Shared dialogs and alternate control states were additional pass-two checks; their findings explicitly say when the state was not inspected in pass one.
- Development-only Next.js tools/badge are excluded from product findings. A partly covered Add label was traced to the development badge and not reported as a production visibility defect.
- METRC is outside this audit scope.

## Useful patterns to retain

- Dashboard two-column mobile statistics are compact and readable; Orders can use the same pattern.
- Desktop order table and Saved Recent rows use available width well.
- Settings fields remain readable at 390px and 360px with 16px input text.
- Mobile shop filters, main navigation targets and Messages list fit their viewports.
- Hidden-price products retain a pricing-request path without revealing a numeric price.
- Ordinary page captures had no document-width overflow; several important failures occur inside clipped cards or modal layers, so page overflow alone is insufficient verification.
