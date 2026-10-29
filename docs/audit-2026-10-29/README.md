# PhenoShop workflow and responsive audit — October 29, 2026

Local review and verification are complete. Publication and live release verification are recorded below when complete.

## Scope and coverage

The review covered the public website, account recovery, grower portal, dispensary portal, shared messaging, and admin portal. Every mapped page and overlay was opened in the user-approved isolated Chromium browser, with scrolling, screenshots, label checks, and checks for content extending outside the viewport. Relevant workflows were exercised against a separate local database.

- **64 page routes**, including redirects, mapped in [route-inventory.json](route-inventory.json).
- **231 page/state checks**: 77 at each primary width, including populated, empty, missing-record, and error states.
- **98 overlay checks**: dialogs, drawers, menus, confirmations, and Undo states.
- **39 affected-page rechecks**, plus eight final decline/cancel validation states and focused checks at 320, 640, and 768 pixels.
- **119 distinct workflow/regression tests passed across completed targeted runs.** This is not a claim that every historical test file was run or that one run contained all 119 tests.
- Primary sizes: desktop 1440 × 1000, tablet 834 × 1000, mobile 390 × 844. Some focused regression captures use a 1000-pixel height.
- The app currently has one dark visual theme; there is no alternate in-app theme to test.

See the [page-by-page and overlay matrix](coverage.md) and [machine-readable coverage](coverage.json). All page and overlay screenshots were visually reviewed. Full captures and contact sheets remain in this local audit directory; representative evidence is committed under `evidence/`.

## Findings fixed and reviewed

| Finding | Change | Verification |
|---|---|---|
| Buyers could not review a cart at tablet widths: the desktop summary and mobile review bar were both hidden between breakpoints. | Show the cart summary from 640 pixels upward, with the compact review bar below that. | Review dialog and enabled send control tested at 1440, 834, 768, 640, and 390 pixels; [tablet evidence](evidence/popup-buyer-review-request-834.jpg). |
| Product Actions could open underneath the mobile navigation. | Reuse the bounded, accessible dialog; all actions remain one opening click plus one action click. | Three widths, keyboard dismissal/focus restoration, and real product operations; [before](evidence/product-actions-mobile.png), [after](evidence/popup-grower-product-actions-390.jpg). |
| New-batch labels and validation could target fields in the underlying product form. | Give every embedded batch field and error a separate ID. | Label ownership, date editing, and validation focus tested at three widths; existing upload/batch workflows passed. |
| Leaving an unsaved form initially focused the destructive choice. | Focus Keep editing for destructive confirmations; preserve the separate accepted-quote replacement behavior. | Enter preserves the form, Escape restores focus, and quote replacement still works; [before](evidence/discard-focus-before-mobile.png), [after](evidence/popup-grower-discard-390.jpg). |
| Dialog titles could overflow and short screens could hide confirmation buttons. | Wrap long titles, allow confirmation scrolling, and give shared modal close buttons a 44-pixel target. | Three widths, long names, and a 240-pixel viewport-height check. |
| Order-history search was squeezed beside the date inputs. | Put search on its own row on smaller screens and size date fields to their columns. | Search/date bounds and rendered review at three widths; [mobile evidence](evidence/recheck-grower-grower-orders-history-390-fold.jpg). |
| Long order identifiers/customer names squeezed mobile order cards. | Give the title its own row, with the amount and action below it. Wrap page headings. | Long-identifier fixture at three widths and all normal order pages rechecked. |
| Long product names could cover catalog filter controls or extend beyond mobile order details. | Wrap suggestion labels and order-line product names within their containers. | Long unbroken-name fixtures, actual filter clicks, and page-width checks; [catalog evidence](evidence/catalog-long-name-390.png). |
| Saved filters omitted Favorites and the preview did not show several active selections. | Persist Favorites in the existing saved-filter JSON and reuse all active filter chips in the preview; explain the empty state. Older presets default Favorites to off. | Save, reload, reapply, and verify Favorites, stock, lab results, and price unit at three widths; [evidence](evidence/saved-selections-390.png). |
| Admin search was unavailable in the mobile header. | Add the existing search control and fit the header at narrow widths. | Search opened/dismissed at 320 pixels; all primary admin widths reviewed; [evidence](evidence/admin-320.png). |
| Marketplace-preview search was cramped on mobile. | Let the input occupy its available row. | Three-width layout and search checks. |
| Product preview displayed internal strain-type values. | Use the existing human-readable strain labels. | Product previews rechecked at all primary widths. |
| Pending-request withdrawal and the landing demonstration used inconsistent status wording. | Use Withdraw request before acceptance and On the way for the shipping step. | Buyer confirmation reviewed at three widths and public workflows passed; [evidence](evidence/popup-buyer-withdraw-request-390.jpg). |
| Decline/cancel errors remained after correction or closing the form, and did not focus the missing field. | Clear stale errors, focus the missing reason/note, use Keep request for pending requests, and wrap actions on narrow screens. | Missing reason, Other without a note, correction, closing, unchanged status, and layout tested at 1440, 834, 390, and 320 pixels; [evidence](evidence/inline-fixed-CONFIRMED-390.png). |
| Webpack could include Node-only monitoring imports in the Edge bundle. | Put those imports inside an explicit Node runtime branch. | Webpack development startup and HTTP 200, followed by the production build. |

