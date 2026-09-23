# Buyer mobile review and fixes

18 findings fixed and visually verified across eight actual buyer pages. Favorites and price-alerts redirect to Saved tabs. METRC was excluded.

All pages were captured at360×800 before edits. Final full-page screenshots were inspected at360,390,430 and1440px. Critical filters and request review also fit360×640. Inputs remain16px on phones and compact controls retain40px touch targets.

Local verification used the isolated review database. The parent reported56 selected workflow tests passing, including six buyer layout regressions. Saved-filter writes in the new regression are intercepted. No order, message, profile, favorite or price-alert submission was made during visual checks. Browser-only task state was restored or removed.

Phone screenshots use Chromium emulation; physical-device keyboard behavior was not tested. Development-preview dialog evidence supplements the final compiled page and interaction checks.

## M-B01 — Stacked buyer headings consumed the first screen

**Status:** passed.

**Before:** Repeated introductory text and full-width catalog actions pushed useful information downward.

**Change:** Removed redundant introduction text, used compact inline actions on short headings, and kept the business-name dashboard heading readable.

**Routes:** /dispensary/dashboard, /dispensary/catalog, /dispensary/orders, /dispensary/saved

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Inspected all affected base pages at360/390/430/1440; compact headers and actions fit.

**Evidence:**
- Before: [dashboard-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/dashboard-360.png)
- Before: [catalog-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/catalog-360.png)
- Before: [orders-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/orders-360.png)
- Before: [saved-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/saved-360.png)
- After: [_dispensary_dashboard-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_dashboard-360.png)
- After: [_dispensary_catalog-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_catalog-360.png)
- After: [_dispensary_orders-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_orders-360.png)
- After: [_dispensary_saved-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_saved-360.png)

**Files:** `app/dispensary/dashboard/page.tsx`, `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/orders/page.tsx`, `app/dispensary/saved/SavedContent.tsx`

## M-B02 — Request cards repeated a separate date row

**Status:** passed.

**Before:** Each request used three rows and large outer gaps, reducing visible history.

**Change:** Placed abbreviated date with the request number, kept year visible, allowed long grower names to wrap, and tightened rows and Recent requests header.

**Routes:** /dispensary/dashboard, /dispensary/orders

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Inspected both request lists at four widths and filtered Cancelled status on360: one matching result.

**Evidence:**
- Before: [dashboard-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/dashboard-360.png)
- Before: [orders-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/orders-360.png)
- After: [_dispensary_dashboard-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_dashboard-360.png)
- After: [_dispensary_orders-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_orders-360.png)
- After: [orders-filtered-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/orders-filtered-360.png)

**Files:** `app/dispensary/components/OrdersTable.tsx`, `app/dispensary/dashboard/page.tsx`

## M-B03 — Catalog cards and quantity controls were too tall

**Status:** passed.

**Before:** Full-width product images and separate quantity/Add rows repeated vertically on every product.

**Change:** Used phone thumbnails beside identity, compact fact badges, and quantity/Add on one row. Kept 40px stepper targets and 16px numeric inputs; retained full accessible Add label.

**Routes:** /dispensary/catalog, /dispensary/grower/[id], /dispensary/saved

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Final catalog quantity increased, manually entered4, and Add produced7 from the existing3; cart manually edited back to3. Parent sixth-case layout suite passed; no quantity/Add clipping.

**Evidence:**
- Before: [catalog-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/catalog-360.png)
- Before: [shop-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/shop-360.png)
- After: [_dispensary_catalog-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_catalog-360.png)
- After: [_dispensary_grower__id_-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_grower__id_-360.png)
- After: [cart-filled-plain-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/cart-filled-plain-360.png)

**Files:** `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/AddToCartButton.tsx`, `app/dispensary/grower/[id]/GrowerShopContent.tsx`

## M-B04 — Catalog controls clipped labels and nested padding narrowed products

**Status:** passed.

**Before:** The default grouping label clipped in the phone select; grower sections nested large padding around narrow cards.

**Change:** Shortened sort labels, kept select text at 16px on phones, reduced mobile group/card inset, and shortened Shop action.

**Routes:** /dispensary/catalog

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Desktop comparison caught flex-child whitespace loss in View Shop; explicit responsive margin added and linted. Catalog filters open/apply/dismiss checked at360×640; sort/view controls and final four-width base pages inspected.

**Evidence:**
- Before: [catalog-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/catalog-360.png)
- Before: [catalog-list-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/catalog-list-360.png)
- After: [_dispensary_catalog-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_catalog-360.png)
- After: [catalog-filter-applied-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/catalog-filter-applied-360.png)

