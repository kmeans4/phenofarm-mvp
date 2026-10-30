# PhenoShop chart review — October 29, 2026

Status: implementation complete and locally verified. The production release receipt is saved locally after publication.

## Reference and selection

Reviewed all 62 public previews in [Mebius Charts](https://www.mebius.design/freebies/charts). Component downloads require a Mebius account. This work adapts the public design patterns to PhenoShop's existing components and real order data; no source download or additional chart package is needed.

1. **Grower overview:** use the restrained area fill and exact-point inspection of Total Expenses / Cash Flow Area. The question is when delivered order value changed; offer the available 7-day and 30-day windows.
2. **Buyer overview:** use the Total Value / Net Worth column pattern to compare individual days. Preserve the meaning of non-cancelled request/order value, with no implication that PhenoShop collected payments.
3. **Grower reports:** use Total Revenue monthly columns with visible scales, exact values, and empty months represented as zero. Use Income Overview's horizontal comparison pattern within the existing top-product and top-customer lists.

The existing order-status breakdown already makes the next action clear. Forecasts, investment/cash-balance displays, profit margins, targets, radial charts, and geographical charts have no supporting app data or useful task here.

## Before-state findings

- The grower trend is static: an individual day requires opening the value table.
- The report chart omits months with no deliveries and can round $2,400 to $2k on its label.
- The buyer chart has cramped mobile date/value labels, rounds cents away, and groups dates in the server's time zone.
- Rankings show precise values but make relative size hard to compare. Product quantities are labeled generically as units even when sold by weight.

## QA inventory

- Desktop 1440px, tablet 834px, and mobile 390px: readable labels, selected-value panel, zero baseline, no overflow, and touch-size controls.
- Mouse hover/click, keyboard arrows/Home/End, touch selection, previous/next controls, and period changes select the correct real value.
- Expanded data tables agree with plotted points and report exports; currencies retain cents and labels retain their date/year.
- Empty, all-zero, single-point, sparse months, long labels, and large values remain understandable.
- Delivered data excludes pending/cancelled requests and uses delivery dates; buyer values exclude cancellation and use request dates in America/New_York, including midnight/DST boundaries.
- Range navigation, product/customer expansion controls, and CSV/PDF export continue to work.
- Targeted regressions and aggregate verification passed; final rendered charts were reviewed after the single-month alignment fix.

## Implemented behavior

- The grower overview supports 7- and 30-day views without fetching again. Hover, tap, arrow keys, Home/End, and previous/next buttons select an exact day.
- The buyer overview keeps non-canceled request/order value, uses Eastern calendar days, and bounds the database query to the displayed week. It includes pending requests and does not imply payment collection.
- Monthly reports include every month in the chosen date range, including partial first/last months. All-time begins with the first delivery. Extremely broad ranges over 600 months explicitly switch to “Months with deliveries” to avoid constructing thousands of empty buckets.
- Charts have a zero baseline, exact cents in the selected value and accessible table, clear empty states, and no invented minimum bar height for zero values.
- Ranking bars compare against the highest value in their own list. Products use delivered line-item value and their actual unit (lb, g, unit, etc.); customers use delivered order totals. No percentage-of-total claim is made across these different bases.
- The existing order-status breakdown stays in place. No new package, database schema, payment integration, forecast, or production data change is required.

## Verification results

| Check | Result |
| --- | --- |
| New chart regression suite | 7 passed |
| Existing buyer workflow suite | 9 passed |
| Existing grower workflow suite | 13 passed |
| Final responsive/single-month visual rerun | 4 passed |
| `npm run verify` | Passed: env documentation, ESLint, Prisma generation, production build and TypeScript |
| Final test-file lint / `git diff --check` | Passed |
| Browser runtime/hydration errors in chart regressions | None |
| Rendered review | Desktop 1440px, tablet 834px, mobile 390px; mouse, keyboard and touch selection |

Tests used the isolated local `phenofarm_auth_ux_audit_20261029` database and local app on port 3186. New regression fixtures were removed after each run; the existing review/seed data was preserved. No production business data was written. The original checkout's 71 unrelated dirty entries were preserved.

Coverage includes Eastern midnight and both DST transitions, excluded cancellations and future requests, delivered-date attribution, 7/30-day totals, missing months/year rollover, exact currency, empty and all-zero data, a single month, a seven-figure value, long product/customer labels, ranking expansion, and complete CSV/PDF exports. The CSV/PDF remain order-level exports: their delivered total agrees with the monthly chart, and product units remain present.

The local production build used `AUTH_REQUIRE_EMAIL_VERIFICATION=false` for that process because the local-test mail adapter deliberately refuses production mode. Production email/auth configuration was not changed. Authenticated workflow verification was local; production release verification covers deployment identity, canonical alias, and public/authentication responses.

## Selected rendered evidence

- [Grower overview on mobile](evidence/grower-mobile.png)
- [Buyer overview on mobile](evidence/buyer-mobile.png)
- [Monthly report on desktop](evidence/reports-desktop.png)

Raw reference previews, full responsive captures, and local release receipts are excluded from Git/deployment packaging. The reference's account-gated source code was not downloaded; these components are original implementations using the existing app stack and color system.