Temporary local audit helpers are excluded from lint, and audit artifacts are excluded from the Vercel upload. Application source remains covered by the normal checks.

## Workflow validation

| Suite | Passed | Main coverage |
|---|---:|---|
| `ux-grower-20260929` | 13 | Customers, product work, manual orders, status actions/Undo, reports, settings, responsive pages |
| `ux-audit-buyer-20260929` | 9 | Catalog search/filters, product details, cart edits/recovery, licenses, request submission/retry, alerts, responsive pages |
| `ux-products-audit` | 10 | Quick/full listing, drafts, uploads/lab results, batches, imports, bulk stock/actions |
| `ux-public-followup-20260929` | 5 | Public navigation and account-entry flows |
| `ux-shared-20260929` | 11 | Messaging, quotes, cart replacement, admin decisions/access, notifications, recovery/security boundaries |
| `account-recovery` | 20 | Signup/verification, reset, email change, expired/replayed links, rate limits, cross-browser and three-width interactions |
| `order-acceptance-inventory` | 19 | Competing requests, concurrent acceptance, insufficient stock, retries, cancellation/Undo, negotiated quantities, multi-item rollback, legacy orders/cutover |
| `buyer-lab-downloads` | 5 | Authorized lab downloads and failure/security cases |
| `ux-retained-form-focus` | 4 | Correct labels/focus with retained Next.js pages and embedded forms |
| `review-admin-and-product-apis` | 2 | Product/batch API behavior, admin pagination/access, verification and disabled seed route |
| `full-audit-20261029` | 21 | New findings above, cart breakpoints, saved-filter persistence, inline strain creation, and confirmation corrections |
| **Total** | **119** | Completed targeted runs; repeated checks counted once |

`npm run verify` passed environment-documentation validation, ESLint, Prisma generation, TypeScript checking, and the Next.js production build. The local build used `AUTH_REQUIRE_EMAIL_VERIFICATION=false` only because the deliberately isolated test-mail adapter refuses production-mode use. The workflow tests ran with verification enabled and the local mail sink. Production account settings are unchanged.

The Webpack fallback check returned HTTP 200. A Node `module.register()` deprecation warning remains non-blocking. Earlier failures caused by outdated fixture expectations and temporary helper linting were corrected; interrupted runs and failed earlier attempts are not counted as successful checks.

## Isolation and remaining boundaries

- Work started from GitHub main `b2cb271` in `codex/full-audit-20261029`.
- The original checkout has unrelated unfinished launch, billing, and email edits. They were preserved and excluded from this release.
- Local app: `127.0.0.1:3186`; local database: `phenofarm_auth_ux_audit_20261029`; local mail sink: port 3187.
- Production seeds, user accounts, inventory, orders, and database schema were not changed by the audit. No migration is required by these fixes.
- The historical migration chain cannot bootstrap an empty database because its first migration assumes existing tables. The isolated audit database was initialized from the current Prisma schema plus the required `pg_trgm` extension. This does not validate replaying that historical migration chain from an empty database.
- No real subscription purchase, external payment settlement, production email delivery, or physical-device Safari test was performed. Vercel's current production environment has no payment-processor keys; processor approval/integration remains a separate launch dependency.
- Authenticated grower, buyer, and admin mutation workflows were tested locally. Existing production test-account passwords were unavailable, so the live release check will cover public/account-entry rendering, redirects, and deployment identity rather than claim signed-in production mutation coverage.

## Release record

Pending publication and live smoke checks.