**Files:** `app/dispensary/catalog/CatalogContent.tsx`

## M-B05 — Comparison actions displaced the attributes being compared

**Status:** passed.

**Before:** Repeated product-action rows appeared before the attribute matrix and the unit warning used two lines with large padding.

**Change:** Moved full-width action rows after the attribute matrix, shortened the warning, and tightened matrix spacing while preserving scroll and separate accessible action rows.

**Routes:** /dispensary/catalog

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Three-product compare inspected at360×800; all eight attribute rows visible before actions; below-fold Add/message controls reachable; Escape dismissed.

**Evidence:**
- Before: [compare-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/compare-360-viewport.png)
- After: [compare-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/compare-360-viewport.png)
- After: [compare-actions-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/compare-actions-360-viewport.png)

**Files:** `app/dispensary/catalog/CatalogContent.tsx`

## M-B06 — Price-alert and saved-filter dialogs nested padding twice

**Status:** passed.

**Before:** The target-price dialog had large inner padding inside shared Modal padding, narrowing the input and adding empty vertical space. The saved-filter dialog used the same nested wrapper.

**Change:** Removed nested panel padding, compacted footer spacing, and clarified the price-check helper.

**Routes:** /dispensary/catalog

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Price-alert after-state inspected; Save Filter inspected at360×640 after a fresh draft Flower selection and at desktop then resized.

**Evidence:**
- Before: [price-alert-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/price-alert-360-viewport.png)
- After: [price-alert-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/price-alert-360-viewport.png)
- After: [save-filter-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/save-filter-360-viewport.png)
- After: [mobile-save-filter-360-short-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/mobile-save-filter-360-short-viewport.png)

**Files:** `app/dispensary/catalog/CatalogContent.tsx`

## M-B07 — Message templates wrapped into extra rows

**Status:** passed.

**Before:** A Templates heading and long chips used multiple lines before the message field.

**Change:** Used Pricing, Availability, and Intro labels in one wrapping row with 40px targets; retained full accessible template names and existing message text.

**Routes:** /dispensary/catalog

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Compact Pricing/Availability/Intro chips and composer inspected on360; no message submitted.

**Evidence:**
- Before: [catalog-message-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/catalog-message-360-viewport.png)
- After: [catalog-message-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/catalog-message-360-viewport.png)

**Files:** `app/dispensary/catalog/CatalogContent.tsx`

## M-B08 — Empty draft suggestions repeated category and pricing labels

**Status:** passed.

**Before:** Favorite/Recent pills and Quote only metadata repeated information around a clear Request pricing action; navigation buttons stacked.

**Change:** Simplified Suggested products, removed repeated pills, abbreviated units, shortened copy, and placed navigation actions together.

**Routes:** /dispensary/cart

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Empty cart suggested products and both navigation actions inspected at360/390/430/1440.

**Evidence:**
- Before: [cart-empty-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/cart-empty-360.png)
- After: [_dispensary_cart-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_cart-360.png)

**Files:** `app/dispensary/cart/page.tsx`

## M-B09 — Filled draft items used oversized image and separate spacious controls

**Status:** passed.

**Before:** 80px images and wide gaps inflated each item; small quantity targets were difficult on phones.

**Change:** Used 56px phone thumbnails, compact identity/unit text, and an aligned quantity/total/remove row with 40px targets and 16px input.

**Routes:** /dispensary/cart

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Final local cart plus/minus and typed quantity preserved the3×$25=$75 total; item and controls fit360.

**Evidence:**
- Before: [cart-filled-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/cart-filled-360.png)
- After: [cart-filled-plain-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/cart-filled-plain-360.png)

**Files:** `app/dispensary/cart/page.tsx`

## M-B10 — Draft forms and templates consumed unnecessary vertical space

**Status:** passed.

**Before:** Standard terms had a separate row, four note-template chips wrapped, long placeholder copy filled the textarea, and Review appeared twice on phones.

**Change:** Placed defaults under a Templates menu, used a note-template select, shortened field copy, tightened section spacing, and kept one mobile Review action with the desktop/tablet summary action intact.

**Routes:** /dispensary/cart

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Templates menu opened and standard terms applied locally; Pickup note template populated its textarea; section navigation and lower summary remained reachable.

**Evidence:**
- Before: [cart-filled-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/cart-filled-360.png)
- After: [cart-filled-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/cart-filled-360.png)
- After: [cart-note-template-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/cart-note-template-360-viewport.png)

