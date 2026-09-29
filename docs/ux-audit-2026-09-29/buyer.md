# Buyer UX audit implementation — September 29, 2026

Scope: B1–B11, BC1–BC19, BK1–BK12, BO1–BO11, buyer cleanup in section 4, and buyer applications of shared X standards. The source audit is `source-audit.md` beside this file. Changes are local source changes; no production deployment or database migration is claimed by this ledger.

The user’s explicit instruction to support businesses outside Vermont overrides B7’s suggestion to make Vermont the sole state. License fields accept US states consistently, and expiration is optional in both buyer entry points.

## License, onboarding and settings

| ID | Implemented behavior | Evidence |
|---|---|---|
| B1 | Definitive `LICENSE_NOT_VERIFIED` / `LICENSE_EXPIRED` responses clear the persisted submission lock, preserve unsent cart lines, and link to license status. Already-created split orders are removed from the cart when returned with that response. | Isolated browser test seeds an uncertain submission, receives a real 403, and verifies the retry screen and storage entry disappear while the cart remains. Checkout keeps its existing idempotency/stock transaction. |
| B2 | License status appears before ordering in the catalog, grower shop and cart; review repeats the reason and disables Send. | Pending-buyer browser test checks the banner and disabled Send; mobile screenshot. |
| B3 | Submitted licenses show “Submitted — under review” on Overview and in settings. | `licenseSubmittedAt` server field, dashboard/status logic, rendered pending-account test. |
| B4 | Buyer license links target `#license-verification`. | Dashboard, expiry notice and license card source review. |
| B5 | License submission uses catch/finally, a connection error, and an enabled retry button. | Network-abort test followed by real save/readback. |
| B6 | Editing an approved license warns that saving pauses ordering until review. | Settings changed-license comparison; server re-review is owned by the root agent. |
| B7 | Both forms use the same available states and optional expiration. | Settings/card source review and successful submission without expiration. Nationwide support intentionally retained. |
| B8 | Setup completion reflects actual required business/license fields; links go to the relevant sections; the artificial Cart milestone is removed. | Dashboard source review; pending and approved fixtures. |
| B9 | Account-backed order defaults save fulfillment, payment timing, preferred window and notes; cart loads those defaults on every device. | Authenticated defaults API, database readback, cart prefill test. |
| B10 | Address remains typable; city/state/ZIP are always editable. Selected suggestions store street separately, preventing duplicate city/state text. | Settings mobile render; root owns the shared combobox semantics and failure feedback. |
| B11 | Escape no longer navigates away from settings. Cancel awaits the shared unsaved-changes dialog. | Settings event/guard review. |

## Catalog, product details and shop

| ID | Implemented behavior | Evidence |
|---|---|---|
| BC1 | Product image/title opens an accessible detail sheet with photos, description, lab results, grower terms, quantity and Add; `?product=ID` works directly. | Browser opens direct link, checks description/empty labs, adds quantity 3, closes sheet. Root global search uses the same contract. |
| BC2 | Search splits words, ANDs them across product/grower/type/strain fields, and uses `pg_trgm` word similarity. Empty state offers matching suggestions and newest alternatives. | Real SQL search `blu drem` finds Blue Dream; mobile zero-result recovery test. `pg_trgm` migration is owned by root. |
| BC3 | Quantity is a string while editing and may be blank. Invalid/over-stock quantities show a specific message and explicit Set to N correction. Decimal input is preserved and rejected as non-whole, never silently changed from 1.5 to 15. | Detail test clears/retypes quantity, rejects 1.5 without adding anything to the account cart, then successfully adds 3. Source review of cart and shared Add control. |
| BC4 | Add toast includes View cart and Undo; chosen quantity remains. | Browser checks Added 3 and retained quantity; undo applies a quantity delta to the current cart. |
| BC5 | Compact steppers are shared by list, compare, favorites and alerts. | Existing lab workflow visits catalog/shop/favorites grid/list and compare at desktop/mobile widths. |
| BC6 | Desktop filters open initially; filter, sort and view preferences persist per user. | Account-scoped preference storage and URL precedence reviewed; desktop/mobile renders. |
| BC7 | Default is relevance for a search and newest otherwise. | SQL ordering and rendered sort selector reviewed. |
| BC8 | Product suggestions open the sheet; grower suggestions open that shop. | `chooseSuggestion` contracts and direct sheet browser workflow. |
| BC9 | Search updates after a 300ms debounce. | Debounced query drives catalog requests; no Enter instruction remains. |
| BC10 | Mobile changes apply live and survive backdrop/Escape/swipe closure; footer gives the actual result count. | Mobile test filters from two products to one to zero, closes and reopens with Has lab results still selected. |
| BC11 | Added strain type, grower, stock, labs and price-unit filters. Price buckets adapt to pounds/ounces; ranges require one unit and aliases normalize. | Real API/filter browser tests; zero-lab matches and pound price bucket verified. |
| BC12 | A fourth compare selection is refused with a capacity explanation; existing selections stay. Compare summary reserves flow space and uses a sticky position. | Bounded list reducer review; mobile compare workflow and overflow assertion. |
| BC13 | Available labs have a heading, Open in new tab and separate Download. Detail sheet offers “No lab results / Ask grower” when absent. Legacy Full COA JSON references are supported. | Existing lab upload/download/security/legacy suite, plus detail empty state. No download button is shown for a missing file. |
| BC14 | Grower shop reuses catalog logic/actions and query parameters, including favorites, alerts, compare and detail. | Shop grid/list lab workflows and mobile screenshot; thumbnail fallback used for cart additions. |
| BC15 | Grower terms are open near the header; phone is a tel link; header has Message grower. | Shop source review and mobile render. |
| BC16 | Collection sync errors sit at the top with Retry; failed local edits remain cached for retry. | `useBuyerCollection` rehydrates and replays its pending delta; failures no longer masquerade as an empty favorites list. |
| BC17 | Removed unexplained card verification icon and repeated strain lines. Icons have labels; shared type scale improves metadata. | Catalog card/list review and screenshots. |
| BC18 | Favorite, alert, compare and chip/remove icon controls have accessible names. | Browser role/label-driven interactions and source review. |
| BC19 | Saved-filter and favorite removal controls remain visible without hover. | Catalog/favorites source review and tablet/mobile layouts. |

