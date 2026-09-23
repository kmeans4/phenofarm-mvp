# Emerald UI design QA — September 23, 2026

## Reference and evidence

- Source visual truth: [selected Option 1](docs/design/emerald-ui/selected-overview.png).
- Rendered implementation: [desktop overview](docs/design/emerald-ui/overview-desktop.png), authenticated grower at `http://localhost:3144/grower/dashboard` with disposable review data.
- Source and implementation are both 1487 × 1058 pixels. Browser viewport: 1487 × 1058 CSS pixels, captured at 1×. No device frame or browser chrome; no density rescaling in the comparison.
- [Combined full-view comparison](docs/design/emerald-ui/overview-comparison.png) places the two images side by side with a 32-pixel evidence label strip.
- [Combined detail comparison](docs/design/emerald-ui/overview-detail-comparison.png) uses native-resolution crops to inspect typography, surfaces, dividers, and metric spacing.
- Additional widths: all 56 page/view entries at 360 × 800 and 1440 × 1000; overview at 320 × 740 and 768 × 1024. [Route checks](docs/design/emerald-ui/route-checks.json).
- [Mobile overview](docs/design/emerald-ui/overview-mobile.png), [tablet overview](docs/design/emerald-ui/overview-tablet.png), [grower pages](docs/design/emerald-ui/grower-mobile.png), [buyer pages](docs/design/emerald-ui/buyer-mobile.png), [account pages](docs/design/emerald-ui/accounts-mobile.png), [overlay examples](docs/design/emerald-ui/overlays-mobile.png).

The reference is a generated design direction rather than a production data specification. The implementation uses current account data, real statuses, the correct date and rolling 30-day range, and actual daily values. It preserves all existing navigation destinations. The reference's product photos, example values, fabricated growth percentage, and extra status labels are not copied into live business data. Accounts without product photos retain the application's existing image fallback; uploaded images still use the existing ProductImage pipeline.

## Findings and comparison history

Pass 1 established the dark canvas, emerald actions, sans-serif hierarchy, slim borders, integrated metric strip, request/inventory grid, value chart, and activity panel. The source was visually compared with the first rendered overview, then the same system was applied page by page.

The following P2 findings were fixed during the rendered and independent review passes:

| Finding | Fix | Post-fix evidence |
| --- | --- | --- |
| White dividers in search and subscription details were too bright against the new surfaces. | Explicit semantic border and divider colors, including quote controls. | [Search](docs/design/emerald-ui/search-mobile.png), [expanded settings](docs/design/emerald-ui/settings-expanded-mobile.png) |
| Outgoing quotes and an enabled availability toggle had weak foreground contrast. | Dark quote surfaces with readable text; dark toggle thumb on the emerald track. | [Quote composer](docs/design/emerald-ui/quote-mobile.png), product-detail mobile checks |
| Modal width overrides could lose to the default width class. | Resolve conflicting utility classes through the shared `cn` helper. | Product actions, import, request review, and comparison in [overlay sheet](docs/design/emerald-ui/overlays-mobile.png) |
| The buyer's setup panel pushed recent requests below the main mobile view. | Move setup below recent requests and collapse completed/setup detail. | [Buyer pages](docs/design/emerald-ui/buyer-mobile.png) |
| Neutral/cancelled badges and some message buttons retained unusually bright legacy colors. | Use dark semantic badge tones and consistent emerald primary actions. | Buyer request views and [quote composer](docs/design/emerald-ui/quote-mobile.png) |
| Mobile admin emails competed with role badges and wrapped unnecessarily. | Give the email the full row; align role with the joined date. | [Admin user rows](docs/design/emerald-ui/admin-users-mobile.png) |
| At 768px, the desktop search field squeezed the account name. | Use a search icon below 1024px while keeping the same shared dialog. | [Tablet overview](docs/design/emerald-ui/overview-tablet.png); search opened and verified at that width |
| Browser-draft notices and a few navigation labels were unnecessarily long or inconsistent. | Shorten draft status and use Overview consistently in navigation/history. | Settings, draft, request-edit, and recent-activity checks |