**Files:** `app/dispensary/cart/page.tsx`

## M-B11 — Request review summary was unnecessarily tall

**Status:** passed.

**Before:** Four summary cells used large outer padding and long labels; stock-check notice added more height.

**Change:** Compacted cell insets, used Growers and Terms labels, and shortened notice spacing. Preserved 40px Edit targets and fixed footer.

**Routes:** /dispensary/cart

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Final360×640 Review shows both Back and Submit request entirely inside the viewport; returned with Back without submitting.

**Evidence:**
- Before: [cart-review-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/cart-review-360-viewport.png)
- After: [cart-review-360-short-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/cart-review-360-short-viewport.png)

**Files:** `app/dispensary/cart/page.tsx`

## M-B12 — Favorites sort and grid wasted scarce phone space

**Status:** passed.

**Before:** Recently Added was clipped and grid images took 160px before product details.

**Change:** Used Newest and short Price/THC sort labels, contained complete images in 80px phone panels, reduced mobile card inset, and kept 40px actions.

**Routes:** /dispensary/saved

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Grid/list, Price:high sort, More/Clear confirmation and dismiss, and Recent tab inspected on360; final base pages checked at four widths.

**Evidence:**
- Before: [saved-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/saved-360.png)
- Before: [saved-grid-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/saved-grid-360.png)
- After: [favorites-grid-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/favorites-grid-360.png)
- After: [favorites-sort-list-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/favorites-sort-list-360.png)
- After: [_dispensary_saved-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_saved-360.png)

**Files:** `app/dispensary/favorites/FavoritesContent.tsx`

## M-B13 — Price-alert image stood alone above the item

**Status:** passed.

**Before:** A separate image row made one active alert about 350px tall.

**Change:** Placed a 56px thumbnail beside product identity, retained paired Current/Target cards, and aligned alert actions at the edge.

**Routes:** /dispensary/saved?tab=alerts

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Alerts card and triggered-only empty state inspected on360; current/target values, target editor and More controls reachable.

**Evidence:**
- Before: [alerts-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/alerts-360.png)
- After: [alerts-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/alerts-360.png)
- After: [alerts-triggered-empty-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/alerts-triggered-empty-360.png)

**Files:** `app/dispensary/price-alerts/PriceAlertsContent.tsx`

## M-B14 — Grower shop repeated tall product presentation

**Status:** passed.

**Before:** Full-width image bands and stacked quantity controls made three products extend beyond 2200px; inline filter panel was spacious. With an active type filter, the phone sort dropdown narrowed and clipped long Price/THC direction labels.

**Change:** Used compact mobile product identity, shared inline quantity/Add controls, smaller filter inset with 40px chips, and a four-row message composer. Shortened Newest, Price, and THC sort labels while retaining their values and sort behavior.

**Routes:** /dispensary/grower/[id]

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Fresh stable-build active-filter view exposed sort-label clipping; five label-only changes applied and scoped ESLint passed. Final shop Flower filter returned2 products in list view; pricing composer opened and cancelled without submission. Final rebuilt360px active-filter/list view inspected: Price: high and both selected-filter chips display fully; all actions remain inside cards.

**Evidence:**
- Before: [shop-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/shop-360.png)
- Before: [shop-filters-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/shop-filters-360.png)
- Before: [shop-list-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/shop-list-360.png)
- Before: [shop-sort-active-clipping-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/shop-sort-active-clipping-360.png)
- After: [_dispensary_grower__id_-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_grower__id_-360.png)
- After: [shop-message-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/shop-message-360-viewport.png)
- After: [shop-filters-list-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/shop-filters-list-360.png)
- After: [shop-sort-filter-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/shop-sort-filter-360-viewport.png)

**Files:** `app/dispensary/grower/[id]/GrowerShopContent.tsx`

## M-B15 — Order details stacked facts and large gaps

**Status:** passed.

**Before:** Timeline/history and request-details blocks used extra space between sections; every request detail occupied its own row.

**Change:** Tightened section gaps, kept 40px timeline/history disclosure targets, reduced mobile totals inset, and used two columns for request details.

**Routes:** /dispensary/orders/[id]

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Timeline/history and withdraw-confirmation states inspected; final lower items,total,terms and buyer action controls visible at360.

**Evidence:**
- Before: [detail-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/detail-360.png)
- Before: [detail-expanded-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/detail-expanded-360.png)
- After: [_dispensary_orders__id_-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_orders__id_-360.png)
- After: [detail-expanded-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/detail-expanded-360.png)
- After: [withdraw-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/withdraw-360-viewport.png)
- After: [detail-lower-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/detail-lower-360-viewport.png)