## Cart and checkout

| ID | Implemented behavior | Evidence |
|---|---|---|
| BK1 | Problem rows are highlighted with Sold out / Price on request / Only N available, Remove or Ask for price, and scroll-to-first-problem. | Quote-only browser fixture and pre-review validation; authoritative server validation remains. |
| BK2 | Remove actually removes the line; toast Undo restores it. Server quantity-error “Remove item” uses the same operation. | Browser removes quote-only line, undoes, and removes again before sending. |
| BK3 | Editable profile delivery address is included in each grower’s submitted notes snapshot and order details. | Real checkout DB notes readback and buyer detail; grower agent renders the same parsed address. |
| BK4 | Cart groups lines by grower with subtotal, terms and minimum shortfall. Smaller orders can still be negotiated. | Cart group source review and rendered checkout. Minimum is a warning, not an invented checkout restriction. |
| BK5 | Each grower’s payment timing is the default. An alternate buyer default is flagged only when deliberately chosen and different. | Net 15 grower / Net 30 buyer fixture submits Net 15 and readback confirms it. |
| BK6 | Success lists created order numbers/links and stays on the page. Unsent split-order products remain in the cart. | Browser waits beyond 5 seconds, checks route and created order count. |
| BK7 | Mobile review bar shows item count and formatted total with shared safe-area handling. | Mobile cart screenshot and no-page-overflow check. |
| BK8 | Refresh says exactly which price/stock changed and highlights affected lines; desired quantity is never silently reduced. | Revalidation implementation review; stock failure remains recoverable. |
| BK9 | Payment timing choices come from grower terms plus the buyer’s saved timing preference; ACH/Check are not mixed into this choice. Duplicate Flexible fulfillment option removed. | Cart/default normalization and review source review. |
| BK10 | Authenticated account cart persists in the database; local caches are keyed by account. Writes send changed/removed deltas under a database row lock. Offline pending changes survive reload and can retry. | Fresh-browser quantity readback, offline/reload retry, cross-account isolation and concurrent-line PATCH test. Unowned legacy global cart is never loaded into another account. |
| BK11 | Product thumbnails resolve through the authorized thumbnail endpoint when no image is already cached; money and unit formatting use shared helpers. | Product/detail/reorder/cart render and screenshot; original quote metadata preserved. |
| BK12 | Minus is disabled at 1, quantities/labels wrap, and review uses the shared accessible modal close button. | Source review and 360/390px cart/catalog checks. |

## Orders, saved items and alerts

| ID | Implemented behavior | Evidence |
|---|---|---|
| BO1 | Reorder works on any past order from list/detail, Overview and Saved Recent; current stock is checked and omissions/reduced quantities are reported. | Real pending order detail Buy again test; shared current-product loader used throughout. |
| BO2 | Search debounces and status/sort apply immediately; server filters/sorts before pagination. | Order query and client controls review; mobile list render. |
| BO3 | Rows show first ordered product, quantity/unit and additional line count. | Shared OrdersTable source and rendered order list. |
| BO4 | Order progress is visible by default; history is open. | Browser asserts the Order progress region is visible. |
| BO5 | Order item names link to product detail and include Buy again. | Browser adds ordered line from detail. |
| BO6 | Saved Recent directly reorders the last quantity rather than re-searching. | Saved source review and mobile Recent screenshot. |
| BO7 | Alerts edit target in place, link to the product, and let any currently priced item be added. | Browser edits `$1,500`; persisted target is 1500. |
| BO8 | Price updates refresh affected alerts and create an account notification without waiting for a buyer visit. | Real grower product PUT and notification database count before buyer opens Saved. Product/bulk update hook owned by products agent. |
| BO9 | One alert list sorts price drops first; Dismiss clearly clears the current trigger. | Alert implementation and desktop/mobile screenshots. |
| BO10 | Unread indicator includes readable text; Saved counts refresh on collection events; favorite layout follows catalog preference. | Shared orders component, collection event and Saved refresh code review. |
| BO11 | Withdraw confirmation uses plain language; section is Order actions; order vocabulary is consistent. | Detail actions review and rendered detail. |