Pass 2 revisited the changed states after fixes, including the source comparison at its original viewport, desktop/mobile route captures, expanded panels, dialogs, tablet search, and narrow-screen overflow. No actionable P0/P1/P2 visual findings remain in the reviewed scope. An independent final diff review found no additional concrete regressions.

## Required fidelity surfaces

- **Fonts and typography:** Hanken Grotesk, already used by the landing page, now carries portal headings and body UI. The former editorial serif override was removed. Compact mobile headings, metadata, wrapping, and input sizing were checked; mobile inputs stay 16px to avoid focus zoom. The implementation intentionally uses denser operational text than some generated mock labels.
- **Spacing and layout:** The overview preserves the source's sidebar/topbar, three-part metric strip, asymmetric request/inventory grid, and chart/activity arrangement. It stacks on smaller screens. Existing operational forms, lists, sticky actions, filters, and disclosures use compact spacing. No horizontal page overflow was observed in the 112 page/view captures or the additional 320px/768px overview checks.
- **Colors and tokens:** Shared `pf-*` colors provide a near-black green canvas, layered green surfaces, pale text, fine borders, and emerald actions. Amber, red, blue, and purple remain semantic state accents. Portaled overlays use the same tokens directly. Destructive actions remain clearly distinct. Print-only styles keep a light paper background and dark text.
- **Image quality and assets:** The existing PhenoFarm brand treatment and Lucide icons remain crisp. User-uploaded logo/product/document functionality is preserved. Empty image slots show the existing app fallback; mock photos are illustrative and are not inserted as customer inventory. No generated screenshot is used as an app surface.
- **Copy and content:** Overview values come from account-scoped aggregates and bounded lists. Date ranges, counts, links, and statuses were verified. Repeated explanations and oversized setup content were reduced without removing required licensing, direct-settlement, or provider-state information.

## Interaction and verification evidence

- Primary route coverage is recorded in [coverage.md](docs/design/emerald-ui/coverage.md).
- Opened and reviewed: mobile navigation; populated search; notifications; product display/action menus; CSV import; quick add; inline strain creation; batch creation; optional product details/photos; destructive confirmations; mobile catalog filters; save-filter and target-price dialogs; expanded comparison quantities/chart; request-review dialog; pricing-message dialog; populated chat and quote composer; recent-activity drawer; overview request tabs/daily values/messages/setup; plan features; admin policies, completed checks, developer disclosure, and account-verification confirmation.
- Destructive confirmations, business requests, quotes, and external messages were not submitted during visual checks. Existing regression suites exercise relevant mutations using disposable fixtures.
- Existing regression suites: 50 passed across grower review, buyer remediation, checkpoint UI, and notification context.
- New overview/product-action regressions: 5 passed, including account isolation, all active statuses, date exclusions, stock boundaries, links, modal viewport fit, keyboard wrapping, and focus return.
- Admin/product API regressions: 2 passed, including admin access, pagination, mobile navigation, and verification redirects.
- Final focused rerun after polish: overview/product-action, checkpoint, and admin/product suites passed.
- Final `npm run verify` passed: environment documentation, lint, Prisma generation, TypeScript validation through the production build, and Next.js build. `git diff --check` passed.
- Browser console check at the final overview reported no errors. The development browser's native unsaved-navigation warning interrupted one tab; review continued in a fresh tab with direct browser controls. This was a tooling interruption, not evidence of an app regression.

## Boundaries

Validation used the isolated local database `phenofarm_ui_fixes_emerald_20260923`. The migration history lacks a fresh-database baseline, so this newly created disposable database used the current Prisma schema. This UI task makes no schema or migration changes. No email-delivery, signup, billing, METRC, or production-provider settings were activated or changed. Native OS/browser pickers and third-party hosted provider interfaces are outside the app's CSS control.

## Implementation checklist

- [x] Shared theme and shell
- [x] Grower overview first
- [x] Remaining grower pages and forms
- [x] Buyer pages and shopping/request states
- [x] Admin and account pages
- [x] Shared overlays, collapsed and expanded elements
- [x] Public-page regression review
- [x] Desktop/mobile, tablet, and narrow-screen checks
- [x] Source comparison and final independent review
- [x] Build and focused workflow validation

final result: passed