**Files:** `app/dispensary/orders/[id]/page.tsx`

## M-B16 — Settings helper and account section repeated unnecessary space

**Status:** passed.

**Before:** Address helper wrapped with unnecessary details; Account label and Sign out stacked. Shared logo controls also needed mobile treatment.

**Change:** Shortened the address helper, normalized field labels, and aligned account controls. Root owns compact shared LogoUpload and header fixes.

**Routes:** /dispensary/settings

**Verification:** Scoped ESLint passed Reviewed task-only diff against pre-edit source copy Final description field focused without editing; lower logo controls, Account/Sign out and fixed Save button visible together at360.

**Evidence:**
- Before: [settings-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/settings-360.png)
- After: [_dispensary_settings-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/final-pages/_dispensary_settings-360.png)
- After: [settings-lower-360-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/settings-lower-360-viewport.png)

**Files:** `app/dispensary/settings/components/SettingsForm.tsx`

## M-B17 — Mobile filter trigger reported the wrong expanded state

**Status:** passed.

**Before:** The phone filter sheet was visible, but the trigger read expanded=false and retained inactive styling because it only tracked the desktop sidebar state.

**Change:** Both aria-expanded and active styling now reflect either open filter surface.

**Routes:** /dispensary/catalog

**Verification:** Fresh open-sheet snapshot confirmed trigger expanded=false Scoped ESLint passed after one-line state-expression correction Final open sheet trigger reports expanded=true, closed reportsfalse; desktop/phone transitions close hidden surface and release body scrolling.

**Evidence:**
- Before: [filter-expanded-mismatch-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/filter-expanded-mismatch-360.png)
- Before: [filter-expanded-mismatch-360.txt](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/filter-expanded-mismatch-360.txt)
- After: [filters-360-short-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/filters-360-short-viewport.png)
- After: [filters-360-short.txt](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/filters-360-short.txt)
- After: [saved-presets-360-short-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/saved-presets-360-short-viewport.png)
- After: [saved-presets-360-short.txt](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/saved-presets-360-short.txt)

**Files:** `app/dispensary/catalog/CatalogContent.tsx`

## M-B18 — Saved filter controls were missing from the mobile filter sheet

**Status:** passed.

**Before:** Save Current Filter and saved presets existed only in the desktop sidebar. Phone users could adjust filters but could not save, apply, or delete a saved preset. Crossing the desktop breakpoint also left the hidden filter surface marked open.

**Change:** Added saved presets with the existing apply/delete callbacks to a collapsible section, and paired Save filter with Apply filters in the fixed footer. Save uses current sheet selections before opening the existing name dialog. The hidden filter surface closes at the desktop breakpoint.

**Routes:** /dispensary/catalog

**Verification:** Targeted ESLint passed for both source files and added regression test Reviewed draft-state eligibility and exact existing collection callbacks Save Filter dialog inspected at desktop then resized to 360px before the mobile entry point was added Added intercepted collection regression: draft selection, persisted payload, existing preset apply/delete control reachability, and breakpoint cleanup without database writes Final360×640 presets and both footer actions visible; initial Save disabled, fresh draft Flower enables it and appears in name-dialog preview. Existing preset applies Flower, closes sheet, updates URL and sets expanded=false. Parent ran new intercepted endpoint regression successfully: saved payload includes draft Flower and preserves existing preset; no database write. Both resize directions remove hidden filter surface and body overflow returns visible.

**Evidence:**
- Before: [saved-filters-unavailable-360.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/saved-filters-unavailable-360.png)
- Before: [saved-filters-unavailable-360.txt](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/saved-filters-unavailable-360.txt)
- Before: [CatalogContent.tsx.txt](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/source/CatalogContent.tsx.txt)
- Before: [MobileFilterSheet.tsx.txt](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/before/source/MobileFilterSheet.tsx.txt)
- After: [saved-presets-360-short-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/saved-presets-360-short-viewport.png)
- After: [mobile-save-filter-360-short-viewport.png](/Users/sam/dev/phenofarm-mvp/docs/reviews/mobile-2026-09-17/buyer/after/mobile-save-filter-360-short-viewport.png)

**Files:** `app/dispensary/catalog/CatalogContent.tsx`, `app/dispensary/catalog/components/MobileFilterSheet.tsx`, `tests/buyer-ui-layout-regressions.spec.ts`