## Shared standards and removal pass

- X1/X14: actionable failure messages and retries; failed catalog/favorites loads are not “no products.” License status loading explains a temporarily disabled Send.
- X2–X6, X16, X22: buyer controls use raised/bordered shared tokens, readable text, 44px steppers, labeled fields, invalid/error associations and the global focus treatment. Root owns the global tokens and Button variants.
- X7–X9: buyer order UI uses Order/Send order, shared status vocabulary, full order identifiers and shared money/unit formatting. Data contracts retain legacy field names for compatibility.
- X10–X12: root owns buyer portal error/loading/not-found boundaries.
- X13/X23: shared list/order components, one visible page h1, h2 empty-state headings and shared modal/focus behavior. Shop embeds catalog without a second page h1.
- X15: cart/favorite/alert removals and clears act immediately with Undo; high-cost order withdrawal retains confirmation.
- X17/X18: blank-safe quantity strings; currency strings accepted for alert targets; full settings page no longer exits on Escape.
- X19/X20: root owns the toast placement/lifetime, header messages and floating-action removal; cart uses the updated safe-area action bar. Compare no longer uses a fixed overlay bar.
- X21: cart logistics/notes and settings silently autosave in the account-scoped local draft hook. Only a Restore draft/Discard draft offer appears, and successful completion clears the draft. Settings never silently replaces the saved profile with a local draft; reload/restore/discard is tested.
- X24: shared reduced-motion handling is root-owned.
- X25: deleted the unused buyer FilterSidebar; active desktop/mobile filters share the same definitions and WholesaleFilters.
- Section 4: removed cart step tabs, default-template/draft-status clutter, auto-redirect and repeated payment disclaimers. One payment coordination line remains in order review. Removed nested alert tabs and duplicated compare quantity controls.

## Validation and release boundary

The dedicated `tests/ux-audit-buyer-20260929.spec.ts` uses unique synthetic accounts and runs only on a localhost app/database with the `phenofarm_auth_` database prefix. It does not touch production. The root-managed wrapper points to app 3187, mail sink 3188 and isolated database `phenofarm_auth_ux_20260929`.

The final eight-test buyer run passed in 49.6 seconds (`buyer-final-only.log`). It covers real checkout and lost-response recovery, license rejection/retry, fuzzy search and filter recovery, quantity validation, account-backed cart persistence/offline recovery/concurrent writes, grower-triggered price alerts, settings defaults/drafts, mobile page layouts, and repeated desktop/mobile resizing. All five existing lab-download tests also passed in the earlier combined run (`buyer-test-final.log`); that run separately exposed a buyer-settings test selector error, which was corrected before the clean eight-test buyer rerun. The lab tests cover actual PDF bytes, inline viewing, missing files, legacy COAs, hidden products, hostile references and desktop/390px/320px catalog/shop/favorites/compare layouts.

Focused ESLint passed, and standalone TypeScript checking passed before the final copy/quantity regression and mobile-tab minimum-height adjustment. Integrated lint/build is root-owned. Screenshots are kept under `/tmp/phenoshop-ux-20260929/buyer-screens/`; Playwright output/logs are under the same task folder.

The responsive follow-up identified and fixed a real CSS interaction: the shared 44px touch-target rule collapsed the intended 64px bottom tab bar. The navigation container now has its own minimum height. Three repeated 1440→390 transitions verify one visible portal, one header at y=0–71, and a 64px navigation bar anchored at y=836–900. Geometry is recorded in `responsive-alerts-layout.json`. The earlier duplicate-header screenshot did not recur; immediate captures could contain an unpainted tab layer, while captures after two animation frames were correct. The sidebar role label is Dispensary. A focused console/hydration check is recorded separately below.

The dev Issue badge on a direct product link was a real hydration bug in shared Modal: its server render omitted the portal, but the first client render included it. Modal now uses a server-stable readiness snapshot and activates focus trapping/body locking only when the portal can mount. The new browser-error check visits nine buyer page states and a directly linked product sheet. It and the representative catalog/filter/add-to-cart/modal workflow both passed after the fix (2 tests, 9.7 seconds; `buyer-console.log`). `buyer-browser-errors.json` records empty page-error and console-warning/error arrays. Focused lint for Modal, MobileTabs and the new regression also passed. Root will repeat its shared/admin modal coverage during integration.

This ledger does not claim each low-risk copy change has a separate automated test. Implementations were reviewed in code, with browser/database evidence for the risk-bearing flows and affected mobile page layouts. Root owns integrated verification, migration rollout, Git publication and any later deployment.
