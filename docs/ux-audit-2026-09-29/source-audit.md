---
cursor:
  subagentId: "bc-2c3b0c22-7575-58e6-be58-0c7c1ff8f429"
---

# PhenoShop UX and workflow audit — 2026-09-29

## 1. What was audited and how

**Code:** `origin/main` at `b9273dc` ("Refine marketplace workflows, copy, and typography", 2026-09-29). `origin/codex/project-checkpoint-2026-09-22` (`35ffbf9`) is fully merged into `main` (via PR #1), and `main` is 19 commits ahead, so `main` holds the newest app work.

**Method:** the audit combined a live click-through with a full code read.

- **Live run.** The app ran locally (`next dev`) against a throwaway local Postgres (`phenofarm_auth_audit` on `localhost`), built with `prisma db push`. It used the repo's local-only mail sink (`scripts/auth-test-mail-server.mjs`) so sign-up, verification and reset could be walked for real. Production env files were never present in the checkout, and no production database or URL was touched.
  - **Seed data:** admin; 2 verified growers (12 + 3 products, 5 strains, 4 batches); 1 verified dispensary; 1 dispensary with its license pending; 1 grower-managed off-platform customer; 8 orders across every status; 1 conversation with a pending offer; favorites, a price alert and notifications. Demo password: `password123`.
  - **Coverage:** a Playwright script (system Chrome) signed in as each role and loaded every route at desktop (1280×800) and phone (390×844) widths, capturing screenshots plus measurements (text under 14px, unlabeled fields, horizontal overflow, console errors).
  - **Flows driven:** sign-up → email link → verify → sign-in; wrong password; forgot password; catalog search, typo search, add to cart, cart, review and send; pending-license buyer send; grower quick add, CSV import, empty product submit, manual order, stock update; messages; admin dashboard Verify.
  - **Cleanup:** app code was not changed. `npm install` touched `package-lock.json` and `next-env.d.ts`, and both were restored. A git-ignored `.env.local` pointing at the local database was left in place.
- **Code read.** All roughly 34k lines of UI under `app/` (grower, dispensary, admin, auth, landing, shared components and hooks), plus the related `lib/*` and `app/api/**` routes where they shape what users see.
- **Tags.** Items marked **(seen live)** were confirmed in the running app. Everything else comes from the code.

**Screenshots** are in `/cursor/stores/bc-41e8661a-6eb3-468d-88e8-e45aa044f341/media/ux-audit/` and are referenced by file name below.

**Priority key:** **P1** blocks or confuses users · **P2** slows users down · **P3** polish. "Saves" estimates clicks (taps), typed fields or page hops removed per use.

---

## 2. Top 15 changes for low-tech users

1. **Make sign-up role a big, unmissable first choice** (A1). "Account type" is the 4th field, a dropdown already set to *Grower / cultivator*. A dispensary owner who skims ends up with a grower account and can't fix it. Use two large cards ("I grow and sell" / "I run a dispensary") with no default. (seen live, `signup-account-type-defaults-to-grower.png`)
2. **Stop making new users type their password 4 times** (A2, A3). The verify-email link asks for the password again, then says "You can now sign in". The user returns to an empty sign-in form. Sign them in automatically after verify and after password reset. (seen live, `verify-email-asks-for-password.png`)
3. **Tell pending-license buyers up front that they can't order yet, and fix the dead end they hit** (B1, B2). A pending buyer can fill a cart with no warning. On send they get "Confirm your request — Choose Check request…", which reads like a network glitch and has no way out. (seen live, `pending-buyer-cart-no-warning.png`, `pending-buyer-send-confusing-recovery.png`)
4. **Give buyers a product detail view** (BC1). Tapping a product card or title does nothing. There is no description, bigger photo or lab summary in one place. (seen live, `catalog-cards-no-detail-view.png`)
5. **Make search forgiving** (BC2). "blu drem" returns "No matching products", and so do multi-word searches like "gelato flower". Add word-by-word and typo-tolerant matching, "Did you mean…", and suggestions that open the grower or product. (seen live, `catalog-typo-search-no-results.png`)
6. **Fix and speed up admin license review** (AD1–AD6). The dashboard "Verify" button posts an empty form and shows a raw `{"status":400,...}` page; its confirm button is red with a warning icon. There is no Decline, no full license details, no bulk approve, and the queue is split across two pages. (seen live, `admin-dashboard-verify-raw-json-error.png`, `admin-verify-dialog-red-warning.png`)
7. **Put a real setup checklist at the top of each new user's dashboard** (GO1–GO3, BST5). Today it is a collapsed "Setup · 2 left" at the very bottom, its links drop users at the top of Settings, and it marks items complete when they aren't. (seen live, `grower-dashboard.png`)
8. **Rebuild "Record request" (the grower's phone-order form)** (GM1–GM8). Let the grower add a new customer without leaving, create the order as already accepted, pick products from a searchable list, open the new order after saving, and "Repeat last order". Today a phone-in order takes about 10 taps, and a new customer adds about 8 more taps plus re-entering everything. (`record-request-manual-order.png`)
9. **One-tap order status with Undo, right from the list** (GR1–GR4). Every status step takes 2 taps and a page visit, there is no Accept on list rows, and Cancel has no reason. Make forward steps one tap plus Undo, keep a confirm only for Cancel (with a reason picker), and add the next action on each row.
10. **Stop greying out buttons without saying why, and show errors beside the field** (X1). Save/Add buttons on strains, batches, stock, customers and manual orders stay disabled with no reason. Sign-up errors appear in one banner at the top of a long form. Keep buttons enabled, show a plain message under each problem field, and scroll to it.
11. **Placeholders must not look like typed answers** (X2). Grey sample values ("Blueberries NF, 3.5g", "45.00", "BERRY-3.5G") look filled in. The live screenshot shows "Product name is required" under a field that appears to contain a name. (seen live, `add-product-placeholder-looks-filled.png`)
12. **Readability pass across the app** (X3–X6). Most labels, table headers, badges and helper lines are 12px (`text-xs` appears 563 times; the grower dashboard has 121 text elements under 14px, measured live). Input and button borders are about 1.4–2.4:1 contrast, so fields vanish into cards. Many tap targets are 32–40px, and "secondary" buttons have no border. Set a 14px minimum, 3:1 borders, 44px targets, and bordered secondary buttons.
13. **Bottom tab bar on phones** (N1). Everything sits behind an unlabeled hamburger, and the dispensary phone header has no cart icon. Show 4 labelled tabs per role (grower: Overview, Requests, Products, Messages; buyer: Catalog, Cart, Orders, Messages) plus "More". (`grower-mobile-menu.png`, `catalog-mobile.png`)
14. **One Products page with search and inline edits** (GP1–GP4, N2). Growers juggle Catalog (a page of links), Products and Inventory, plus a separate Update stock page. Products has no search box, and prices can only be changed one product at a time through the full form. Merge these into one list with search, inline price, stock and availability edits, and "Mark sold out". (`grower-products-list.png`, `grower-catalog-hub-page.png`, `update-stock-mobile.png`)
15. **Say things one way everywhere** (X7–X9). "Requests" (grower) vs "Orders" (buyer), and statuses named 3 ways ("Submitted", "Needs review", "New"). Money shows as "$2200.00", "$4,800" and "$1800.00/ Lb"; dates as "9/29/2026", "Sep 28, 26" and "Sep 29, 2026"; order numbers as "#PF-1001" and "#1001". Pick one word per thing and one money, date and order-number format. (seen live)

---

## 3. Complete list by area

Format: **ID · Priority · Title.** Problem. **Fix:** change. **Where:** files or routes. **Saves:** estimate.

### 3.1 Cross-cutting: forms, readability, consistency, resilience

- **X1 · P1 · Disabled buttons hide the reason.** Add/Edit strain, Add/Edit batch, inline "Add strain", "Save stock", "Add customer" and "Record request" stay greyed until everything is valid. The error messages written for them never appear, and low-tech users are stuck on a dead button. **Fix:** keep buttons enabled; on tap, scroll to the first problem and show "Choose a strain", "Enter a ZIP", etc. under the field (the product form already does this). **Where:** `app/grower/strains/add/page.tsx:46,203`, `strains/[id]/edit/page.tsx:87,256`, `batches/add/page.tsx:96,347`, `batches/[id]/edit/page.tsx:133,412`, `grower/components/StrainSelector.tsx:185`, `grower/inventory/add/page.tsx:161`, `grower/customers/add/page.tsx:33-41`, `grower/orders/add/page.tsx:274-286,608`.
- **X2 · P1 · Placeholder samples look like real values.** Placeholders use the same `--color-pf-muted` as body text, so "Blueberries NF, 3.5g", "45.00", "100", "OGK-2026-001" and "BERRY-3.5G" look filled in. (seen live) **Fix:** dim placeholder colour noticeably, remove sample numbers, and use "e.g." only where the format isn't obvious. Remove placeholders that just repeat the label ("Email address" under the label "Email address"). **Where:** `app/globals.css:237`, `grower/products/components/ProductForm.tsx:722,801,884`, `grower/products/page.tsx` quick add, `auth/sign_in/page.tsx:153,173`, `auth/sign_up/page.tsx:216-385`.
- **X3 · P2 · 12px text for things users must read.** `text-xs` is used 563 times: table headers (uppercase), stat titles, field labels on mobile cards, badges, helper sentences, stock warnings, chat offer inputs, sidebar account name, nav group labels (13px). The `OrderTimeline` labels even get *smaller* on desktop (`text-sm sm:text-xs`). **Fix:** add type tokens (14px minimum for labels, data, helper sentences and inputs; 13px only for badge metadata); drop uppercase on labels. **Where:** `app/globals.css` (table header 0.75rem), `components/ui/StatCard.tsx:37,45`, `components/ui/OrderTimeline.tsx:137`, `components/ui/PortalBrand.tsx:37`, admin tables, `grower/products/page.tsx:305-311,394,536-541`, `ProductForm.tsx:963-1039`, `InventoryClient.tsx:324,337-342`, `auth/sign_up/page.tsx:262,285,352,400`, `landing/*`.
- **X4 · P2 · Fields and outline buttons blend into cards.** `pf-line` (#25342c) is 1.43:1 against the surface, and `pf-line-strong` (#41564a, input borders) is 2.36:1, below the 3:1 minimum. Inputs share the card background, and header icon buttons use `border-white/10`. **Fix:** raise `--color-pf-line-strong` to about #6b8577 (at least 3:1), give inputs a slightly raised background, and keep `pf-line` for dividers only. **Where:** `app/globals.css:9-10`, `components/ui/MobileNav.tsx:83`, `admin/components/AdminVerificationFilters.tsx:64,82`.
- **X5 · P2 · Tap targets under 44px.** The global mobile minimum is 40px (`globals.css:234,326-329`). Offenders:
  - `Button size="sm"` is 36px.
  - Mobile header icons are 40px.
  - Chat offer buttons are 32px.
  - Customer row buttons are about 30px.
  - Table density control is about 26px.
  - Modal and drawer close buttons are 28–36px.
  - Checkboxes are 16px with no larger hit area.
  - On desktop, sortable table headers on buyer tables are about 16px tall (measured live).

  **Fix:** 44px minimum (`min-h-11 min-w-11`), plus a `size="touch"` button variant and 44px label wrappers for checkboxes. **Where:** `components/ui/Button.tsx:21-25`, `MobileNav.tsx:83`, `NotificationBell.tsx:164`, `SearchDialog.tsx:359,388,524`, `ChatDrawer.tsx:646-721`, `grower/customers/components/CustomersList.tsx:213-236`, `TableDensityControl.tsx:26`, `components/ui/Modal.tsx:27`, `ConfirmDialog.tsx:97,107`, `components/OrdersTable.tsx`.
- **X6 · P2 · Button styles are inconsistent and some don't look clickable.** The `default` variant is near-white while the real primary is emerald. `secondary` has no border and sits on same-colour cards ("Hide", "Quick add", "Save draft", "Retry" read as text). `destructive` fails contrast (3.4:1). There are 128 hand-rolled emerald buttons with 2 text colours and 4 heights. **Fix:** primary as default, bordered secondary, `bg-red-600 text-white` destructive, then migrate hand-rolled buttons to `<Button>`. **Where:** `components/ui/Button.tsx:13-19`, `app/admin/**`, `app/grower/**`.
- **X7 · P1 · Two names for the same thing: "Request" vs "Order".** The grower nav and pages say "Requests"/"Record request". The buyer nav and titles say "Orders" but rows say "Request #"/"Est. value". The grower detail page says "Order not found" on a "Request" page. The timeline mixes "Buyer request received" and "Order delivered". (seen live) **Fix:** choose one noun (recommended: "Order" everywhere, and "Send order" at checkout), and one role label per portal ("Grower"/"Dispensary"; not "Buyer account", "Dispensary Portal" or "Grower / cultivator"). **Where:** `app/grower/layout.tsx:61,85,103`, `app/dispensary/layout.tsx:62,82-84,102`, `app/admin/layout.tsx:47-49`, `grower/orders/**`, `dispensary/orders/**`, `components/ui/OrderTimeline.tsx:26-30`, `lib/order-workflow.ts:1-8`.
- **X8 · P2 · Status words differ by screen.** Orders: "Submitted" / "Needs review" / "New"; "Ready" vs "Ready / In transit"; "Waiting on grower". Products: Published/Hidden/Out of stock/No stock/Draft vs Available/Unavailable vs "live"/"awaiting review". Price mode: "Quote only", "Request pricing" and "Internal reference price". **Fix:** one shared vocabulary (e.g. orders New → Accepted → Preparing → On the way → Delivered / Cancelled; products Live / Hidden / Sold out / Draft; "Price on request"). **Where:** `lib/order-workflow.ts`, `grower/products/page.tsx:281,395,442,1073`, `InventoryClient.tsx:36-44`, `grower/catalog/page.tsx:83`, `grower/marketplace/page.tsx:258-259`, `GrowerAttentionPanel.tsx`.
- **X9 · P2 · Money, date and order-number formats vary.** (seen live)
  - Money: "$2200.00" (grower products), "$1800.00/ Lb" (catalog), "$4800.00" (order tables) vs "$4,800" (dashboard), and "$12.5" in the cart.
  - Dates: "9/29/2026" (admin, server locale), "Sep 28, 26" (buyer mobile), "Sep 29, 2026" elsewhere.
  - Order numbers: "#PF-1001" on desktop vs "#1001" on mobile cards; reports use `slice(-8)`.

  **Fix:** one `formatMoney` (thousands separators, "$1,800.00 / lb"), one `formatDate` ("Sep 29, 2026", America/New_York), one order-number display. **Where:** `lib/product-display.ts`, `components/OrdersTable.tsx`, `dispensary/cart/page.tsx:776`, `admin/*/page.tsx` (`toLocaleDateString`), `grower/reports/page.tsx`, `admin/components/LicenseExpiryBadge.tsx`.
- **X10 · P1 · No error boundaries anywhere.** No `error.tsx` or `global-error.tsx` exists, so any thrown error shows Next's generic screen with no nav, no retry and no plain message. **Fix:** add `app/global-error.tsx` and an `error.tsx` in `app/grower`, `app/dispensary` and `app/admin` using `ErrorState` ("Something went wrong — Try again / Go to Overview"). **Where:** `app/**`.
- **X11 · P2 · No loading feedback between pages.** Only `app/grower/dashboard/loading.tsx` exists, so on slow connections a nav tap looks like it did nothing. **Fix:** a `loading.tsx` skeleton per portal segment. **Where:** `app/grower`, `app/dispensary`, `app/admin`.
- **X12 · P2 · "Not found" drops users out of their portal.** Only the root `not-found.tsx` exists (off-palette `bg-green-700`, and its "Dashboard" button bounces signed-out visitors). **Fix:** a portal-level `not-found.tsx` rendered inside the layout, with "Back to Overview". **Where:** `app/not-found.tsx:11-12`.
- **X13 · P2 · Shared empty, loading and error components are mostly bypassed.** `FetchState` is used in 2 files and `EmptyState` in 4. About 20 files roll their own empty states and about 30 their own spinners. Admin rolls its own pagination. **Fix:** migrate to `EmptyState`/`LoadingState`/`ErrorState`/`Pagination`, and add an action-button slot to `EmptyState`. **Where:** `components/ui/FetchState.tsx`, `EmptyState.tsx`, `Pagination.tsx`, and the list pages named in the admin/shared section.
- **X14 · P2 · Errors are shown as empty states or "all clear".** Admin DB errors show "All growers are reviewed" and "No growers yet". Strain and batch pages show the error box *and* "No strains yet / Add your first strain". The buyer catalog shows "Failed to fetch products (500)". **Fix:** track a load error and show `ErrorState` with Retry and plain wording. **Where:** `admin/dashboard/page.tsx:102-104`, `admin/growers/page.tsx:101-104`, `admin/dispensaries/page.tsx:100-103`, `admin/users/page.tsx:205-208`, `grower/strains/page.tsx:120-125,293-308`, `grower/batches/page.tsx:125-130,268-283`, `dispensary/catalog/CatalogContent.tsx:691`.
- **X15 · P2 · Deleting things means confirm dialogs with no undo.** Products (soft-deleted, yet "cannot be undone"), customers, strains, batches, favorites and alerts all use confirm dialogs; removing a cart line or a favorite has no undo at all. **Fix:** act immediately with an "Undo" toast (Inventory already does this) and add "Recently deleted" for products. Keep confirms only for irreversible, high-cost actions. **Where:** `grower/products/page.tsx:1599-1622`, `EditCustomerForm.tsx`, `strains/page.tsx`, `batches/page.tsx`, `FavoritesContent.tsx:98-104,283-290`, `PriceAlertsContent.tsx:215-216`, `dispensary/cart/page.tsx:384-389`.
- **X16 · P2 · Field labels not tied to inputs.** Measured live: Edit customer has 11 fields with no associated label, so tapping a label doesn't focus the field and screen readers don't announce it. Product form: the custom subtype input, the photo file input, "Price visibility", "Available" and the inline new-strain inputs. **Fix:** `id`/`htmlFor`, `fieldset`/`legend`, and `aria-invalid`/`aria-describedby` on errors. **Where:** `grower/customers/[id]/edit/components/EditCustomerForm.tsx`, `ProductForm.tsx:715-726,838,927,1087`, `ProductTypeSelector.tsx:170-177`, `StrainSelector.tsx:156-178`, `contact/page.tsx:184-243`.
- **X17 · P2 · Number inputs reject normal typing.** `type="number"` fields drop "$1,200.00" and "22.5%", then say "Price is required". Quantity fields snap an empty value back to 1 (`parseInt || 1`), and a manual-order price becomes $0 when cleared. **Fix:** `type="text" inputMode="decimal"`, strip `$ , %` and units on blur, keep a string while editing, and validate on blur. **Where:** `ProductForm.tsx:792-802,876-885,966-1036`, `batches/add/page.tsx:276-320`, `batches/[id]/edit/page.tsx:318-362`, `BatchSelector.tsx:348-356`, `dispensary/catalog/components/AddToCartButton.tsx:123`, `dispensary/cart/page.tsx:786`, `grower/orders/add/page.tsx:522`.
- **X18 · P2 · Esc key leaves forms.** Esc outside an input navigates away from the product form and dispensary settings (guarded only by native `window.confirm`), and older users hit Esc by accident. **Fix:** don't bind Esc to leaving full pages; use the shared unsaved-changes guard. **Where:** `hooks/useKeyboardShortcuts.ts:45-51`, `ProductForm.tsx:553-560`, `dispensary/settings/components/SettingsForm.tsx:370-372`, `hooks/useUnsavedChanges.ts:23-25`.
- **X19 · P2 · Toasts vanish too fast and overlap mobile action bars.** Toasts use Sonner's default 4 seconds with no close button. Bottom-right toasts cover the sticky mobile bar and the floating buttons, and the sticky bar ignores the iPhone safe area. **Fix:** 8 seconds for errors, `closeButton`, top-center on mobile, and `env(safe-area-inset-bottom)` padding. **Where:** `app/providers.tsx:18-28`, `components/ux/StickyMobileActionBar.tsx:27,45`, `app/layout.tsx:34`.
- **X20 · P2 · Floating buttons cover content on desktop.** The clock (recent activity) and chat floating buttons sit over the customer card on order detail, product row actions and catalog cards. (seen live, `grower-dashboard.png`, `cart-review-request-modal.png`) **Fix:** remove the recent-activity button (it duplicates nav) and move Messages into the header. **Where:** `components/ux/RecentActivityDrawer.tsx`, `components/ui/PortalFloatingActions.tsx:13`.
- **X21 · P2 · Draft autosave messages everywhere.** Examples: "Product details saved 3:04 PM on this device. Not submitted." (product form); "Cart details saved … Remove saved copy" (cart); the same in chat and settings. **Fix:** autosave silently; speak only when offering "Restore draft". **Where:** `components/ux/DraftAutosaveStatus.tsx:24-41`, `ProductForm.tsx:636-660`, `dispensary/cart/page.tsx`, `ChatDrawer.tsx`, `SettingsForm.tsx` (both roles).
- **X22 · P3 · Focus rings are inconsistent and some are nearly invisible.** There are 4–5 ring colours, and admin inputs use `ring-pf-accent/20` (about 1.7:1). **Fix:** one focus token (2px #34d9a2 with offset). **Where:** `globals.css:241-244`, `AdminVerificationFilters.tsx:64,82`, `admin/users/page.tsx:232`.
- **X23 · P3 · Heading structure gaps.** On mobile, auth pages have no `<h1>` (it sits in the desktop-only side panel). Measured live: some grower pages expose two `<h1>`s ("HistoryRequest history", "Order Request #PF-1001 | Request"). Empty states jump from h1 to h3, there is no skip link, and the header sits inside `<main>`. **Fix:** one visible h1 per page, h2 in empty states, a "Skip to content" link, and the header outside `<main>`. **Where:** `auth/sign_in/page.tsx:85,121`, `auth/sign_up/page.tsx:142,177`, `grower/orders/history/page.tsx`, `grower/orders/[id]/page.tsx:310`, `EmptyState.tsx:25`, `FetchState.tsx:38,62`, portal layouts.
- **X24 · P3 · Reduced-motion gaps.** Smooth scrolling isn't reset, and the landing feature tour auto-rotates every 5.2s with no pause on touch. **Fix:** reset `scroll-behavior`, and stop autoplay (or stop it after the first touch). **Where:** `globals.css:33,160-168`, `landing/feature-tour.tsx:220-249`, `components/ui/MobileOrderNavBar.tsx:23`.
- **X25 · P3 · Dead or unused UI code invites inconsistency.** `GuidedFixPanel`, `SetupChecklist`, `RolePrimaryAction`, `admin/components/ClientNav.tsx`, `styles/globals.css`, `grower/orders/[id]/components/OrderStatusTimeline.tsx`, `dispensary/catalog/components/FilterSidebar.tsx`, and the z-index `!important` block in `globals.css:170-215`. **Fix:** delete, or adopt one checklist component. **Where:** as listed.

### 3.2 Navigation and global chrome

- **N1 · P2 · Phones hide everything behind an unlabeled hamburger.** Grower has 10 links behind it; the header is a row of 40px icon-only buttons; the dispensary phone header has no cart. (seen live, `grower-mobile-menu.png`, `catalog-mobile.png`) **Fix:** a bottom tab bar with 4 labelled items plus "More", and a "Menu" label on the trigger. **Where:** `app/grower/layout.tsx:56-86`, `app/dispensary/layout.tsx:58-85`, `components/ui/MobileNav.tsx:79-89`. **Saves:** 1 tap plus scanning for every primary task.
- **N2 · P2 · Grower nav has three entries for one job and odd grouping.** Catalog (a hub of links repeating the Products filters), Products and Inventory; Customers and Reports sit under "Grow". (seen live, `grower-catalog-hub-page.png`) **Fix:** one "Products" entry (stock inline); groups Sell (Overview, Orders, Customers, Reports), Products (Products, Strains, Batches), Account. Remove the Catalog hub. **Where:** `app/grower/layout.tsx:58-66`, `grower/catalog/page.tsx`. **Saves:** 1 page hop per catalog task.
- **N3 · P2 · Global search overpromises and has fake actions.** The dispensary label says "products, requests, growers, and strains" but only products and orders are returned. The quick action "Saved" just opens /saved, and "Message" and "Follow up" go to the same page as View. Results are capped at 5 with no "See all". There is also a second search box on the catalog. **Fix:** match copy to real scopes (or add growers), remove fake actions or make them real, add "See all results", and make the header search focus the catalog field on the catalog page. **Where:** `components/SearchDialog.tsx:279-293,343,375,401`, `api/search/route.ts:149-220`, `dispensary/layout.tsx`.
- **N4 · P2 · Notification bell issues.** Clicking a notification does nothing if mark-read fails. The label lacks the unread count, focus doesn't move into the panel, and nothing is announced. **Fix:** navigate first and mark read in the background; `aria-label="Notifications, 3 unread"`; move focus on open; close on Escape. **Where:** `components/notifications/NotificationBell.tsx:140-144,159-179`.
- **N5 · P2 · Badge counts disagree and stay lit.** Bell, chat badge, "Requests" nav badge and attention panel all count differently. The Requests badge includes cancellations from the last 7 days, so it stays lit after everything is handled. The cart badge counts units ("50") rather than lines. **Fix:** the Requests badge counts only orders needing action; the cart badge counts lines. **Where:** `lib/grower-attention.ts:202`, `app/grower/layout.tsx`, `dispensary/components/CartBadge.tsx:7`.
- **N6 · P3 · The logo isn't a home link, and the current portal isn't named.** **Fix:** link the logo to Overview and show a small "Grower"/"Dispensary"/"Admin" tag. **Where:** `components/ui/PortalBrand.tsx:9-15`.
- **N7 · P3 · Keyboard shortcut hints are wrong or missing.** "⌘K" is shown to Windows users, and Ctrl+S exists only in code comments. **Fix:** show "Ctrl K" off Mac, and a small "Ctrl+S" hint next to Save. **Where:** `SearchDialog.tsx:512`, `useKeyboardShortcuts.ts`.
- **N8 · P3 · The desktop sidebar stops partway down the page, leaving a black gap under Sign out.** (seen live, `grower-dashboard.png`) **Fix:** full-height sticky sidebar. **Where:** `app/grower/layout.tsx`, `app/dispensary/layout.tsx`, `app/admin/layout.tsx`.

### 3.3 Public site and account access

- **A1 · P1 · Role dropdown preset to Grower, buried as the 4th field.** (seen live, `signup-account-type-defaults-to-grower.png`) **Fix:** step one is two large cards with no default; read `?type=grower|dispensary`; add role-specific CTAs on the landing personas and footer. **Where:** `auth/sign_up/page.tsx:22,266-289`, `landing/hero.tsx:252`, `getting-started.tsx:47`, `cta.tsx:34`, `footer.tsx:7,12`, `personas.tsx:85-108`. **Saves:** wrong-role accounts and a support ticket.
- **A2 · P1 · Verify link asks for the password, then makes the user sign in again.** Before reaching the dashboard the password is typed 4 times (sign-up, confirm, verify, sign-in). (seen live, `verify-email-asks-for-password.png`) **Fix:** after a successful verify, sign in automatically and go to `/dashboard`; better, let the one-time link itself verify without a password. **Where:** `auth/components/AccountAccessForm.tsx:42-91`, `lib/account-security.ts:71`, `auth/verify-email/page.tsx:6`. **Saves:** 1 page hop, 2–3 fields, 1–2 taps.
- **A3 · P2 · Password reset ends at an empty sign-in form.** **Fix:** sign in automatically after the reset. **Where:** `AccountAccessForm.tsx:86,91`, `lib/account-security-api.ts:69-70`. **Saves:** 2 fields, 1 tap.
- **A4 · P1 · A wrong password on the verify page is reported as a broken link.** The user sees "This link is invalid or has expired…" and requests new emails in a loop. **Fix:** a distinct "That password doesn't match this account" with a reset link, keeping the token. **Where:** `lib/account-security.ts:71`, `lib/account-security-api.ts:69-70`.
- **A5 · P1 · Lockout looks like a wrong password.** After 12 tries per email (or 60 per office IP) in 15 minutes, the correct password also shows "Email or password is incorrect". **Fix:** a distinct "Too many tries — wait 15 minutes or reset your password". **Where:** `lib/auth.ts:37-41`, `auth/sign_in/page.tsx:15-22`.
- **A6 · P1 · Signing up with an existing email silently sends nothing.** **Fix:** email "You already have an account" with Sign in and Reset buttons (the screen stays the same, which is still safe against account enumeration); add "Already have an account? Sign in · Forgot password" to the check-email screen. **Where:** `api/auth/register/route.ts:54-64`, `lib/account-security.ts:37-38`.
- **A7 · P1 · Sign-up errors appear in one banner at the top.** Errors show one at a time (live: "Passwords do not match" hid the too-short password), mixed with native bubbles that fade. **Fix:** inline errors per field, focus the first invalid field, validate on blur, and use specific text ("Enter your last name"). **Where:** `auth/sign_up/page.tsx:49-77,189-193`, `components/PolicyCheckbox.tsx:6`.
- **A8 · P1 · "Sign in" is hidden on phones.** Only "Sign up" and a menu icon show under 640px. **Fix:** always show "Sign in". **Where:** `landing/nav.tsx:90-94,135-141`. **Saves:** 1 tap plus the search on every return visit.
- **A9 · P1 · The contact form only opens a `mailto:`.** Webmail users get nothing. **Fix:** send server-side via the existing Resend setup and show "Message sent". **Where:** `contact/page.tsx:83-88,266-273`.
- **A10 · P2 · Sign-in forgets where the user was going.** Deep links (an order, the cart) land on the dashboard after sign-in. **Fix:** a same-origin `callbackUrl` on redirects, honoured after sign-in and after terms acceptance. **Where:** `grower/layout.tsx:20`, `dispensary/layout.tsx:35`, `admin/layout.tsx:16`, `dashboard/page.tsx:12`, `lib/auth-helpers.ts:28`, `auth/sign_in/page.tsx:57-60`, `account/terms/AcceptanceForm.tsx:22`. **Saves:** 2+ taps per link.
- **A11 · P2 · Signed-in users see "Sign in / Create account".** The landing page, auth pages and help all show them. **Fix:** "Go to my dashboard" on the landing page and help; redirect the auth pages when a session exists. **Where:** `app/page.tsx`, `landing/nav.tsx:89-101`, `auth/sign_in/page.tsx`, `auth/sign_up/page.tsx`, `help/page.tsx:107-109`.
- **A12 · P2 · The typed email isn't carried between auth screens.** Forgot password and Resend verification open empty. **Fix:** prefill it; on "email not verified", offer an inline "Send a new link to name@x.com". **Where:** `auth/sign_in/page.tsx:16,194-195`, `AccountAccessForm.tsx:20-28`. **Saves:** 1 field and 1 hop per recovery.
- **A13 · P2 · Bad or incomplete links are only caught after the user types.** **Fix:** check the token on page load and offer "Send a new link" straight away. **Where:** `AccountAccessForm.tsx:56-61`.
- **A14 · P2 · Links expire fast, and the resend cap is silent.** Verify links last 60 minutes and reset links 30. After 4 sends an hour, "sent" messages never arrive. **Fix:** 24 hours for verify, 1–2 hours for reset; say so plainly when the cap is hit. **Where:** `lib/account-security.ts:17`, `lib/account-security-api.ts:35,48`, `AccountAccessForm.tsx:72`.
- **A15 · P2 · Account emails are plain text with a long raw URL.** **Fix:** an HTML email with one big button and a fallback link. **Where:** `lib/account-security.ts:47-49`, `lib/account-mail.ts:58-61`.
- **A16 · P2 · Confirm-password fields are redundant with the show-password toggle.** **Fix:** remove the confirm fields on sign-up and reset, and reuse the sign-up password field with its live length hint on reset. **Where:** `auth/sign_up/page.tsx:368-417`, `AccountAccessForm.tsx:47-51,104-113`. **Saves:** 1 field (12+ characters) each time.
- **A17 · P2 · The license isn't collected at sign-up, and growers aren't told about license review.** **Fix:** optional license number and expiry at sign-up, or a "Next: add your license" first-run step. **Where:** `auth/sign_up/page.tsx:284-288`, `dispensary/dashboard/LicenseVerificationCard.tsx`. **Saves:** 1–2 hops.
- **A18 · P2 · The "Check your email" screen invites duplicate sends.** "Send verification link" is enabled immediately and there is a pointless "Use a different email" button. **Fix:** "We sent a link to name@x.com", a resend link with a running cooldown, and "Wrong email? Sign up again". **Where:** `AccountAccessForm.tsx:96-99,114`, `auth/verify-email/page.tsx:6-7`.
- **A19 · P2 · Change email has no way back to Settings.** Only "Back to sign in" is offered while signed in. **Fix:** "Back to settings" for the user's role. **Where:** `AccountAccessForm.tsx:90-91,116-121`, `auth/change-email/page.tsx`.
- **A20 · P2 · The Configuration error is a signed-in dead end.** There is no sign-out, and signing in again loops back to it. **Fix:** a Sign out button and plain copy ("Your account setup isn't finished — contact support"). **Where:** `auth/error/page.tsx:15-18,113-121`, `grower/layout.tsx:34`, `dispensary/layout.tsx:43`.
- **A21 · P2 · Terms acceptance can show a raw JSON parse error.** **Fix:** `response.json().catch(()=>({}))` plus plain copy. **Where:** `account/terms/AcceptanceForm.tsx:21`.
- **A22 · P2 · Landing and footer text has low contrast.** `text-gray-600` on near-black is about 2.6:1 and `gray-500` about 4.2:1. **Fix:** `gray-400` or `pf-muted` minimum. **Where:** `landing/hero.tsx:171,271,289`, `footer.tsx:32-72`, `feature-tour.tsx`, `getting-started.tsx:38`, `contact/page.tsx:134,147`.
- **A23 · P3 · The hero demo has a fake "Record Request" button that looks tappable.** **Fix:** mute it, or make the whole demo a sign-up link. **Where:** `landing/hero.tsx:120-122`.
- **A24 · P3 · The hero headline may be read as empty by screen readers.** **Fix:** an `sr-only` sentence. **Where:** `landing/motion.tsx:121-123`.
- **A25 · P3 · Sign-in, sign-up and contact have generic tab titles.** **Fix:** per-route metadata. **Where:** those pages, `auth/layout.tsx:2`.
- **A26 · P3 · Landing tab widgets are incomplete for keyboard users.** **Fix:** complete the tabs pattern or use `aria-pressed` buttons. **Where:** `feature-tour.tsx:251-261`, `personas.tsx:86-92`.
- **A27 · P3 · Footer and nav are inconsistent.** Contact is a `mailto:`, Sign in is missing from the growers column, and Help isn't in the nav. **Fix:** as described. **Where:** `landing/footer.tsx:5-19`, `nav.tsx:10-15`.
- **A28 · P3 · Success copy is inaccurate.** It says "signed out on other devices", but this device is signed out too. **Fix:** "Done. Sign in with your new password." **Where:** `AccountAccessForm.tsx:76,86,88`.
- **A29 · P3 · The contact form has no autofill or prefill and requires "Business type".** **Fix:** `autoComplete`, prefill from the session, drop the field. **Where:** `contact/page.tsx:56-58,184-243`. **Saves:** 1–3 fields.
- **A30 · P3 · The contact location ("Vermont") contradicts the legal address (Medford, NJ).** **Fix:** make them consistent or drop the location card. **Where:** `contact/page.tsx:142-152`, `legal/LegalDocument.tsx:104-108`.
- **A31 · P3 · Help answers name screens without linking to them.** **Fix:** role-aware links. **Where:** `help/page.tsx:16,42,72,76`.
- **A32 · P3 · Legal pages on mobile open with a long contents list.** **Fix:** collapse it below `lg`. **Where:** `legal/LegalDocument.tsx:59-72`.
- **A33 · P3 · Sign-in secondary links sit between Password and "Sign in".** **Fix:** move them below the button; show "Resend verification" only after that error. **Where:** `auth/sign_in/page.tsx:193-196`.
- **A34 · P3 · Auth tap targets are 36–40px.** **Fix:** 44px. **Where:** `landing/nav.tsx:92,98,107`, `AccountAccessForm.tsx:90-120`, `auth/sign_in/page.tsx:194-195`, `footer.tsx:51-72`.

### 3.4 Grower: onboarding and dashboard

- **GO1 · P1 · The setup checklist is collapsed at the very bottom of the dashboard.** (seen live: "Setup · 2 left", below everything else) **Fix:** show it expanded at the top until done (profile, license, order terms, first product, logo), with a progress count, then hide it. **Where:** `grower/dashboard/page.tsx:342` (SetupNextStepsCard 236-277). **Saves:** 1–2 taps per visit and the "where do I start" dead end.
- **GO2 · P1 · Setup links land at the top of Settings.** **Fix:** link to `#profile`, `#license`, `#terms` and `#subscription` (the section IDs exist) and focus the first empty field. **Where:** `grower/dashboard/page.tsx:236-277`. **Saves:** 1–3 scrolls or taps per item.
- **GO3 · P1 · The checklist reports false completion.** "Subscription" is always complete, and "Buyer requests" counts as complete while requests are still pending. **Fix:** drop Subscription; base the requests item on having responded, or drop it. **Where:** `grower/dashboard/page.tsx` (SetupNextStepsCard).
- **GO4 · P1 · The "Needs review" deep link is ignored.** `/grower/orders?view=needs-review` shows all active orders. (seen live: 4 rows instead of 1) **Fix:** read `view` from `searchParams` and pass it to `OrdersList`. **Where:** `grower/orders/page.tsx:16,30`, `grower/orders/components/OrdersList.tsx:118,131`, `grower/dashboard/GrowerAttentionPanel.tsx:66,124`. **Saves:** 1 tap plus scanning.
- **GO5 · P2 · The dashboard's main button is "Record request" (phone entry), not the most common task.** **Fix:** when there are new orders, the primary button is "Review 2 new orders" and "Record order" becomes secondary. **Where:** `grower/dashboard/page.tsx:288`.
- **GO6 · P2 · Three overlapping order lists on the dashboard.** Needs attention, Recent activity (no status, its own date filter) and "Messages & updates" (collapsed at the bottom, 9 items). (seen live) **Fix:** one expanded "Needs attention" list (new orders, unread messages, buyer cancellations) with a one-tap next action; drop the activity feed. **Where:** `grower/dashboard/OverviewRequests.tsx`, `ActivityFeed.tsx`, `GrowerAttentionPanel.tsx:76`.
- **GO7 · P2 · The attention panel includes the grower's own status changes.** **Fix:** show buyer-initiated changes only. **Where:** `lib/grower-attention.ts`, `GrowerAttentionPanel.tsx`.
- **GO8 · P2 · Dashboard and Reports disagree on "last 30 days" value.** The dashboard uses `deliveredAt`; Reports use `createdAt`. **Fix:** use one basis and label it. **Where:** `grower/reports/page.tsx:76,85`, `lib/dashboard-metrics.ts`.
- **GO9 · P3 · Low-stock list includes drafts and quote-only items.** (seen live: "Draft - Winter Mix" listed) **Fix:** show live listings only. **Where:** `lib/grower-products.ts:76`, dashboard inventory card.
- **GO10 · P3 · The loading skeleton doesn't match the page, so the layout jumps.** **Where:** `grower/dashboard/loading.tsx`.
- **GO11 · P3 · The "Marketplace hidden" banner has no direct fix link.** **Fix:** link to the license section. **Where:** `grower/dashboard/page.tsx:291-297`.

### 3.5 Grower: incoming orders and status changes

- **GR1 · P2 · Every status step takes 2 taps ("Confirm: accept request").** The dismiss button is labelled "Cancel", right next to "Cancel request". **Fix:** one tap plus an Undo toast for forward steps; keep a confirm only for cancelling; rename the grower's "Cancel request" to "Decline" on new orders. **Where:** `grower/orders/[id]/components/QuickStatusUpdate.tsx:76-81,145`. **Saves:** 4 taps per order lifecycle.
- **GR2 · P2 · No Accept (next step) on list rows.** Rows only have "View". **Fix:** show the next-status button on each row and card. **Where:** `grower/orders/components/OrdersList.tsx`. **Saves:** 1 page load and 1 tap per order.
- **GR3 · P2 · Bulk status actions have no undo and can't be reversed.** Bulk Cancel runs instantly. **Fix:** an 8-second Undo toast; Cancel requires a reason. **Where:** `OrdersList.tsx:510-519`, `lib/order-workflow.ts`.
- **GR4 · P2 · Cancelling has no reason, so the buyer gets a bare "Cancelled".** **Fix:** a reason picker (Out of stock / Buyer asked / Can't deliver / Other) included in the notification and history. **Where:** `QuickStatusUpdate.tsx`, `api/orders/[id]/status/route.ts`. **Saves:** a follow-up conversation.
- **GR5 · P2 · Orders list has no search.** **Fix:** search by buyer, order number or product, kept in the URL. **Where:** `grower/orders/page.tsx`, `OrdersList.tsx`.
- **GR6 · P2 · Tab counts only reflect the current page of 50.** **Fix:** server-side `groupBy(status)`. **Where:** `OrdersList.tsx:149-157`.
- **GR7 · P2 · Buyer phone and email aren't tappable.** **Fix:** `tel:`/`mailto:` links at 44px; put Message and Call beside the status action at the top (on mobile they're currently at the bottom). **Where:** `grower/orders/[id]/page.tsx:527-533`, `MessageBuyerButton.tsx`, `CustomersList.tsx`.
- **GR8 · P2 · Order actions hidden in a `<details>` menu that doesn't close.** Edit is offered on delivered and cancelled orders. **Fix:** visible Edit and Print buttons; hide Edit on closed orders; a proper menu. **Where:** `grower/orders/[id]/page.tsx:314-328`.
- **GR9 · P2 · The customer name on an order opens the edit form.** **Fix:** link to a customer overview (see GC1). **Where:** `grower/orders/[id]/page.tsx`, `CustomersList.tsx`.
- **GR10 · P2 · Status API errors are vague.** Toasts say "Invalid status" or "Not your order". **Fix:** "This order was already moved to Preparing — refresh to see it." **Where:** `api/orders/[id]/status/route.ts`.
- **GR11 · P2 · Edit order: quantity changes only by +/− taps.** Going from 5 to 50 is 45 taps. **Fix:** a numeric input with steppers. **Where:** `grower/orders/[id]/edit/components/EditOrderForm.tsx:520-538,594-611`. **Saves:** up to dozens of taps per line.
- **GR12 · P2 · Edit order can't add items or change prices.** The API supports it. **Fix:** the same product picker and price field as the create form. **Where:** `EditOrderForm.tsx`, `api/orders/[id]/route.ts`.
- **GR13 · P2 · Edit order shows raw machine notes ("Fulfillment method: …").** **Fix:** parse into fields and rebuild on save. **Where:** `EditOrderForm.tsx:112`, `lib/order-workflow.ts` (`parseOrderRequestNotes`).
- **GR14 · P2 · Edit order duplicates the status control.** **Fix:** remove the status radios from edit. **Where:** `EditOrderForm.tsx:403-471`.
- **GR15 · P2 · Order history has no search, date filter, export or repeat.** **Where:** `grower/orders/history/page.tsx`.
- **GR16 · P3 · The order detail title is just "Request".** **Fix:** "Order #PF-1001 · Green Vermont Dispensary". **Where:** `grower/orders/[id]/page.tsx:310`.
- **GR17 · P3 · Progress and history are collapsed, with nested duplicate headings ("Progress" › "Timeline").** **Fix:** one open "History" section. **Where:** `grower/orders/[id]/page.tsx:495-507`.
- **GR18 · P3 · History shows "Grower" instead of who acted.** **Where:** `components/ui/OrderHistory.tsx`.
- **GR19 · P3 · Mobile cards have two links to the same place, and checkboxes are small.** **Where:** `OrdersList.tsx`.
- **GR20 · P3 · Mobile item cards drop the "Priced by accepted quote" label.** **Where:** `grower/orders/[id]/page.tsx`.

### 3.6 Grower: manual orders ("Record request")

- **GM1 · P1 · A new customer can't be added from the order form.** The grower has to leave, losing the order. **Fix:** "+ New customer" in the buyer picker, opening a small inline form (name plus phone or email). **Where:** `grower/orders/add/page.tsx:371-425`, `grower/customers/add/page.tsx`. **Saves:** about 8 taps, 2 hops and re-entering the order.
- **GM2 · P1 · The grower's own phone order starts as "Submitted".** They then have to find it, Accept and Confirm. **Fix:** create it as Accepted (or an "Already agreed" toggle, on by default); hide "Awaiting buyer confirmation". **Where:** `api/orders/route.ts:264`, `grower/orders/[id]/page.tsx`. **Saves:** 3 taps and 1 page load per order.
- **GM3 · P1 · Clearing a price makes it $0 and forces a "Price note".** **Fix:** keep the raw string while typing; make the note optional (default "Phone price"). **Where:** `grower/orders/add/page.tsx:522,541-546`, `api/orders/route.ts`. **Saves:** 1 typed field per custom price.
- **GM4 · P2 · "Add item" inserts an arbitrary first product.** The product search is a separate box that filters a `<select>`. (seen live) **Fix:** "Add item" opens a searchable picker (name, strain, stock, price). **Where:** `grower/orders/add/page.tsx:156-172,443`. **Saves:** 1–2 taps per line.
- **GM5 · P2 · Saving lands on the orders list, not the new order.** **Fix:** redirect to `/grower/orders/{id}` with a toast. **Where:** `grower/orders/add/page.tsx:313`. **Saves:** 1 tap plus a search.
- **GM6 · P2 · No prefill or "Repeat last order".** **Fix:** support `?customer=` and `?from={orderId}`; add "New order" on customer rows and "Repeat" on history rows. **Where:** `grower/orders/add/page.tsx`, `CustomersList.tsx`, `grower/orders/history/page.tsx`. **Saves:** buyer search plus every line item.
- **GM7 · P2 · Delivery and payment terms are free text in a collapsed section.** **Fix:** Pickup/Delivery, date and payment-terms pickers, defaulted from the grower's saved terms. **Where:** `grower/orders/add/page.tsx:572-595`, `lib/order-workflow.ts`.
- **GM8 · P2 · A stock mismatch blocks saving.** **Fix:** warn ("Only 12 in stock — save anyway?") and adjust stock. **Where:** `grower/orders/add/page.tsx`, `api/orders/route.ts`.
- **GM9 · P2 · The buyer picker is unsorted and ignores arrow keys.** **Fix:** the grower's own customers first (most recent first), then A–Z, with arrow keys and Enter. **Where:** `grower/orders/add/page.tsx:371-425`, `/api/dispensaries`.
- **GM10 · P2 · No unsaved-changes guard on add order, add customer or order terms.** **Fix:** use `useUnsavedChanges`. **Where:** those pages, `components/settings/CommercialTermsPanel.tsx`.
- **GM11 · P2 · A full-page spinner shows until lists load.** **Fix:** render the form immediately and load the pickers in the background. **Where:** `grower/orders/add/page.tsx`.
- **GM12 · P3 · The label says "Buyer", but the hint says "Select a dispensary before recording the request."** (seen live) **Fix:** use one word, shown only after a submit attempt. **Where:** `grower/orders/add/page.tsx:608-609`.

### 3.7 Grower: customers and statements

- **GC1 · P2 · No customer overview page.** Rows open the edit form. **Fix:** `/grower/customers/[id]` with contact details (tappable), open and past orders, statement, "New order" and an "Edit" button. **Where:** `grower/customers/components/CustomersList.tsx`, `grower/customers/[id]/`. **Saves:** 2–3 hops per lookup.
- **GC2 · P1 · The ZIP code typed on Add customer is silently discarded.** The form sends `zip` and the API reads `zipCode`. (confirmed in code) **Fix:** send `zipCode`. **Where:** `grower/customers/add/page.tsx:72`, `api/customers/route.ts:47,63`.
- **GC3 · P1 · Add customer requires 4 fields behind a disabled button.** The API needs only a name and email, and a phone-only customer can't be added. **Fix:** require a business name plus phone *or* email; show inline errors. **Where:** `grower/customers/add/page.tsx:33-41`, `api/customers/route.ts`. **Saves:** 1–2 fields.
- **GC4 · P1 · "Message" is offered for off-platform customers, whose messages go nowhere.** **Fix:** show Call and Email instead; reject such conversations in the API. **Where:** `MessageBuyerButton.tsx`, `CustomersList.tsx:213-236`, `api/messages/conversations/route.ts`.
- **GC5 · P2 · Customer search only applies on Enter or the button.** **Fix:** debounced search-as-you-type. **Where:** `grower/customers/page.tsx`.
- **GC6 · P2 · The customer "Requests" link shows active orders only, so past buyers look empty.** **Where:** `CustomersList.tsx`, `grower/orders/page.tsx`.
- **GC7 · P2 · Statements have no presets, print or PDF, and silently include delivered orders only.** **Fix:** This month / Last month / 90 days / Year chips that apply instantly; Print/PDF; a status filter with Delivered as the default, labelled. **Where:** `grower/customers/[id]/statement/page.tsx`, `StatementCsvExport.tsx`. **Saves:** 2 date fields and 1 tap.
- **GC8 · P3 · The State field differs between forms.** Add uses free text; Edit has a select with only 13 states. **Fix:** a full US state select in both. **Where:** `grower/customers/add/page.tsx`, `EditCustomerForm.tsx`.
- **GC9 · P3 · Customer forms return to the list after saving.** **Fix:** return to the customer or the calling page (e.g. the order form). **Where:** `grower/customers/add/page.tsx`, `EditCustomerForm.tsx`.
- **GC10 · P3 · The statement back link goes to the edit form.** **Where:** `grower/customers/[id]/statement/page.tsx`.
- **GC11 · P3 · The customers empty state has no "Add customer" button.** **Where:** `grower/customers/page.tsx:60-70`.

### 3.8 Grower: products, availability and preview

- **GP1 · P1 · No search or sort on Products, Inventory or the Marketplace preview.** The API already supports both. **Fix:** a search box and sort (Name, Price, Stock, Newest) kept in the URL. **Where:** `grower/products/page.tsx:1327-1356`, `lib/grower-products.ts:57-60`, `grower/inventory/page.tsx:22`. **Saves:** minutes per lookup.
- **GP2 · P1 · Repricing many products is one full form per product.** **Fix:** an editable price cell in the list; bulk "Set price / Change by %" and "Show price / Price on request" (the API supports these); import that updates by SKU (GI2). **Where:** `grower/products/page.tsx:445-450,1498-1512`, `api/products/bulk-update/route.ts:40-45`. **Saves:** about 2 taps and 1 page load per product.
- **GP3 · P1 · A "published" product quietly saves hidden when stock is 0.** Stock defaults to 0 with Available on; the toast says "Product published" but the server hides it. The same happens with Quick add and Duplicate. (seen live: stock 0 with the Available toggle on) **Fix:** leave Stock empty and required, or warn "Stock is 0 — buyers won't see this"; the toast says "Saved but hidden: no stock". **Where:** `ProductForm.tsx:240,244,626-631`, `lib/product-payload.ts:198-203`, `grower/products/page.tsx:590-597,873`.
- **GP4 · P2 · Stock lives on separate pages from products.** Inventory (25 per page), Products (50 per page) and an "Update stock" page whose stock box shows 0 until a product is picked and can only replace the total. (seen live, `update-stock-mobile.png`) **Fix:** stock stepper and availability switch inline in the Products list; retire Update stock, or add "Add received / Set total". **Where:** `grower/inventory/InventoryClient.tsx`, `grower/inventory/add/page.tsx`, `grower/products/page.tsx:451-455`.
- **GP5 · P1 · Quick add's Type is free text.** "flower", "Flowers", "Vape" become new types that buyer filters miss. **Fix:** use the type picker (`ProductTypeSelector`) and match names case-insensitively, including plurals and synonyms. **Where:** `grower/products/page.tsx:1237-1245`, `lib/product-types.ts:161-168`.
- **GP6 · P2 · Three different "add" buttons.** "Quick add", "Import CSV" (locked on Free) and "Add product". Quick add has two submits ("Create listing" and "Create draft and add details"). (seen live, `products-quick-add-three-add-buttons.png`) **Fix:** one "Add product" with "Import from spreadsheet" beside it; Quick add becomes an inline row with a single Save plus "More details". **Where:** `grower/products/page.tsx:1186-1294`.
- **GP7 · P2 · No one-tap "Sold out".** **Fix:** "Mark sold out" in row actions and bulk, with Undo. **Where:** `grower/products/page.tsx:1498-1512`.
- **GP8 · P2 · Hiding one product in List view needs `⋯` then a modal.** **Fix:** an availability switch in the Status cell. **Where:** `grower/products/page.tsx:456-511`. **Saves:** 1 tap and 1 modal per toggle.
- **GP9 · P2 · Saving an edit loses the page, view and filters.** **Fix:** return to the previous URL and scroll to the row. **Where:** `grower/products/[id]/edit/components/EditProductPageClient.tsx:61`, `grower/products/add/page.tsx:85,97`.
- **GP10 · P2 · Two chip rows that look alike, both starting with "All".** Filters and grouping; grouping only affects the current page. (seen live) **Fix:** make grouping a "Group by" select or drop it. **Where:** `grower/products/page.tsx:1134-1139,1359-1387`.
- **GP11 · P2 · No Drafts filter.** Drafts hide inside "Unavailable". **Where:** `grower/products/page.tsx:1069-1074`, `lib/grower-products.ts:72-76`.
- **GP12 · P2 · Bulk "Make available" overstates the count.** It says "N products" even when drafts or zero-stock items were skipped. **Fix:** "3 made available · 2 skipped: no stock". **Where:** `grower/products/page.tsx:958-965`, `api/products/bulk-update/route.ts:67-69`.
- **GP13 · P2 · `Gram` is the default unit for everything.** **Fix:** default by type (Flower → lb; Preroll, Cartridge, Edibles → unit) and remember the last unit per type. **Where:** `ProductForm.tsx:242`, `grower/products/page.tsx:595`, `lib/ux-workflow.ts:38-43`.
- **GP14 · P2 · Stock must be a whole number, so half-pounds can't be listed.** **Fix:** allow decimals for weight units, or explain. **Where:** `ProductForm.tsx:129-136`, `lib/product-payload.ts:77-83`, `api/inventory/route.ts:19`.
- **GP15 · P2 · Low-stock limits disagree (5 vs 10) and ignore the unit.** **Where:** `grower/products/page.tsx:320,452,1032`, `InventoryClient.tsx:12`, `lib/grower-products.ts:76`.
- **GP16 · P2 · Photos are hidden in a collapsed "Details & photos (Optional)" section.** Only 2 photos of 1 MB each are allowed. **Fix:** a large photo drop area in Basics; allow more and larger photos. **Where:** `ProductForm.tsx:948-957,1086-1156`, `lib/upload-validation.ts:2-3`.
- **GP17 · P2 · Lab data is entered twice (batch and product).** Picking a batch fills nothing. **Fix:** copy the batch's THC/CBD and harvest date into the product (shown "From batch"); picking a batch sets its strain. **Where:** `ProductForm.tsx:757-781,960-1061`, `BatchSelector.tsx:396-400`.
- **GP18 · P2 · Strain and batch pickers are plain dropdowns with no search, no load error and a contradictory empty message.** **Where:** `StrainSelector.tsx:38-56,112-132`, `BatchSelector.tsx:94-108,216,234-238`.
- **GP19 · P2 · Import units accept anything ("lbs", "1/8", "3.5g"), which then pollute the unit dropdown.** **Where:** `lib/product-payload.ts:11-35`, `lib/product-display.ts:5-8`.
- **GP20 · P2 · No single-product "Preview as buyer".** The preview shows only live items and has no search. **Fix:** a Preview button on Edit (including drafts). **Where:** `grower/marketplace/page.tsx:205`, `EditProductPageClient.tsx:70-92`.
- **GP21 · P2 · The Marketplace empty state says "No active listings yet… Add a product" even when products are only hidden.** **Fix:** "12 products are hidden or sold out — Review". **Where:** `grower/marketplace/page.tsx:264-281`.
- **GP22 · P3 · Stock and price are written differently in each view.** "12 In Stock", "12 grams", "Stock: 12 g"; "5 Lbs" vs "5 lb". (seen live) **Fix:** shared formatters. **Where:** `grower/products/page.tsx:290-299,321,396,447,453`.
- **GP23 · P3 · A Draft with 0 stock gets the red "Out of stock" style.** **Where:** `grower/products/page.tsx:272-281,435-442`.
- **GP24 · P3 · Duplicate appends " Copy" and shares the new-product draft slot.** **Where:** `lib/product-copy.ts:5`, `ProductForm.tsx:318`.
- **GP25 · P3 · Server errors are joined into one line and only the first field is highlighted.** **Where:** `api/products/[id]/route.ts:107`, `ProductForm.tsx:384-387`.
- **GP26 · P3 · Bulk results show at the top while the action bar is at the bottom; pagination is only above the list.** **Where:** `grower/products/page.tsx:1299-1312,1517`.
- **GP27 · P3 · Add and Edit pages don't match (back link, loading and error styles; no Delete, Duplicate or Preview on Edit).** **Where:** `grower/products/add/page.tsx:104-116`, `EditProductPageClient.tsx:72-82`.
- **GP28 · P3 · The preview invents "Hybrid" when the strain type is unknown.** **Where:** `grower/marketplace/page.tsx:45-55`.

### 3.9 Grower: CSV import

- **GI1 · P1 · Numbers are silently corrupted.** `"1,200"` becomes 1, `"100.5"` becomes 100, `"10 lbs"` becomes 10, and `"$45.00"` is rejected with a misleading message. **Fix:** strip `$`, commas and unit words; reject partial parses with "Price must be a number like 45.00". **Where:** `lib/product-payload.ts:69-83`, `lib/product-import.ts:222-243`.
- **GI2 · P1 · One bad row blocks the whole file, and re-imports create duplicates.** The Import button also stays live after success. **Fix:** "Import 48 good rows, skip 2", download the failed rows with an error column, match by SKU then name to update, show "Create 10 · Update 38", and reset the dialog after success. **Where:** `ProductCsvImportDialog.tsx:24-38`, `api/products/bulk/route.ts:72-117`.
- **GI3 · P1 · Unknown product types are accepted, so imported listings drop out of buyer filters.** **Fix:** reject them with the list of valid types. **Where:** `lib/product-import.ts:198`.
- **GI4 · P2 · Template headers are developer names (`inventoryQty`, `isPriceVisible`), and common headers aren't recognised.** **Fix:** plain headers (Name, Type, Price, Stock, Unit, Show price yes/no), more aliases, default Unit and Stock. **Where:** `lib/product-import.ts:37-70,276-280`.
- **GI5 · P2 · Error text has a meaningless prefix ("Enter: Enter a price…"), and row numbers shift.** **Where:** `lib/product-import.ts:244-252`, `api/products/bulk/route.ts:67`.
- **GI6 · P2 · A failed check shows "undefined ready · undefined errors"; a network failure leaves "Validating…" stuck.** **Where:** `ProductCsvImportDialog.tsx:18-38`.
- **GI7 · P2 · Valid `.csv` files are rejected by MIME type; Excel files and semicolon or tab separators aren't supported.** **Fix:** trust the extension and check the content; accept `.xlsx`; detect the delimiter. **Where:** `lib/upload-validation.ts:97-105,161-168`, `lib/product-import.ts:115-157`.
- **GI8 · P2 · Import is locked on Free with a lock icon and a modal saying so.** (seen live) **Fix:** show the plan note on the button's hover or tap state, or allow a small free import (e.g. 25 rows) so growers can try it. **Where:** `grower/products/page.tsx`, `lib/plans.ts`.
- **GI9 · P3 · Import can't set THC ranges, batch or draft status; strain names are matched case-sensitively.** **Where:** `lib/product-import.ts:89-96,234-240`, `api/products/bulk/route.ts:85-93`.

### 3.10 Grower: strains, batches and lab documents

- **GS1 · P2 · Strain type is required in the UI but optional in the API.** **Fix:** make it optional, or default to Hybrid. **Where:** `grower/strains/add/page.tsx:46,131-146`, `strains/[id]/edit/page.tsx:87`, `StrainSelector.tsx:67,185`.
- **GS2 · P2 · The batch number isn't prefilled.** The hint shows a stale date, and "Generate" on Edit can overwrite a real compliance number. **Fix:** prefill on Add; remove Generate from Edit. **Where:** `grower/batches/add/page.tsx:54,200-213`, `batches/[id]/edit/page.tsx:243-245`. **Saves:** 1 tap or field.
- **GS3 · P2 · Add batch ignores the strain you came from; strain rows have no "Add batch".** **Fix:** `?strainId=` preselect and an "Add batch" row action. **Where:** `grower/batches/page.tsx:120`, `strains/page.tsx:205-219`, `batches/add/page.tsx:53-63`. **Saves:** 1 pick.
- **GS4 · P2 · No next step after saving a strain or batch.** The stored "newly created" IDs are never read. **Fix:** "Add a product from this batch" after saving, and preselect on return. **Where:** `strains/add/page.tsx:83-89`, `batches/add/page.tsx:140-146`.
- **GS5 · P2 · Three fixed PDF slots don't match how labs send reports.** Most labs send one combined COA; the 2 MB limit rejects scans; "1/3 lab docs" warns even when a full COA is uploaded. **Fix:** one "Full COA" slot that satisfies all three; a higher limit; upload progress and a "View" link. **Where:** `grower/components/BatchLabDocumentUploaders.tsx:20-24,95-97,131-139`, `lib/upload-validation.ts:6`, `lib/lab-reports.ts:1-6`, `batches/page.tsx:100,176-182`.
- **GS6 · P2 · Errors show at the top of the page, far from the uploader or field.** **Where:** `batches/add/page.tsx:184-189,329`, `batches/[id]/edit/page.tsx:228-232,394`, `strains/add/page.tsx:101-105`, `inventory/add/page.tsx:78-80`.
- **GS7 · P2 · Clicking outside the New-batch or CSV dialog discards everything.** **Fix:** ignore backdrop clicks when the form has changes. **Where:** `BatchSelector.tsx:243-245`, `components/ui/Modal.tsx`.
- **GS8 · P2 · Strain, batch and stock forms have no unsaved guard, and Cancel ignores where you came from.** **Where:** `strains/add/page.tsx:210`, `strains/[id]/edit/page.tsx:263`, `batches/add/page.tsx:354`, `batches/[id]/edit/page.tsx:419`.
- **GS9 · P2 · Deleting a used strain or batch fails only after you confirm.** **Fix:** when it's in use, show "Used by 4 products — View" instead of Delete. **Where:** `strains/page.tsx:310-323`, `batches/page.tsx:285-298`.
- **GS10 · P3 · Terpene fields differ across the three batch forms; the THC/CBD/Total grid is 3 columns on phones.** **Fix:** one shared batch form, and `grid-cols-1 sm:grid-cols-3`. **Where:** `batches/add/page.tsx:271`, `batches/[id]/edit/page.tsx:313,367-388`, `BatchSelector.tsx:345,361-369`.
- **GS11 · P3 · Strain and batch lists have no search; "Strain not found" is shown for any server error.** **Where:** `strains/page.tsx:96-106`, `batches/page.tsx:102-111`, `strains/[id]/edit/page.tsx:67-72`.
- **GS12 · P3 · Inventory +/− saves and toasts on every tap (10 taps = 10 toasts); quantity is shown twice.** **Fix:** debounce about 600 ms and show a single toast. **Where:** `InventoryClient.tsx:146-179,346,358-363`.

### 3.11 Grower: reports

- **GRp1 · P2 · The export isn't usable for bookkeeping.** It holds a summary, the top 5 and the 10 most recent orders. **Fix:** export every order line in the selected range, plus a summary. **Where:** `grower/reports/ReportsExportActions.tsx`, `grower/reports/page.tsx`.
- **GRp2 · P2 · Range chips are abbreviated ("30d / 90d / 12mo / All") and there is no custom range.** **Where:** `grower/reports/page.tsx:182`.
- **GRp3 · P2 · Desktop report rows don't link to the order (mobile rows do).** **Where:** `grower/reports/page.tsx:450-455`.
- **GRp4 · P3 · Truncated IDs; top lists capped at 5 with no "Show all"; export buttons read "PDF" and "CSV" at 12px.** **Where:** `grower/reports/page.tsx`, `ReportsExportActions.tsx`.

### 3.12 Grower: settings, order terms and billing

- **GB1 · P1 · Changing the license silently unlists the grower.** **Fix:** an inline warning while those fields are edited ("Saving pauses your listings until the new license is verified"), then a status banner. **Where:** `lib/profile-settings.ts:61-62`, `grower/settings/components/SettingsForm.tsx`.
- **GB2 · P1 · An expired license date blocks saving any other profile field.** **Fix:** validate the license only when license fields change. **Where:** `SettingsForm.tsx:83-89`.
- **GB3 · P1 · No confirmation after Stripe checkout.** `?subscription=success` and `?subscription=cancelled` are ignored. **Fix:** a success toast plus an "Activating your plan…" state (poll until active), or "Checkout cancelled — no charge made". **Where:** `grower/settings/page.tsx`, `components/settings/SubscriptionBilling.tsx`, `lib/subscription-checkout.ts`.
- **GB4 · P1 · Trialing and past-due both show "Inactive".** **Fix:** "Trial — ends {date}", "Payment failed — update card" (linking to the billing portal), "Ends {date}". **Where:** `components/settings/SubscriptionBilling.tsx`.
- **GB5 · P1 · The plans page shows "Current plan: Free" to paying users when the fetch fails.** **Fix:** an error state with Retry. **Where:** `grower/pricing/PricingPlans.tsx`.
- **GB6 · P2 · Three save models on one page.** Profile has "Save profile", the logo saves immediately, and terms have "Save terms" at the top of their panel, so the header has to explain all three. **Fix:** one sticky "Save changes" bar for profile and terms. **Where:** `SettingsForm.tsx:367`, `CommercialTermsPanel.tsx`.
- **GB7 · P2 · Order terms are free text prefilled with defaults that look saved.** "No minimum set", "Handled directly"… **Fix:** pickers (payment terms select, minimum as a number, delivery checkboxes), with defaults shown as placeholders. **Where:** `components/settings/CommercialTermsPanel.tsx`, `lib/ux-workflow.ts`, `lib/order-workflow.ts`.
- **GB8 · P2 · "Reset defaults" wipes the terms instantly; the terms Save sits only at the top.** **Where:** `CommercialTermsPanel.tsx:90-93`.
- **GB9 · P2 · Address autocomplete hides city, state and ZIP behind "Includes city, state and ZIP."** **Fix:** always show the editable fields. **Where:** `grower/settings/components/SettingsForm.tsx`, `components/ui/AddressAutocomplete.tsx`.
- **GB10 · P2 · The read-only email looks like a required input.** **Fix:** plain text plus "Change email". **Where:** `SettingsForm.tsx:467-493`.
- **GB11 · P2 · No clear change-plan or cancel path, and the plans page isn't linked from nav or Subscription.** **Fix:** "Change plan" (to `/grower/pricing`), "Cancel subscription" (billing portal), and the renewal date. **Where:** `SubscriptionBilling.tsx`, `app/grower/layout.tsx`.
- **GB12 · P2 · Plan features are collapsed and the lists differ between pages; "billed annually" is advertised with no annual option.** **Fix:** read from `lib/plans.ts` in both places. **Where:** `SubscriptionBilling.tsx`, `PricingPlans.tsx`, `lib/plans.ts`.
- **GB13 · P3 · The Free card says "Manage billing"; "Contact sales" is a bare mailto; there is a redundant `'Free plan' : 'Free plan'`.** **Where:** `PricingPlans.tsx`, `SubscriptionBilling.tsx`.
- **GB14 · P3 · Title Case and asterisk-heavy labels.** **Fix:** sentence case, and mark only the optional fields. **Where:** `grower/customers/add/page.tsx`, `SettingsForm.tsx`.

### 3.13 Messaging and offers (both roles)

- **M1 · P1 · Growers can't send a quote from an order or customer conversation.** They see "Open a product listing to quote" with a link to Products (a dead end). **Fix:** a product picker inside the quote form, defaulting to the order's items. **Where:** `components/messaging/ChatDrawer.tsx:976-990,1009-1015`, `MessageBuyerButton.tsx`. **Saves:** about 4 taps and 2 hops per offer.
- **M2 · P2 · The quote action is two levels deep ("Quote" › "Create quote"); growers see the buyer action "Request pricing".** **Fix:** a primary "Send quote" button for growers and "Ask for a price" / "Make an offer" for buyers. **Where:** `ChatDrawer.tsx:1009-1015`.
- **M3 · P2 · Offer buttons are 32px with 12px text; counter inputs are `py-1 text-xs`.** **Fix:** 44px buttons and 14px `inputMode="decimal"` inputs. **Where:** `ChatDrawer.tsx:646-721`.
- **M4 · P2 · For buyers, accepting then adding to cart takes two small taps and overwrites the cart quantity.** **Fix:** one "Accept & add to cart" that merges, or asks before replacing. **Where:** `ChatDrawer.tsx:642-679` (`addAcceptedQuoteToDraft`). **Saves:** 1 tap.
- **M5 · P2 · Declining an offer is instant with no undo.** **Where:** `ChatDrawer.tsx:648-679`.
- **M6 · P2 · An accepted quote can't become an order on the grower side.** **Fix:** "Create order from quote", prefilling the manual order. **Where:** `ChatDrawer.tsx`, `grower/orders/add/page.tsx`. **Saves:** full order entry.
- **M7 · P2 · "Message buyer" and "Ask to cancel" only create drafts, announced by a toast.** Buyers think they cancelled. **Fix:** open the drawer focused on the draft with Send highlighted, or send the cancel request directly with an optional reason. **Where:** `MessageBuyerButton.tsx`, `dispensary/orders/[id]/OrderDetailActions.tsx:67`.
- **M8 · P2 · No "New message", search or context links.** The empty state tells growers "Choose Message grower on a product…". **Fix:** role-aware empty copy, a "New message" picker, conversation search, and thread header links to the shop or product. **Where:** `ChatDrawer.tsx:819-823`, thread header.
- **M9 · P3 · With one conversation the drawer still says "Choose a conversation"; "Messages" is shown as two headings.** (seen live, `messages-drawer-choose-conversation.png`) **Fix:** auto-open the latest unread thread; one heading. **Where:** `ChatDrawer.tsx`.

### 3.14 Dispensary: license onboarding and settings

- **B1 · P1 · The pending-license send ends on a stuck "Confirm your request / Check request" screen.** It survives reloads (stored in `localStorage`) and has no link to the license. The 403 is treated as an uncertain submission. (seen live, `pending-buyer-send-confusing-recovery.png`) **Fix:** treat `LICENSE_NOT_VERIFIED`/`LICENSE_EXPIRED` as final; clear the pending submission, restore the cart, and show "Your license is still being reviewed — [Check status]". **Where:** `dispensary/cart/page.tsx:501-504,586-604`, `api/checkout/route.ts:206-212`.
- **B2 · P1 · Nothing warns pending buyers that ordering is locked until the final click.** (seen live, `pending-buyer-cart-no-warning.png`) **Fix:** a banner in the catalog, cart and review ("You can send orders once your license is approved — we'll keep your cart") and a disabled Send with that reason. **Where:** `dispensary/cart/page.tsx` (header, review modal), `dispensary/layout.tsx`, `dispensary/catalog/CatalogContent.tsx`.
- **B3 · P1 · After submitting a license, the dashboard still says "License verification needed / Review →".** Settings says "Complete the required license fields below". **Fix:** a "Submitted — under review (usually 1–2 business days)" state with no call to action. **Where:** `dispensary/dashboard/page.tsx:294`, `dispensary/settings/components/SettingsForm.tsx:431-455`.
- **B4 · P1 · Broken `#license` anchors.** The expiry notification and the dashboard license card link to `#license`, but the section is `#license-verification`. (confirmed in code) **Where:** `dispensary/dashboard/page.tsx:198`, `dispensary/dashboard/LicenseVerificationCard.tsx:44`.
- **B5 · P1 · The license card's "Send for review" spinner hangs forever on a network error.** **Fix:** try/catch with "Couldn't send — check your connection and try again." **Where:** `LicenseVerificationCard.tsx`.
- **B6 · P1 · Changing the license number silently re-locks ordering.** **Fix:** an inline notice while editing it. **Where:** `lib/profile-settings.ts:67`, `SettingsForm.tsx` (~470-530).
- **B7 · P2 · The State select has one option (VT) but is still required; expiry is "(recommended)" in Settings but required on the dashboard card.** **Fix:** show "Vermont" as text and make the required fields agree. **Where:** `SettingsForm.tsx:504-506`, `LicenseVerificationCard.tsx`. **Saves:** 1 field.
- **B8 · P2 · The setup checklist and settings disagree on what's required.** The "Cart" step completes on any active order, and there are no deep links. **Where:** `dispensary/dashboard/page.tsx:203,229-234`.
- **B9 · P2 · Settings don't hold order defaults.** Fulfillment, payment terms and window live only in `localStorage` and are lost on another device. **Fix:** "Order defaults" in Settings that prefill the cart. **Where:** `lib/ux-workflow.ts` (REQUEST_DEFAULTS_STORAGE_KEY), `dispensary/cart/page.tsx:646-652`, `SettingsForm.tsx`.
- **B10 · P2 · Address autocomplete only fills city, state and ZIP from a picked suggestion; it has no combobox semantics and fails silently.** **Fix:** accept typed addresses, show the parsed fields, "No address found — type it", and ARIA combobox. **Where:** `SettingsForm.tsx:663`, `components/ui/AddressAutocomplete.tsx:84-236`.
- **B11 · P3 · Esc in Settings discards changes through `window.confirm`.** (See X18.)

### 3.15 Dispensary: catalog, search, filters and grower shop

- **BC1 · P1 · No product detail view.** Cards and titles aren't clickable, and the image hover-zoom does nothing on touch. (seen live) **Fix:** tapping the image or title opens a product sheet (photos, description, lab results, grower terms, quantity, Add to cart), deep-linkable from search. **Where:** `dispensary/catalog/CatalogContent.tsx:2081-2145`, `api/search/route.ts:207`.
- **BC2 · P1 · Search misses typos and multi-word queries.** "blu drem" returns 0 results (seen live). **Fix:** split into words (AND across fields), `pg_trgm` similarity fallback, and a "Did you mean…" empty state with popular items. **Where:** `lib/buyer-catalog.ts:31-35`, `api/dispensary/search-suggestions/route.ts`, `CatalogContent.tsx:1447-1455`.
- **BC3 · P1 · Quantity boxes can't be cleared and silently clamp to stock.** **Fix:** see X17, plus "Only N available — set to N". **Where:** `AddToCartButton.tsx:123`, `dispensary/cart/page.tsx:786`.
- **BC4 · P2 · No "View cart" after adding.** The button flashes "Added" for 2 seconds and the quantity resets to 1. **Fix:** a toast "Added 10 × Gelato — View cart · Undo", keeping the chosen quantity. **Where:** `AddToCartButton.tsx:58-60`. **Saves:** 1 tap.
- **BC5 · P2 · List view, compare and favorites list can only add 1 unit.** **Fix:** a compact stepper, or remember the last ordered quantity. **Where:** `AddToCartButton.tsx:71`, `CatalogContent.tsx:2301`, `favorites/FavoritesContent.tsx`.
- **BC6 · P2 · Desktop filters start hidden, and filters, sort and view aren't remembered.** **Fix:** open by default on large screens; remember them per user. **Where:** `CatalogContent.tsx:260-261,392-402,1209`. **Saves:** 1 tap per visit, plus re-picking.
- **BC7 · P2 · The default sort is "By grower".** **Fix:** Relevance when searching, otherwise Newest. **Where:** `CatalogContent.tsx:110,1366-1370`.
- **BC8 · P2 · Search suggestions only fill the text.** **Fix:** grower suggestion → shop; product suggestion → product sheet. **Where:** `CatalogContent.tsx:558-575,1038`. **Saves:** 1–2 taps.
- **BC9 · P2 · Search needs Enter ("Press Enter to search.").** **Fix:** debounced live results. **Where:** `CatalogContent.tsx:1044`.
- **BC10 · P2 · The mobile filter sheet throws away changes on backdrop tap or swipe, and has no live count.** **Fix:** apply on close; "Show 42 products". **Where:** `dispensary/catalog/components/MobileFilterSheet.tsx:70-83,113`.
- **BC11 · P2 · Filters don't fit wholesale.** Price buckets mix grams and pounds; there is no strain type, grower, in-stock or has-lab-results filter. **Where:** `lib/catalog-filters.ts`, `CatalogContent.tsx`.
- **BC12 · P2 · Compare silently drops the oldest item; the compare bar overlaps content.** **Where:** `CatalogContent.tsx:447-449,1395`.
- **BC13 · P2 · Lab reports have no heading or empty state, and they download instead of opening.** **Fix:** a "Lab results" heading, open in a new tab, "No lab results — Ask grower". **Where:** `components/LabReportDownloads.tsx`, `dispensary/components/LabReportDownloads.tsx`.
- **BC14 · P2 · The grower shop lacks catalog actions.** No favorite, alert or compare; placeholder images in the cart; state not in the URL. **Fix:** reuse the catalog card. **Where:** `dispensary/grower/[id]/GrowerShopContent.tsx:378,474`.
- **BC15 · P2 · Grower shop terms are collapsed at the bottom; the phone isn't `tel:`; there is no header "Message grower".** **Where:** `dispensary/grower/[id]/page.tsx:153-158,191-202`.
- **BC16 · P2 · Sync errors ("could not be saved") have no Retry and sit at the page bottom.** **Where:** `dispensary/hooks/useBuyerCollection.ts`, `CatalogContent.tsx:1550`.
- **BC17 · P3 · Card clutter.** A repeated "Strain: Gelato" when the name has it; an unexplained green check icon; unlabeled heart and bell icons; tiny type label. (seen live) **Fix:** drop the redundant strain line; give icons tooltips or text on hover and tap; explain or remove the check. **Where:** `CatalogContent.tsx:2081-2145`.
- **BC18 · P3 · Icon-only favorite, alert and chip-remove buttons have only `title` or nothing.** **Fix:** `aria-label`. **Where:** `CatalogContent.tsx:2089-2123`, `GrowerShopContent.tsx:286,294`.
- **BC19 · P3 · Hover-only delete buttons are invisible on tablets.** **Where:** `CatalogContent.tsx:1232`, `FavoritesContent.tsx:327`.

### 3.16 Dispensary: cart and sending an order

- **BK1 · P1 · Problem lines aren't marked.** Out-of-stock and quote-only items look normal; the error is generic. **Fix:** a per-line pill ("Sold out", "Price on request") with Remove or Ask for price; scroll to the first. **Where:** `dispensary/cart/page.tsx:461-463,768-800`.
- **BK2 · P1 · "Remove item" doesn't remove the item (it only marks it unavailable, which still blocks sending).** **Where:** `dispensary/cart/page.tsx:429-437,698`.
- **BK3 · P1 · No delivery address in the order.** **Fix:** the profile address (prefilled, editable) in the order details and payload, shown to the grower. **Where:** `lib/order-workflow.ts:98-110` (`buildOrderRequestNotes`), `dispensary/cart/page.tsx`, `api/checkout/route.ts`. **Saves:** a message round trip per delivery order.
- **BK4 · P2 · The cart isn't grouped by grower.** No subtotal or minimum-order check, although orders split per grower. **Fix:** grower headers with subtotal, "Minimum $500 — add $120 more" and terms. **Where:** `dispensary/cart/page.tsx:768`.
- **BK5 · P2 · Review shows the grower's terms beside the buyer's differing choice.** (seen live: "Net 15" vs "Handled directly") **Fix:** default the buyer's choice to the grower's terms; flag only a real mismatch. **Where:** `dispensary/cart/page.tsx:994-996`.
- **BK6 · P2 · The success screen has no order numbers and auto-redirects after 5 seconds.** **Fix:** list the created orders with links and stay put. **Where:** `dispensary/cart/page.tsx:556-583`.
- **BK7 · P2 · The sticky mobile cart bar has no total.** (seen live, `cart-mobile.png`) **Fix:** "6 items · $4,320". **Where:** `dispensary/cart/page.tsx:1046-1067`.
- **BK8 · P2 · The cart change notice doesn't say what changed.** **Fix:** "Gelato: $12 → $14; OG Kush: only 3 left", with the lines highlighted. **Where:** `dispensary/cart/page.tsx` (revalidation notice).
- **BK9 · P2 · Payment terms mix when and how.** "Handled directly / Net 15 / Net 30 / ACH / Check / COD"; fulfillment has both "Flexible" and "Coordinate with grower". **Fix:** offer what the grower accepts; merge the duplicates. **Where:** `lib/ux-workflow.ts` (PAYMENT_TERMS_OPTIONS).
- **BK10 · P2 · The cart lives only in the browser (`localStorage`).** A cart built on the office PC is missing on the phone. (seen live: a new session showed an empty cart) **Fix:** save the cart on the account. **Where:** `lib/cart.ts:47-60`.
- **BK11 · P2 · Cart lines from suggestions, reorder and quotes show placeholder images; unit prices are unformatted ("$12.5").** **Where:** `dispensary/cart/page.tsx:408-420,776`, `OrderDetailActions.tsx:117-135`, `ChatDrawer.tsx`.
- **BK12 · P3 · "−" is active at quantity 1 and does nothing; the review modal close is a text "✕"; long product-type labels are clipped on mobile ("CARTRIDGI").** (seen live) **Where:** `dispensary/cart/page.tsx`.

### 3.17 Dispensary: orders, tracking, reorder, saved items and alerts

- **BO1 · P2 · Reorder only works on delivered orders and is buried.** Missing items are dropped silently. **Fix:** Reorder on any past order, on list rows, "Recently requested" and Saved → Recent, with "Added 5 of 6 — 1 sold out · View cart". **Where:** `dispensary/orders/[id]/OrderDetailActions.tsx:41,117-135,186`, `components/OrdersTable.tsx`, `dispensary/dashboard/page.tsx:377-388`, `dispensary/saved/SavedContent.tsx:147-151`. **Saves:** 1 hop and 1–2 taps per reorder.
- **BO2 · P2 · The order-list filter needs a "Filter" submit, and sorting only covers the current page.** **Where:** `dispensary/orders/page.tsx:102-106`, `components/OrdersTable.tsx`.
- **BO3 · P2 · Order rows don't say what was ordered.** **Fix:** "Gelato × 10 lb + 2 more". **Where:** `components/OrdersTable.tsx` (mobile cards).
- **BO4 · P2 · The timeline and history are collapsed on order detail.** **Fix:** a compact status stepper shown by default. **Where:** `dispensary/orders/[id]/page.tsx:189-203`. **Saves:** 1 tap per check.
- **BO5 · P2 · Order detail items don't link to the product or "Buy again".** **Where:** `dispensary/orders/[id]/page.tsx`.
- **BO6 · P2 · Saved → Recent is a dead end ("Find product" re-searches the catalog).** **Fix:** Add to cart or Reorder in place. **Where:** `SavedContent.tsx:147-151`.
- **BO7 · P2 · Price alerts can't be edited on the Alerts tab, link to the grower instead of the product, and offer Add to cart only when triggered.** **Where:** `dispensary/price-alerts/PriceAlertsContent.tsx:270,328`.
- **BO8 · P2 · Price alerts only refresh when the buyer opens the portal.** **Fix:** check on grower price change and notify. **Where:** `CatalogContent.tsx:1655`, `PriceAlertsContent.tsx:128,173`.
- **BO9 · P2 · Nested tabs (Saved › Alerts › Active/Triggered/All); "Mark as seen" looks like re-arming the alert.** **Fix:** one list with "Price dropped" first and "Dismiss". **Where:** `PriceAlertsContent.tsx:100-107,152-167`.
- **BO10 · P3 · The unread dot is 2px; Saved tab counts go stale; favorites default view differs from the catalog.** **Where:** `components/OrdersTable.tsx:262,348`, `dispensary/saved/page.tsx`, `FavoritesContent.tsx`.
- **BO11 · P3 · Withdraw copy is technical ("…releases the reserved stock"); "Buyer actions" is internal wording.** **Where:** `OrderDetailActions.tsx`, `dispensary/orders/[id]/page.tsx`.

### 3.18 Admin: verification and user management

- **AD1 · P1 · The dashboard "Verify" is broken.** It posts an empty form and lands on a raw `{"status":400,"error":"Refresh this page before changing verification."}` page; the confirm is a red danger button with a warning icon. (seen live, `admin-dashboard-verify-raw-json-error.png`, `admin-verify-dialog-red-warning.png`) **Fix:** pass `actionUrl` and `actionBody` like the list pages do; delete the form-submit branch; use a positive style. **Where:** `admin/dashboard/page.tsx:49-72,319-327`, `admin/components/ConfirmActionButton.tsx:40-46,99`, `components/ui/ConfirmDialog.tsx:71-73`.
- **AD2 · P1 · The "awaiting review" list includes grower-managed off-platform customers.** (seen live: "Phone-in Pharmacy · No email · Verify") **Fix:** add `isOffPlatform: false`. **Where:** `admin/dashboard/page.tsx:47`.
- **AD3 · P1 · No way to decline or ask for changes.** The model and the dispensary UI expect `rejected` plus notes. **Fix:** "Decline" with a reason picker and note, plus a notification; the same for growers. **Where:** `admin/dispensaries/page.tsx:186-202,241-250`, `admin/growers/page.tsx`, `lib/admin-verification.ts:32-35`.
- **AD4 · P1 · The admin can't really check a license.** There is no detail view, and state, address, contact, phone and registry lookup are all missing. **Fix:** a review drawer or page with all fields, a "Look up in state registry" link, and Verify/Decline. **Where:** `admin/growers/page.tsx:170-279`, `admin/dispensaries/page.tsx:168-204`.
- **AD5 · P1 · Users is read-only.** There is no password reset, resend verification, suspend or sign-out-everywhere, and email verification isn't shown. **Fix:** a row menu with those actions and a "Not verified" badge. **Where:** `admin/users/page.tsx:188-204,296-354`.
- **AD6 · P2 · Approving needs a confirm and there is no bulk action; the queue is split across two pages and isn't filtered to Pending by default.** **Fix:** one "Review queue" (Pending, oldest first); one-click Verify with Undo; "Verify selected (n)"; a nav badge. **Where:** `admin/growers/page.tsx:193-277`, `admin/dispensaries/page.tsx:193-292`, `admin/dashboard/page.tsx:145-168`, `admin/layout.tsx:27-33`. **Saves:** 1 tap per approval, about 2N−2 with bulk, plus 1–3 navigation taps.
- **AD7 · P2 · At 1280px the dispensary table's Verify column is off-screen (horizontal scroll).** (seen live, `admin-dispensaries-actions-offscreen.png`) Breakpoints differ between admin pages and the other portals. **Fix:** drop the duplicate "Ordering" column, put actions first or sticky, and use the same breakpoints everywhere. **Where:** `admin/dispensaries/page.tsx:168-273`, `admin/growers/page.tsx:170,207`, `admin/users/page.tsx:298,315`, `admin/layout.tsx:39,58`.
- **AD8 · P2 · The status filter needs a "Search" click.** **Fix:** instant chips, like Users. **Where:** `admin/components/AdminVerificationFilters.tsx:36-46,77-89`. **Saves:** 1 tap per filter change.
- **AD9 · P2 · Verify is offered on expired or incomplete licenses, then fails with a 409 toast.** **Fix:** "Expired — ask for an updated license" with a prefilled Decline; a "Missing number" chip. **Where:** `lib/admin-verification.ts:23-25`, `admin/growers/page.tsx:190-202`, `admin/components/LicenseExpiryBadge.tsx`.
- **AD10 · P2 · Re-reviews look like new signups (no "License changed from X to Y").** **Where:** `lib/profile-settings.ts:61-67`, `admin/dashboard/page.tsx:313`.
- **AD11 · P2 · Admins get no notifications and have no global search.** **Fix:** notify on new pending accounts and license changes; add an admin search scope (email, business, license #). **Where:** `lib/notifications.ts:60-69`, `components/ui/PortalDesktopHeader.tsx:10-13`, `api/search/route.ts:31,149`.
- **AD12 · P2 · Status and Ordering columns can disagree.** **Fix:** one status ("Approved — can order", "Waiting for review", "Declined", "Expired"). **Where:** `admin/dispensaries/page.tsx:178-185,255-273`.
- **AD13 · P2 · Search placeholders don't match what's searched; Users doesn't search the person's name.** **Where:** `admin/users/page.tsx:176-184,231`, `AdminVerificationFilters.tsx:63`.
- **AD14 · P2 · The empty-state "Add a grower" sends the signed-in admin to public sign-up.** **Fix:** "Copy sign-up link". **Where:** `admin/growers/page.tsx:158-165`, `admin/dispensaries/page.tsx:156-163`.
- **AD15 · P2 · The seed-data button depends on environment guessing and is visible on every Vercel preview.** **Fix:** require `ENABLE_DEMO_SEED=true` and a non-production DB host, or move it to a CLI. **Where:** `admin/dashboard/page.tsx:106-107,337-354`, `api/admin/seed/route.ts`, `admin/components/SeedDataButton.tsx`.
- **AD16 · P3 · Verify conflicts (409) after unrelated profile edits cost extra taps.** **Where:** `lib/admin-verification.ts:29-31`.
- **AD17 · P3 · "Expired first" sorting is per page; the queue should be oldest pending first.** **Where:** `admin/growers/page.tsx:106-110`, `admin/dispensaries/page.tsx:105-109`.
- **AD18 · P3 · The expiry badge and the filter use different day math.** **Where:** `admin/components/LicenseExpiryBadge.tsx:13-34`, `lib/license.ts`.
- **AD19 · P3 · StatCard drops icons when linked; "Account settings" goes to system settings; the "Open developer tools" link is dead.** **Where:** `components/ui/StatCard.tsx:47-55`, `PortalDesktopHeader.tsx:9,15`, `admin/dashboard/page.tsx:137-143`.
- **AD20 · P3 · Admin settings shows a warning-coloured strip when everything is ready.** **Where:** `admin/settings/page.tsx:106-108`.

---

## 4. Remove or simplify

**Repeated disclaimers**
- **"Payment is arranged directly" appears about 12 times.** Keep one line in the buyer review modal and one on the grower order detail. Remove it from:
  - the orders list summary (`grower/orders/page.tsx:111`) and the second copy on order detail (`grower/orders/[id]/page.tsx:300,448`);
  - add order (`grower/orders/add/page.tsx:602`), the statement (`grower/customers/[id]/statement/page.tsx:40`) and Subscription (`SubscriptionBilling.tsx:148`);
  - the chat (`ChatDrawer.tsx:989`) and the cart header, terms and success copy (`dispensary/cart/page.tsx:876,1021,568`);
  - Help, 3 times (`help/page.tsx:29-32,55-58,168-172`);
  - admin settings (`admin/settings/page.tsx:93-98`);
  - the CSV "Settlement" column on every row (`StatementCsvExport.tsx`, `components/ui/OrderRecordExport.tsx`).
- **The license-review message appears 5+ times on the landing page.** Keep it in Getting started and the FAQ (`hero.tsx:272`, `feature-tour.tsx:50,187`, `getting-started.tsx:14,19`).
- **Six "Example/sample" notes in the landing demo.** Keep one "Sample data" tag (`hero.tsx:88,117,289-291`, `feature-tour.tsx:21,170,174`).

**Confirm dialogs that should be one tap plus Undo**
- Forward order steps: "Confirm: accept request" (`QuickStatusUpdate.tsx:76-81`).
- Admin Verify, everywhere (`admin/dashboard/page.tsx:320-327`, `admin/growers/page.tsx:193-277`, `admin/dispensaries/page.tsx:193-292`).
- Deleting products, customers, strains and batches; clearing favorites or alerts (see X15).
- "Remove item?" on edit order, which is only a local, unsaved change (`EditOrderForm.tsx:786-799`).
- The native `window.confirm` for unsaved changes (`useUnsavedChanges.ts:24`, `dispensary/settings/components/SettingsForm.tsx:370`).

**Redundant pages, steps and controls**
- **The grower Catalog hub page** (`grower/catalog/page.tsx`). It duplicates the Products filters.
- **Update stock page** (`grower/inventory/add/page.tsx`). Stock belongs in the Products list.
- **Three dashboard order lists.** Keep one (`ActivityFeed.tsx` and the request section of `GrowerAttentionPanel.tsx` duplicate `OverviewRequests.tsx`).
- **Duplicate stat cards.** The buyer Orders page repeats the dashboard stat cards (`dispensary/orders/page.tsx`), and the buyer dashboard shows 4 "No data yet" cards (`dispensary/dashboard/page.tsx:310-316`).
- **Status radios on Edit order** (`EditOrderForm.tsx:403-471`).
- **Quick add's second submit button** ("Create draft and add details") and its "Standard settings / Last listing settings" chips. The full form's "Use standard settings" means something different (`grower/products/page.tsx:1186-1294`, `ProductForm.tsx:673-696`).
- **Display menu (Cards/List × Comfortable/Compact) and table density controls.** Pick one good layout (`grower/products/page.tsx:1389-1464`, `OrdersList.tsx`).
- **Two selection bars on Products.** Keep the bottom bar (`grower/products/page.tsx:1468-1497`).
- **"More actions" modals for 2–3 actions.** Use a small menu (`grower/products/page.tsx:357-381,475-510`, `RecordActions.tsx`).
- **Fake step tabs in the cart** ("Items / Pickup & delivery / Terms") that only scroll, and the "Templates" menu (`dispensary/cart/page.tsx:641-652`).
- **Floating "Recent activity" button and drawer** (`components/ux/RecentActivityDrawer.tsx`).
- **Confirm-password fields** on sign-up and reset.
- **"Use a different email" button, and the permanent "Resend verification email" link on sign-in.**
- **Admin "Operations checklist"** (it repeats the same two links 2–3 times), the one-card support-email section, and the static "Policies" section (`admin/dashboard/page.tsx:214-275`, `admin/settings/page.tsx:131-173`).
- **Seed-data "Developer tools" section in the admin UI.**
- **The "Ordering" column** on admin dispensaries (it duplicates Status).
- **The "View" link on order rows** where the row is already a link (`OrdersList.tsx`, `components/OrdersTable.tsx`).
- **Search dialog extras:** the fake quick actions and the double ESC hints (`SearchDialog.tsx:279-283,351-353,483`).
- **Dead files:** see X25.

**Helper text to cut** (the UI should explain itself)
- **Products and product form**
  - "Reuse the type, price, unit, and price visibility from your last listing." (`ProductForm.tsx`)
  - "Choose whether buyers see a price or ask you for a quote."
  - "Buyers can request this product."
  - "0/2 image slots used."
  - "This draft is hidden from buyers…" plus "Hidden from buyers until published." (the same thing twice)
  - "Cannabinoids, harvest date, description and photos." plus the "Optional" pill
  - The dashed "Pick a strain to attach a batch" box, the "Choose type first" and "N/A" subtype boxes, and the section jump links on a short form.
- **BatchSelector** paragraph "Buyers see this batch's lab results when available… The product's harvest date is entered separately." (`BatchSelector.tsx:323,399`).
- **Strain "About strain types" section.** Also spell out "Sativa-dominant hybrid" instead of "Sativa Dom. Hybrid" (`strains/add/page.tsx:147-157`, `lib/strain-types.ts`).
- **Inventory:** "Stock value = list price × quantity on hand." and "Stock edits save automatically." (`InventoryClient.tsx:262,268`).
- **Settings**
  - Header "Unsaved profile changes — choose Save profile. Logo changes save immediately. Use Save terms…" (`SettingsForm.tsx:367`).
  - Triple unsaved indicators.
  - "Includes city, state and ZIP."
  - Terms footer "These are your usual terms…".
  - Dispensary license block (status label + "Requests unlock…" + "Requests locked" + "What to do next").
  - Triple save feedback.
- **Edit order:** tax helper "Optional tax: enter only the amount on your invoice. PhenoShop does not calculate tax." (use the label "Tax (optional)"). Show character counters only near the limit.
- **Catalog and saved items**
  - "Press Enter to search.", "End of results", "(sorted by …)" plus the "All Products" header.
  - "Prices are checked when you open Saved…"
  - "You can save up to 5 filters (N remaining)." (show only when reached)
  - "Find replies in Messages."
  - The "Active:" label plus a separate "Clear all filters".
- **Cart:** the review notice "We check stock when you send your request…", and the autosave banners (see X21).
- **Chat:** purpose chips ("Grower product conversation", "General conversation"), the empty-state tagline, the "Message ready. Review it in Messages, then send." toast, and the verbose accepted-quote text.
- **Toasts, loading and empty states:** "Please wait while we load this page."; "Getting the latest product details and stock levels."; "Pages you visit will appear here…"; the reports empty-state explanations and "← swipe →" hint.
- **Page subtitles that repeat the title:** "View grower licenses, access, and plans.", "View dispensary licenses and access.", "View accounts and verification.", "Manage your account and preferences", "Preview how your published products appear to buyers.", "Account access and marketplace operations.", "Requests, inventory, and your wholesale business at a glance."
- **Auth pages**
  - The desktop marketing side panels, and "Already registered? Sign in" shown twice.
  - Required asterisks on 6 of 7 fields (mark the one optional field instead).
  - "Your business license is reviewed separately."
  - "Use the password you chose for this account."
  - Hedged copy: "If we can send a link to this address, it should arrive…".
  - The contact intro, location card and routing note; the help support-card instructions.
- **Developer instructions shown to admins:** "Configure in Vercel Project Settings > Environment Variables, then redeploy." (`admin/settings/page.tsx:17,107`).

---

## 5. Suggested order of work (each batch is one PR)

1. **Broken-behaviour fixes (small, safe, high value).** Covers AD1, AD2, GC2, B4, B5, GO4, B1, BK2, GI1, GI6, A21, N4 (navigate before mark-read), GB3, GB5, M9. Mostly one-line or single-file fixes with Playwright checks.
2. **Account access flow.** Covers A1–A8, A10–A12, A16, A18, A19 (role cards, auto sign-in after verify and reset, distinct error messages, carried email, `callbackUrl`, visible Sign in).
3. **Shared UI foundation.** Covers X2–X6, X16, X19, X22 and N6 (type scale, border tokens, 44px targets, Button variants, placeholder colour, label wiring, toast settings). Lands before page work so later PRs inherit it.
4. **Resilience states.** Covers X10–X14 (error, loading and not-found files per portal; migrate to the shared empty, loading and error states).
5. **Form behaviour pattern.** Covers X1, X17, X18, A7, GS6, GS7, GS8, GM10 (enabled buttons with inline errors, forgiving number inputs, no Esc-to-leave, unsaved guards).
6. **Vocabulary and formats.** Covers X7–X9, GP22, GR16, GM12 (glossary, statuses, money, date and order-number formatters). Touches many files but is mechanical.
7. **Navigation restructure.** Covers N1, N2, N3, N5, X20, N8 (bottom tab bars, merged Products nav, remove Catalog hub and Recent-activity button, search scopes, badge rules).
8. **Grower first run and dashboard.** Covers GO1–GO3, GO5–GO11, B8.
9. **Grower order handling.** Covers GR1–GR15, GR17–GR20.
10. **Phone orders and customers.** Covers GM1–GM9, GM11, GC1, GC3–GC11, M6.
11. **Products list and form.** Covers GP1–GP21, GP23–GP28, GS12.
12. **CSV import.** Covers GI2–GI5, GI7–GI9.
13. **Strains, batches and lab documents.** Covers GS1–GS5, GS9–GS11.
14. **Buyer catalog and product detail.** Covers BC1–BC19.
15. **Buyer license gating, cart and sending.** Covers B2, B3, B6–B10, BK1, BK3–BK12.
16. **Buyer orders, reorder, saved items and alerts.** Covers BO1–BO11.
17. **Messaging and offers.** Covers M1–M5, M7, M8, GC4.
18. **Admin review and users.** Covers AD3–AD20.
19. **Grower settings, terms and billing.** Covers GB1, GB2, GB4, GB6–GB14.
20. **Reports and statements.** Covers GRp1–GRp4, GO8.
21. **Clutter removal pass.** Covers section 4, done after batches 7–19 so it deletes what's left rather than fighting new work.
22. **Public site, help and contact polish.** Covers A9, A13–A15, A17, A20, A22–A34, X23, X24, X25.

---

## 6. Counts by priority

| Priority | Count |
|---|---|
| P1 (blocks or confuses) | 52 |
| P2 (slows users down) | 159 |
| P3 (polish) | 59 |
| **Total items** | **270** |

These counts cover the numbered items in section 3. The "Remove or simplify" list in section 4 is extra: about 60 cuts, many of which overlap items in section 3.
