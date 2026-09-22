# PhenoFarm — Page-by-Page UI/UX Fix Prompts

**Date:** 2026-06-11
**How to use:** Each numbered section below is a self-contained prompt. Copy one section's fenced block into Codex and let it fix that page/popup, then move to the next. Sections are ordered roughly by user impact. Every prompt names the files involved so no extra discovery is needed.

**Paste this shared context at the top of any prompt if the agent seems lost:**

> PhenoFarm is a Next.js 16 (App Router) + Tailwind v4 + Prisma B2B cannabis marketplace at `/Users/sam/dev/phenofarm-mvp`. Three roles: admin, grower (cultivator), dispensary (buyer). Business rule: PhenoFarm never processes wholesale payments — buyers and growers settle directly; the only in-app payment is the cultivator subscription. Order statuses use friendly labels from `lib/order-workflow.ts` (Submitted/Accepted/Preparing/Ready/Delivered/Cancelled) — never raw enum names in UI. In-app pages are light-themed (gray-50 canvas, green-600 accent); the public landing is dark (#070908, emerald). Run `npm run verify` after changes; dev server: `npm run dev -- -p 3011` (demo logins: grower@vtnurseries.com / dispensary@greenvermont.com / admin@phenofarm.com, password `password123`).

---

## 0. Global design-system pass (do this first — it derisks every other prompt)

```
In the PhenoFarm app (Next.js + Tailwind, /Users/sam/dev/phenofarm-mvp), do a global in-app UI consistency pass. Do NOT touch app/landing/* (recently redesigned). Changes:

1. Create a shared `PageHeader` component (app/components/ui/PageHeader.tsx) with title, description, and an actions slot, and use it on every grower/dispensary/admin page. Today each page hand-rolls "text-2xl sm:text-3xl font-bold" headers with slightly different spacing.
2. Create a shared `StatCard` component and replace the hand-rolled stat cards duplicated on grower/dashboard, grower/orders, grower/customers, grower/inventory, grower/batches, grower/strains, dispensary/orders, dispensary/dashboard, and admin/dashboard. Keep the linkable variant used on grower/dashboard.
3. Replace ALL emoji used as UI iconography with lucide-react icons at consistent sizes: 🌿 placeholders (grower/marketplace, product cards), 📋✅📦🚚🎉❌ status icons (grower/orders/[id]/components/OrderStatusTimeline.tsx and orders/[id]/edit/components/EditOrderForm.tsx), 🌱 in dashboard welcome banners, 💰 anywhere it remains. Emoji renders inconsistently across platforms and clashes with the otherwise clean UI.
4. Normalize page padding: every portal page should rely on the layout's `p-4 md:p-5 lg:p-6 max-w-7xl` container with NO extra `p-4` on the page root (grower/inventory and grower/marketplace were fixed; audit the rest).
5. Fix pluralization helpers: "1 items" appears in dispensary catalog favorites chip and grower order edit summary ("Subtotal (1 items)"). Add a tiny `pluralize(count, noun)` util in lib/utils.ts and use it.
6. Ensure every interactive control has a visible focus-visible ring (green-600 based) — spot-fix any button/link missing it.
Run npm run verify when done.
```

---

# Public & auth pages

## 1. Contact page (`/contact`) — file: app/contact/page.tsx

```
Fix the PhenoFarm contact page (app/contact/page.tsx). It currently has FOUR serious problems:

1. The form is fake: handleSubmit does `setTimeout(1500)` + `console.log(formData)` and shows success without sending anything. Either (a) wire it to a new POST /api/contact route that emails/support-logs the message, or — simpler and acceptable — (b) replace the form with a polished "email us" card that opens `mailto:support@phenofarm.com` with subject/body prefilled from the fields. Do not show a fake success state.
2. The contact details are placeholder/wrong: "hello@phenofarm.io" (wrong domain — everywhere else uses support@phenofarm.com), "(555) 123-4567", and "San Francisco, CA" (the marketplace is Vermont-focused). Use support@phenofarm.com, drop the fake phone, and say "Vermont, USA".
3. Brand mismatch: the landing page (which links here via "Talk to us") is dark #070908/emerald; restyle this page with the same dark canvas, hairline white/[0.06] borders, and emerald accents so the transition isn't jarring.
4. "Business Type" select offers Grower/Dispensary/Other — fine, keep it, but it feeds nothing today; include it in the mailto/API payload.
Keep it a client component. Run npm run verify.
```

## 2. Sign-in page (`/auth/sign_in`) — file: app/auth/sign_in/page.tsx

```
Polish the PhenoFarm sign-in page (app/auth/sign_in/page.tsx):

1. Brand transition: users arrive from a dark emerald landing page onto a plain gray-50 card. Add a dark brand panel (left half on lg+, matching the landing's #070908 + emerald glow + PF logo) with the form on the right; keep the current single-column layout on mobile.
2. "Need password help?" is a button — verify what it does; if it only shows static text, convert it to a small disclosure that says password resets are handled by support@phenofarm.com (there is no reset flow yet). Don't leave a dead-feeling control.
3. Add a loading state to the Sign in button (spinner + disabled) while signIn() is in flight, and surface NextAuth errors with a specific message for bad credentials vs generic failure.
4. The demo-credentials box is intentional for this MVP — keep it, but restyle it as a collapsible "Demo access" disclosure so it doesn't dominate the page for real users.
5. Autofocus the email field on mount.
Run npm run verify.
```

## 3. Sign-up page (`/auth/sign_up`) — file: app/auth/sign_up/page.tsx

```
Improve the PhenoFarm sign-up flow (app/auth/sign_up/page.tsx). Registration works (POST /api/auth/register, auto sign-in). UX fixes:

1. Collapse the 3-step wizard: it currently splits 7 fields across 3 steps (Personal → Contact → Account) which adds friction for no benefit. Make it a single page with three visually grouped fieldsets, keeping the same fields and validation.
2. Business name is labeled "(Optional)" but it becomes the public marketplace identity (falls back to the person's name). Make the label "Business Name" with helper text "Shown to marketplace partners — defaults to your name if left blank".
3. Add a password confirmation inline-match indicator and a basic strength hint (length >= 6 enforced server-side today; mirror it client-side on blur).
4. After successful registration, dispensary accounts land on a dashboard where they cannot order until an admin verifies their license — but nothing tells them that at signup. Add a note under the business-type select when "Dispensary/Retailer" is chosen: "Dispensaries submit license details after signup; ordering unlocks once PhenoFarm verifies the license."
5. Match the dark brand-panel treatment applied to the sign-in page (see app/auth/sign_in/page.tsx) so the two auth pages look like siblings.
Run npm run verify.
```

## 4. Help, legal, and auth-error pages — files: app/help/page.tsx, app/legal/{privacy,terms,cookies}/page.tsx, app/auth/error/page.tsx

```
Flesh out PhenoFarm's thin support pages:

1. app/help/page.tsx is a single support-email card. Expand it into a real help center: three FAQ groups (For growers / For dispensaries / Account & billing), each with 3–4 collapsible <details> Q&As grounded in actual app behavior — how verification gates ordering, how order requests and quotes work, that settlement is direct and PhenoFarm never processes wholesale payments, how the cultivator subscription works, and how to reach support. Style it to match the dark landing (this page is linked from the landing footer).
2. app/legal/privacy, /terms, /cookies are ~21-line stubs. Give each a proper document layout: title, "Last updated" date, table-of-contents anchor list, and structured placeholder sections with honest MVP copy (data collected: account/business/license info, order request records; no wholesale payment data is processed). Keep a visible note that these are pre-launch drafts pending counsel review.
3. app/auth/error/page.tsx: map NextAuth error codes to friendly messages (CredentialsSignin → "Email or password is incorrect", default → generic), add a "Back to sign in" button, and style it consistently with the auth pages.
Run npm run verify.
```

## 5. Landing page follow-ups (`/`) — files: app/landing/*.tsx

```
Small follow-ups on the redesigned PhenoFarm landing (app/landing/, dark #070908/emerald theme — do not restyle it):

1. Mobile nav: the anchor links (Platform / How it works / Pricing) are hidden below md with no hamburger. Add a minimal mobile menu (slide-down panel under the fixed nav with the three anchors + Sign in), matching the dark theme.
2. Footer "Grower dashboard" / "Browse products" links point at authed routes that bounce to sign-in; point them to /auth/sign_up (growers) and /auth/sign_in instead so the redirect chain doesn't look broken.
3. The hero workspace mockup shows real-feeling status pills — keep — but the mockup's "Record Request" green chip looks clickable; add cursor-default and aria-hidden to the whole mockup so screen readers skip the fake UI.
4. The testimonials are fictional; add a subtle "Illustrative customer scenarios" microcopy line under the grid to stay honest pre-launch.
Run npm run verify.
```

---

# Shared components & popups

## 6. Global search dialog (⌘K) — file: app/components/SearchDialog.tsx

```
Improve PhenoFarm's global search dialog (app/components/SearchDialog.tsx, opened via ⌘K or the sidebar search button; results come from GET /api/search):

1. Add keyboard navigation: up/down arrows move an active-row highlight, Enter activates the row's primary action, and the footer hint row should read "↑↓ navigate · ↵ open · esc close".
2. Show a loading spinner row while the fetch is in flight and a "No results for 'x'" empty state with a suggestion to check spelling — today there's a blank gap between typing and results.
3. Each result renders several inline actions ("Edit listing", "Catalog"); make the whole row clickable for the primary action and move secondary actions to small icon buttons on the right so the hit target is obvious.
4. Remember the last 5 queries per role in localStorage and show them as tappable chips when the input is empty.
5. On mobile the trigger is icon-only; add aria-label="Search" (verify) and ensure the dialog is full-screen under 640px with a visible close button.
Run npm run verify.
```

## 7. Chat drawer (messages/quotes) — file: app/components/messaging/ChatDrawer.tsx

```
Polish PhenoFarm's ChatDrawer (app/components/messaging/ChatDrawer.tsx — the floating chat button + slide-over used by growers and dispensaries for messages and quote negotiation). Functional flows work; fix presentation and clarity:

1. Message list readability: add day separators ("Today", "Jun 10") and group consecutive messages from the same sender; right now every message renders a full standalone bubble and long threads are hard to scan.
2. The quote composer is toggled by a small icon button (data-testid="toggle-offer-composer") that buyers/growers don't discover. Give it a labeled button ("Send quote terms") next to the message input.
3. Quote message cards: the Accept / Counter / Reject buttons render equal weight; make Accept primary (emerald), Counter secondary, Reject text-level, and disable all three with a spinner while the offer-action request is in flight.
4. Empty states: when there are no conversations show a short explainer ("Conversations start from a product's Message Grower button") instead of an empty list; when a conversation has no messages, prompt with the quick-action chips.
5. The floating chat FAB overlaps sticky mobile action bars on form pages (grower/dispensary settings, cart). Hide the FAB (or shift it up) when a StickyMobileActionBar is present — check app/components/ux/StickyMobileActionBar.tsx and coordinate via a body class.
6. The context chip block at the top of a conversation (Order/Status/Grower) should render as small labeled pills rather than plain lines.
Run npm run verify and manually spot-check a grower↔dispensary conversation on localhost:3011.
```

## 8. Recent activity drawer — file: app/components/ux/RecentActivityDrawer.tsx

```
Fix PhenoFarm's RecentActivityDrawer (app/components/ux/RecentActivityDrawer.tsx — the "Recent" tab pinned bottom-right on grower/dispensary portals). Current output is low-quality:

1. Entries are not deduplicated — visiting grower orders 5 times shows "Grower orders" 5 times. Dedupe by page key, keeping the most recent timestamp, max 8 entries.
2. Label and time run together visually ("Grower orders9:43 AM") — lay each row out as label (left) + relative time (right, text-gray-400, e.g. "2m ago").
3. Entries aren't links — make each row navigate to its page.
4. Add a "Clear" text button in the drawer header.
5. Reconsider the trigger: a persistent "Recent" tab occupying screen edge real estate for an 8-item history is heavy. Make it a small clock icon button consistent with the chat FAB, positioned so the two never overlap.
Run npm run verify.
```

## 9. Mobile navigation drawers — files: app/grower/components/MobileNav.tsx, app/dispensary/_components/MobileNav.tsx, app/admin/layout.tsx

```
Consolidate and polish PhenoFarm's mobile navigation:

1. app/grower/components/MobileNav.tsx and app/dispensary/_components/MobileNav.tsx are near-identical hamburger drawers; the admin layout imports the grower one. Extract a single shared MobileNav in app/components/ui/ and have all three layouts use it (props: links with optional group/badge, portalLabel).
2. In the drawer, highlight the active route (compare with usePathname) — currently there's no current-page indication.
3. Ensure the drawer closes on route change and on backdrop tap, and that body scroll is locked while open.
4. Add the user's business name + role and a Sign out button at the drawer footer (dispensary/grower drawers lack a visible sign-out on mobile; only settings pages have one).
5. Add safe-area padding (env(safe-area-inset-bottom)) so the last item isn't clipped on iOS.
Run npm run verify and check at 375px width.
```

---

# Grower portal

## 10. Grower dashboard (`/grower/dashboard`) — files: app/grower/dashboard/page.tsx, ActivityFeed.tsx, app/components/ux/{SetupChecklist,GuidedFixPanel,RolePrimaryAction}.tsx

```
De-clutter the PhenoFarm grower dashboard (app/grower/dashboard/page.tsx). Data is correct; the problem is four stacked "what to do next" modules that repeat each other before any real data appears:

1. RolePrimaryAction ("Recommended next action"), SetupChecklist ("Get marketplace-ready faster"), GuidedFixPanel ("Unblock buyer readiness"), and the "Priority work" card all derive from the same signals. Merge into ONE "Setup & next steps" card: checklist rows with inline CTAs, plus a single highlighted primary action at top. GuidedFixPanel and the separate "Priority work" grid should disappear from this page (keep the shared components — other dashboards use them — just stop stacking all four here).
2. Once setup is complete (all checklist items done), collapse the setup card to a single "Setup complete" row so returning users see stats first.
3. The Activity Feed defaults to "Last 7 Days" and shows an empty state even when older requests exist; default to "Last 30 Days" and, if that's empty but all-time isn't, auto-fall back with a note ("Showing all time — nothing in the last 30 days").
4. The delivered-value bar chart is hand-rolled divs with a mobile "← swipe →" hint; keep the divs but add y-axis value labels (max/mid) and a proper aria-label; hide the swipe hint when there's no overflow.
5. Replace the 🌱 emoji in the welcome banner with a lucide Sprout icon.
Run npm run verify.
```

## 11. Product management (`/grower/products`) + Quick add + bulk bar — files: app/grower/products/page.tsx, components/{ProductCard,ProductTable,ProductActions,InventoryToggle}.tsx

```
Improve PhenoFarm's grower Product Management page (app/grower/products/page.tsx, 1300 lines):

1. CRITICAL clarity bug: products with isPriceVisible=false (buyers must request pricing) render an ordinary "$40.00" price on the grower's card/table with NO indication the price is hidden from buyers. Add a distinct "Quote only — price hidden from buyers" badge on card and table rows, and show it in the Quick add defaults line too.
2. The saved-view chips render count glued to label ("All3", "Missing price1") — add spacing and a small count pill. Also rename the "Missing price" view: it actually filters hidden-price products, so call it "Quote only".
3. The toolbar row (grouping tabs All/Product type/Strain/Batch + Density + Cards/List + Select visible) is one crowded strip. Reorganize: left = grouping tabs, right = a single "Display" popover containing density + view toggles; keep "Select visible" with the bulk actions.
4. Bulk cleanup: after selecting products, the available bulk actions should appear in a sticky action bar (count + Disable/Enable/Delete/Clear selection) — today discoverability is poor.
5. "Duplicate" gives no feedback; after duplicating, show a toast with an "Edit copy" link and scroll the new card into view.
6. Card action row (Edit/Disable/Duplicate/Delete) renders four equal buttons; make Edit primary, move Duplicate + Delete into a "⋯" overflow menu, keep Disable as a labeled toggle.
Run npm run verify.
```

## 12. Product add/edit form — files: app/grower/products/components/ProductForm.tsx, app/grower/components/{StrainSelector,BatchSelector,ProductTypeSelector}.tsx, app/api/product-type-config/route.ts

```
Improve PhenoFarm's guided product form (app/grower/products/components/ProductForm.tsx — used by /grower/products/add and /grower/products/[id]/edit). The step structure and autosave are good; fix:

1. Product Type only offers three options (Bulk Extract, Cartridge, Flower) because the grower's ProductTypeConfig seed is thin, while the dispensary catalog filter advertises 11 types (Edibles, Beverages, Preroll, Tincture, Topicals...). Seed/return the full default type list from /api/product-type-config so growers can actually list those categories, and keep custom types working.
2. The "Save Draft" button needs an explanation — add helper text under it ("Drafts stay on this device until you create the product") if that's how useLocalDraft works, or hide the button on edit mode where it's meaningless.
3. Batch link: the batch selector only appears after picking a strain — when no strain is selected show a disabled hint row "Pick a strain to attach a batch" instead of nothing, so the feature is discoverable.
4. Images step stores base64 into the DB — cap at 2 images with clear size copy, show upload progress, and render thumbnail previews with remove buttons (verify current behavior and fill gaps).
5. The sticky "Save summary" panel shows "Unnamed product / Not selected / Not priced" placeholders in muted text — good — but "Buyer visible" and "Pricing display: Price visible" duplicate each other; merge into one "Visibility" line ("Available · price visible" / "Available · quote only" / "Hidden").
6. On submit failure (validation or API), scroll to and focus the first invalid field; today errors can render off-screen on mobile.
Run npm run verify.
```

## 13. Inventory (`/grower/inventory` + `/grower/inventory/add`) — files: app/grower/inventory/page.tsx, app/grower/inventory/add/page.tsx

```
Streamline PhenoFarm's grower inventory pages:

1. /grower/inventory is a read-only table whose header says "Manage product stock" — add inline stock editing: a small stepper/input per row that PATCHes via POST /api/inventory (it sets absolute quantity), with optimistic update + undo toast. Keep the Edit link for full product editing.
2. With inline editing added, demote /grower/inventory/add ("Update Stock") to a secondary link and make the primary CTA "+ Add Product". If you keep the Update Stock page, add a searchable product select (type-ahead) instead of a plain dropdown.
3. Add low-stock emphasis: rows at/below 10 units already color the number red — also add a filter chip row (All / Low stock / Out of stock / Unavailable) above the table.
4. The three stat cards (Total Products / Total Value / Low Stock) should use the shared StatCard component (see global pass) and Total Value needs a tooltip: "List price × on-hand stock, including quote-only products".
Run npm run verify.
```

## 14. Marketplace preview (`/grower/marketplace`) — file: app/grower/marketplace/page.tsx

```
Rework PhenoFarm's grower Marketplace page (app/grower/marketplace/page.tsx). It currently duplicates the Products page with a weaker card grid:

1. Reframe it as a true "buyer preview": render each listing exactly the way the dispensary catalog card looks (borrow presentation from app/dispensary/catalog/CatalogContent.tsx card markup — THC/CBD chips, strain, unit/stock line, price OR "Request pricing" state) so growers see literally what buyers see. Add an explainer banner: "This is how your listings appear to verified dispensaries."
2. Replace the 🌿 emoji image placeholder block with the product's first image when present, else a neutral pattern placeholder.
3. "Manage Listing" on every card is heavy; use a subtle "Edit listing" text link and make the card itself non-interactive (it's a preview).
4. The four top stat tiles are fine but "Commercial terms" tile says "Use product descriptions for MOQ and availability notes" — stale: commercial terms now persist in grower settings (app/components/settings/CommercialTermsPanel.tsx + /api/grower/commercial-terms). Update the copy to point at Settings → Commercial terms and show the saved MOQ if present.
Run npm run verify.
```

## 15. Strains (`/grower/strains`, add, edit) — files: app/grower/strains/page.tsx, strains/add/page.tsx, strains/[id]/edit/page.tsx

```
Polish PhenoFarm's strain library pages:

1. On the strain card (app/grower/strains/page.tsx) a stray "Strain" label renders between the type badge and the batch/product counts — remove or replace it with the genetics line when present.
2. Card actions: Edit / + Product / Delete are equal-weight buttons; make Delete an icon button with the shared ConfirmDialog (verify it confirms — deleting a strain with linked products must be blocked server-side; surface that error nicely: "Remove or relink 3 products first").
3. Counts on cards ("0 batches / 0 products") should link: batches → /grower/batches filtered by strain, products → /grower/products?strain=... (add simple query-param filtering if missing).
4. Add/edit forms are solid; add a datalist of ~30 common strain names for the name field (autocomplete, still free text), and show the strain-type descriptions inline ("Sativa Dom. Hybrid" → tooltip with full wording).
5. Stat row should use the shared StatCard component.
Run npm run verify.
```

## 16. Batches (`/grower/batches`, add, edit) — files: app/grower/batches/page.tsx, batches/add/page.tsx, batches/[id]/edit/page.tsx, app/grower/components/BatchLabDocumentUploaders.tsx

```
Polish PhenoFarm's batch pages:

1. Stats: "Avg. THC N/A%" renders when there are no batches — show "—" (no unit) when there's no data.
2. The add/edit form is missing the lotNumber field that exists in the Prisma schema — add an optional "Lot Number" input next to Batch Number.
3. Harvest Date allows future dates; set max to today and validate.
4. Batch Number: add helper text with the expected format and a "suggest" button that generates e.g. BATCH-YYYYMMDD-XX based on existing batches.
5. Lab document uploaders (BatchLabDocumentUploaders.tsx) are three separate cards — good structure; add per-file state chips (Uploaded ✓ with filename / Replace / Remove) and show a single summary line on the batches list card ("3/3 lab docs") so growers can spot incomplete compliance at a glance.
6. Batches list cards should show linked-product count and a "+ Product from batch" quick action mirroring the strains page.
Run npm run verify.
```

## 17. Order requests list (`/grower/orders`) — files: app/grower/orders/page.tsx, components/OrdersList.tsx

```
Polish PhenoFarm's grower Order Requests page (app/grower/orders/page.tsx + components/OrdersList.tsx):

1. Saved-view chips glue counts to labels ("All7", "Needs review7") — add spacing/count pills (same treatment as products page).
2. Batch status updates: the API (/api/orders/batch-status) now returns skippedOrders with per-order reasons when some selected requests can't transition. Make sure the UI surfaces that: after a partial batch update show a toast/panel "2 updated, 1 skipped" with the skip reasons listed; today failures can pass silently.
3. When rows are selected, show a sticky bulk bar with the count and the allowed transitions for the current view (e.g. Needs review → Accept / Cancel), not a generic dropdown of all six statuses.
4. Table rows: make the whole row clickable to the detail page (keep the View link for a11y), add hover state.
5. The "Estimated Request Value" stat card needs a sub-label "Excludes cancelled" to match its math.
Run npm run verify.
```

## 18. Order detail (`/grower/orders/[id]`) — files: app/grower/orders/[id]/page.tsx, components/{OrderStatusTimeline,QuickStatusUpdate,PrintButton}.tsx

```
Polish PhenoFarm's grower order detail page (app/grower/orders/[id]/page.tsx):

1. OrderStatusTimeline uses emoji step icons (📋 ✅ 📦 🚚 🎉) — replace with lucide icons (ClipboardList, CheckCircle2, Package, Truck, PartyPopper→ use Flag or CircleCheck) in consistent 20px circles; completed steps emerald, current step ring highlight, future steps gray.
2. QuickStatusUpdate's two-step confirm ("Click to confirm Accept Request") is good; also add the destructive variant styling for Cancel (red confirm) and show a small spinner during the PATCH.
3. After a status change the page router.refreshes — add a success toast naming the new status ("Request accepted").
4. PrintButton: add a print stylesheet so printing shows only the request summary (items, values, parties, status) — currently the whole app shell prints.
5. The "Recorded tax" row renders only when tax > 0 (correct); also italicize the settlement note and keep it directly under the totals block.
6. Customer card: link the dispensary name to /grower/customers/[id]/edit (relationship view) and add a "Message buyer" button that opens the ChatDrawer with this order's context (dispatch the existing 'phenofarm-open-chat' event with a draft).
Run npm run verify.
```

## 19. Order edit (`/grower/orders/[id]/edit`) — file: app/grower/orders/[id]/edit/components/EditOrderForm.tsx

```
Fix consistency problems on PhenoFarm's order edit page (app/grower/orders/[id]/edit/components/EditOrderForm.tsx):

1. VOCABULARY BUG: the status selector shows raw enum labels with emoji ("📋 Pending / ✅ Confirmed / 📦 Processing / 🚚 Shipped / 🎉 Delivered / ❌ Cancelled") while the rest of the app says Submitted/Accepted/Preparing/Ready/Delivered/Cancelled. Use getOrderStatusLabel from lib/order-workflow.ts and lucide icons instead of emoji.
2. Only render VALID next statuses as selectable (use canTransitionOrderStatus from lib/order-workflow.ts); show the current status as a static badge. Today all six render as equal cards.
3. Style Cancelled as destructive (red outline card) and require the shared ConfirmDialog before saving a cancellation, mentioning that reserved stock is returned.
4. "Subtotal (1 items)" — fix pluralization.
5. Rename the bare "Tax ($)" input to "Recorded tax ($, optional)" with helper text "PhenoFarm does not calculate tax; record it only if your invoice includes it." Same for Shipping Fee helper ("estimate for records only").
6. Item quantity steppers: disable "+" at available stock (the API enforces inventory) and show "Max N" next to the stepper.
Run npm run verify.
```

## 20. Record direct request (`/grower/orders/add`) + history — files: app/grower/orders/add/page.tsx, app/grower/orders/history/page.tsx

```
Polish PhenoFarm's grower "Record Direct Request" page (app/grower/orders/add/page.tsx) and request history:

1. The dispensary select is a plain dropdown — fine at 1 customer, unusable at 50. Make it a searchable combobox (filter as you type on business name/city).
2. Item rows: the product select shows "Name - $price (N available)" — after selection also show the unit ("$25.00 / gram") beside the price input, and prevent adding the same product twice (merge quantities instead).
3. The unit-price input is editable (intentional for negotiated prices) — add helper text "Defaults to list price; adjust to the agreed price."
4. Disable the submit button until dispensary + at least one valid item exist, with a hint explaining what's missing.
5. History page (app/grower/orders/history/page.tsx): hide the "Delivered Request Value $0.00" stat when there are no delivered requests (show "—"), and add status filter chips (Delivered / Cancelled) above the table.
Run npm run verify.
```

## 21. Customers (`/grower/customers`, add, edit) — files: app/grower/customers/page.tsx, customers/add/page.tsx, customers/[id]/edit/*

```
Rework PhenoFarm's grower Customers pages:

1. The list is scoped to dispensaries with order history (correct). Make rows clickable and add per-row quick actions: "View requests" (→ /grower/orders filtered by this dispensary — add query-param support) and "Message" (opens ChatDrawer via the 'phenofarm-open-chat' event).
2. Add last-order date and total delivered value columns so the table is useful for account management, not just contact lookup.
3. "+ Add Customer" creates a Dispensary record via /api/customers — that's marketplace-odd (growers creating buyer businesses). Reframe the button as "Record off-platform customer" with helper copy, or (preferred) remove it and add an empty-state explainer: "Customers appear here after their first order request." Check with the data model before deleting the API.
4. The "Active" stat duplicates "Total Customers" — replace with "Ordered in last 90 days".
5. Use the shared StatCard + PageHeader components.
Run npm run verify.
```

## 22. Reports (`/grower/reports`) — files: app/grower/reports/page.tsx, ReportsExportActions.tsx

```
Polish PhenoFarm's grower Reports page (app/grower/reports/page.tsx):

1. Add a date-range selector (Last 30 / 90 days / 12 months / All) that scopes the delivered-value trend, top products, and top customers — everything is currently fixed windows.
2. The monthly trend bars are unlabeled — add month labels under each bar and value on hover (title attr is fine).
3. "Requests by Status" already uses friendly labels; add a click-through: each status row links to /grower/orders (active statuses) or /grower/orders/history (Delivered/Cancelled).
4. Verify Export PDF/CSV in ReportsExportActions.tsx actually produce files with the friendly status labels and the current data; add a small "Exports reflect the selected date range" caption.
5. Empty states for Top Products/Top Customers explain delivered-only ranking — good copy; tighten to one sentence each.
Run npm run verify.
```

## 23. Pricing page (`/grower/pricing`) — file: app/grower/pricing/page.tsx

```
PhenoFarm's /grower/pricing page is a two-paragraph stub that tells growers to go to Settings. Replace it with a real plan page:

1. Render the three cultivator plans (Free / Pro $249/mo ($199 annual) / Business custom — keep names in sync with app/components/settings/SubscriptionBilling.tsx and the landing page) as comparison cards with feature lists.
2. Show the grower's CURRENT plan (fetch /api/grower/subscription) with a "Current plan" badge, and wire the upgrade buttons to the same checkout flow SubscriptionBilling uses (POST /api/grower/subscription/checkout with plan) plus "Manage billing" → portal when a subscription exists.
3. When Stripe isn't configured (the API returns checkoutConfigured=false), show the existing "environment not configured" notice instead of dead buttons.
4. Keep the wholesale-settlement disclaimer ("Buyer-seller wholesale payment is never processed").
Run npm run verify.
```

## 24. Grower settings (`/grower/settings`) — files: app/grower/settings/page.tsx, components/SettingsForm.tsx, app/components/settings/{SubscriptionBilling,CommercialTermsPanel,LogoUpload}.tsx

```
Improve PhenoFarm's grower Settings page structure (app/grower/settings/*):

1. It's one long column: Subscription → Wholesale settlement note → Commercial terms → Profile/license → Logo. Add a sticky in-page section nav (anchor links: Subscription / Commercial terms / Business profile / Branding) on lg+ screens.
2. STALE COPY: CommercialTermsPanel says "These stay in this browser for now" — commercial terms now persist to the account via /api/grower/commercial-terms. Update the copy ("Saved to your account and shown to buyers on your shop page") and verify the panel loads server values on mount.
3. The "REQUIRED FIRST" banner floats mid-page; move it to the top of the Business profile section it refers to.
4. Plan feature list in SubscriptionBilling renders included/excluded features with inconsistent check placement — give every row an explicit icon: emerald check (included) or gray dash (excluded).
5. Keyboard-shortcut hint (Ctrl+S / Esc) renders as its own row — move it into the sticky save bar.
Run npm run verify.
```

---

# Dispensary portal

## 25. Dispensary dashboard (`/dispensary/dashboard`) — files: app/dispensary/dashboard/page.tsx, OrdersTable.tsx

```
De-clutter PhenoFarm's dispensary dashboard (app/dispensary/dashboard/page.tsx), same disease as the grower dashboard:

1. Merge RolePrimaryAction + SetupChecklist + GuidedFixPanel into one "Setup & next steps" card; collapse it to a single row once complete (the demo account shows "5 of 5 complete" yet still renders the full checklist).
2. The recent-orders table (dashboard/OrdersTable.tsx) duplicates app/dispensary/components/OrdersTable.tsx at smaller scope — reuse the shared table with a compact prop, or at minimum align status badge styles and date formats between the two.
3. Add a "Saved for later" teaser row (favorites count + price-alert count linking to /dispensary/saved) so the Saved workspace is discoverable from the dashboard.
4. Replace hand-rolled stat cards with the shared StatCard.
Run npm run verify.
```

## 26. Catalog (`/dispensary/catalog`) + filter sidebar + mobile filter sheet — files: app/dispensary/catalog/CatalogContent.tsx, components/{FilterSidebar,MobileFilterSheet,AddToCartButton}.tsx

```
Improve PhenoFarm's dispensary catalog (app/dispensary/catalog/CatalogContent.tsx, 2700 lines — keep changes surgical):

1. WHOLESALE-WRONG FILTERS: the price-range filter buckets are "Under $5 / $5-$10 / $10-$25 / $25+" — retail-shaped; nearly every wholesale listing lands in "$25+". Recalibrate to unit-price bands that match the data (Under $10 / $10–$25 / $25–$50 / $50+) and label them "per unit".
2. Filter sidebar lists all 11 product types even when only 2 have products — show a count per type and gray out/hide zero-count types.
3. Add a "Clear all filters" link that appears whenever any filter/search/sort is active, and show active filters as removable chips above the grid.
4. Sort select's default option reads "Default (Grower)" — jargon; rename to "Grouped by grower".
5. Product card is CTA-dense (Compare, favorite, price alert, qty stepper, Add to Request, Message Grower). Keep favorite + alert as the two floating icons; move "Message Grower" into a link-style action under the primary button; ensure "Request Pricing" and "Message Grower" don't render as twin buttons on quote-only cards (one primary "Request pricing" that opens chat with the pricing template is enough).
6. Favorites chip says "1 items" — pluralize; the "View Favorites Only"/"Show Recently Added" toggle chips need a clear pressed state (filled vs outline + aria-pressed).
7. Add skeleton cards during initial load instead of layout pop-in.
8. MobileFilterSheet: verify it mirrors ALL sidebar filters and has a sticky "Show N results" apply button at the bottom.
Run npm run verify.
```

## 27. Product comparison bar + modal — file: app/dispensary/catalog/CatalogContent.tsx (comparison sections)

```
Fix PhenoFarm's catalog comparison feature (inside app/dispensary/catalog/CatalogContent.tsx):

1. The comparison modal duplicates potency rows: "THC Potency 19%" AND "THC 19%" render for each product — keep one THC row and one CBD row.
2. "Strain Type" shows N/A even though the cards display Hybrid badges — map the same field the card uses (strainType/legacy fallback) into the comparison.
3. Products with different units ($25/Gram vs $40/Eighth) compare raw prices — add the unit to the price row ("$25.00 / Gram") and a footnote when units differ: "Prices use different units — compare per-unit terms with the grower."
4. The modal does not close on Escape and backdrop click — add both, plus a focus trap (reuse app/hooks/useFocusTrap.ts) and a visible ✕ button.
5. The floating compare bar ("Compare (2/3)") should have a per-item remove ✕ and a "Clear" action, and must not overlap the chat FAB on mobile (stack above it).
Run npm run verify.
```

## 28. Price alert modal + price alerts page — files: app/dispensary/catalog/CatalogContent.tsx (alert modal), app/dispensary/price-alerts/PriceAlertsContent.tsx

```
Fix PhenoFarm's price alert UX:

1. STALE COPY: the Set Price Alert modal says "Alerts are saved on this device" — alerts persist to the account via /api/dispensary/price-alerts. Change to "Saved to your account."
2. Validate target price: must be > 0 and below the current price; show inline error otherwise (an alert above current price triggers immediately and confuses users).
3. After saving, show a toast "Alert set — we'll flag it in Saved → Price Alerts when the price drops" (there is no email notification; set expectations honestly).
4. On PriceAlertsContent.tsx: triggered alerts should sort first with a distinct "Price dropped" banner style; each card needs current vs target price side by side and a one-click "Add to Request" when triggered.
5. Add an explainer line at the top of the price-alerts tab/page: alerts are checked when you browse (the refresh endpoint), not in the background.
Run npm run verify.
```

## 29. Grower shop page (`/dispensary/grower/[id]`) — files: app/dispensary/grower/[id]/page.tsx, GrowerShopContent.tsx

```
Polish PhenoFarm's grower shop page for buyers (app/dispensary/grower/[id]/*):

1. MISLEADING STAT: "Avg THC 42.0%" averages flower (19–22%) with an 85% concentrate — either split by category ("Flower avg 21% · Extracts avg 85%") or drop the stat for a "Product types: Flower, Bulk Extract" line.
2. Verify "Orders Filled" counts DELIVERED orders only; if it counts all orders, fix the query and label it "Requests fulfilled".
3. Grammar: "Browse Vermont Nurseries's full catalog" → use smart possessive (names ending in s get s'), or sidestep: "Browse the full catalog".
4. "Follow Shop" has no visible effect — either wire it to the favorites/saved system with a following state ("Following ✓") and surface followed shops in /dispensary/saved, or remove the button until the feature exists.
5. The header avatar is a plain letter "V" — render the grower's logo when set (Grower.logo), falling back to initials on the emerald gradient.
6. Commercial terms tiles (License / Fulfillment region / Order minimums / Settlement) — good; now that grower commercial terms persist (commercial* fields on Grower), render the actual saved MOQ/fulfillment methods/payment terms instead of the generic placeholders when available.
Run npm run verify.
```

## 30. Request draft / cart (`/dispensary/cart`) + review modal — file: app/dispensary/cart/page.tsx

```
Polish PhenoFarm's request draft page (app/dispensary/cart/page.tsx — the flow is strong; refine details):

1. Step chips render as "OKItems / OKLogistics / OKTerms / 4Review" — the state indicator and label are glued together; give each chip an icon (check circle / step number) with a gap before the label.
2. Empty state: when the draft is empty show the products the buyer favorited or recently requested as one-click "Add" suggestions, not just a browse link.
3. The review modal lists per-grower splits — add each grower's fulfillment region + payment terms line (from their commercial terms) so buyers confirm terms per grower before submitting.
4. After submit, the success screen auto-redirects in 2s — add a "View requests now" button and pause the redirect if the user has moved the mouse into the success card (or extend to 5s); 2 seconds is too fast to read the confirmation.
5. Inventory-conflict handling (409 issues list) exists — style each conflict row with product name, requested vs available, and an inline "Adjust to N" button (verify applyInventoryAdjustments already does this; expose it per-row).
Run npm run verify.
```

## 31. Dispensary orders + order detail (`/dispensary/orders`, `/dispensary/orders/[id]`) — files: app/dispensary/components/OrdersTable.tsx, app/dispensary/orders/[id]/{page.tsx,OrderDetailActions.tsx}

```
Polish PhenoFarm's dispensary order pages:

1. OrdersTable: make full rows clickable (keep View link), add hover state, and show a small unread-message dot on orders with unread grower messages if cheap to derive; otherwise skip.
2. The status filter and saved-view chips duplicate each other ("Waiting on grower" chip vs "Submitted" dropdown option) — when a chip is active, sync the dropdown to match and vice versa, or hide the dropdown and keep only chips.
3. Order detail: the "Buyer Actions" card can hold 4 buttons (Message/Update/Cancel/Reorder) — order them by frequency (Message first), and after the draft-open actions fire, scroll/flash the chat drawer so users notice where the draft went.
4. Dispensary self-cancel: buyers can directly cancel PENDING requests via the status API — add a "Withdraw request" (destructive, ConfirmDialog) button for Submitted orders alongside "Request Cancellation" messaging for accepted ones, with copy explaining the difference.
5. The fulfillment timeline on this page is text-numbered (1–5) while the grower side uses icons — unify on the same lucide-icon timeline component (extract a shared OrderTimeline into app/components/ui/).
Run npm run verify.
```

## 32. Saved workspace (`/dispensary/saved`, `/dispensary/favorites`, `/dispensary/price-alerts`) — files: app/dispensary/saved/SavedContent.tsx, favorites/FavoritesContent.tsx

```
Tighten PhenoFarm's saved-items surfaces:

1. /dispensary/favorites and /dispensary/price-alerts render the same content as tabs inside /dispensary/saved — redirect both standalone routes to /dispensary/saved?tab=favorites|alerts and make SavedContent read the tab from searchParams so deep links still work. One surface to maintain.
2. Favorites grid: quote-only products show "Request Pricing" — also add "Message grower" as a secondary link, and add a remove-from-favorites hover control directly on the card (today unfavoriting requires finding the product in the catalog).
3. "Recently Requested" tab: add the last-ordered date next to the order count, and make "Find again" pre-scroll to the product in the catalog (it passes ?product= — verify the catalog actually scrolls/highlights; implement if missing).
4. Tab buttons are large tiles — add counts to each tab label (Favorites (3), Price Alerts (1), Recently Requested (5)).
Run npm run verify.
```

## 33. Dispensary settings (`/dispensary/settings`) — file: app/dispensary/settings/components/SettingsForm.tsx

```
Polish PhenoFarm's dispensary settings (app/dispensary/settings/components/SettingsForm.tsx):

1. Add the same sticky section nav treatment as grower settings (License & verification / Business profile / Branding).
2. The license-verified banner is good; for unverified accounts add a prominent explainer card at top: current status (pending review / rejected with notes if licenseReviewNotes exists), what's blocked (submitting requests), and what to do (complete license fields; PhenoFarm reviews within X).
3. "Business Address (Autocomplete)" label leaks implementation detail — label it "Business Address" with placeholder "Start typing to search".
4. Move the keyboard-shortcut hint into the sticky save bar (matches grower settings prompt #24).
5. The lone "Account" card with sign-out feels orphaned at the bottom — style it as a compact footer row.
Run npm run verify.
```

---

# Admin portal

## 34. Admin dashboard (`/admin/dashboard`) — files: app/admin/dashboard/page.tsx, app/admin/components/SeedDataButton.tsx

```
Polish PhenoFarm's admin dashboard (app/admin/dashboard/page.tsx):

1. Same de-stacking as other dashboards: merge RolePrimaryAction + SetupChecklist + GuidedFixPanel into one "Operations checklist" card; the three currently repeat the same verification/subscription signals.
2. Stat cards should link (Users → /admin/users, etc.) and use the shared StatCard.
3. SeedDataButton (demo data seeding) sits in the main content — move it into a clearly-labeled "Developer tools" card at the bottom with warning copy ("Creates demo accounts — dev/demo environments only"), and show its results (created/errors JSON) in a formatted list instead of raw text (verify current rendering and improve).
4. Add a "Pending verification" quick-list: the 5 newest unverified growers/dispensaries with inline Verify buttons, so admins don't need to open both list pages to find the queue.
Run npm run verify.
```

## 35. Admin growers & dispensaries lists (`/admin/growers`, `/admin/dispensaries`) — files: app/admin/growers/page.tsx, app/admin/dispensaries/page.tsx

```
Improve PhenoFarm's admin verification list pages:

1. Both tables are action-thin: add a license-expiry column (flag expired/expiring-soon in amber/red) and, for dispensaries, surface licenseReviewNotes as a hover tooltip or expandable row.
2. The "Subscription" cell on growers ("Subscription review / Billing portal not yet connected") is two stacked muted lines squeezed into a table cell — replace with a compact status badge (Free / Pro / Business / Inactive) + tooltip for detail.
3. Verify/Unverify use the shared ConfirmDialog — good; after the action completes, stay on the page and show a success toast instead of the current full form-POST redirect flash (convert the form POST to a fetch + router.refresh).
4. Search + status filter exist; persist them in the URL (they already read searchParams — ensure the inputs are controlled from the URL so back/forward works) and add a result-count line under the header.
5. Rows should expand (or link to a detail drawer) showing full business info — today the row is the entire record view; at minimum add mailto links on emails.
Run npm run verify.
```

## 36. Admin users & settings (`/admin/users`, `/admin/settings`) — files: app/admin/users/page.tsx, app/admin/settings/page.tsx

```
Round out PhenoFarm's remaining admin pages:

1. /admin/users is a read-only 4-column table. Add: role filter chips (All/Admin/Grower/Dispensary), a search box (email/business), and a linked business name (grower → /admin/growers, dispensary → /admin/dispensaries). Do NOT add destructive user actions without a server API — the old unused admin user APIs were removed deliberately.
2. Add a "Verified" column with a compact badge so admins can scan account standing from one table.
3. /admin/settings: the env-status cards are useful — add a "Copy" button next to the support email, a last-checked timestamp, and a short line under each "Needs provider setup" item pointing to where it's configured (Vercel env vars). Keep it read-only.
4. Both pages: adopt shared PageHeader; admin tables should match the grower/dispensary table styles (same paddings, badge shapes).
Run npm run verify.
```

---

# Addenda

## 37. Grower catalog workspace (`/grower/catalog`) — file: app/grower/catalog/page.tsx

```
Clarify PhenoFarm's grower Catalog Workspace page (app/grower/catalog/page.tsx). Stats are accurate now, but the page overlaps Products/Inventory/Marketplace:

1. Make it a true overview hub, not another list: keep the stat tiles + "next best action" banner, keep the four section-link cards, but replace the "Recent catalog items" list (which duplicates the Products page) with a compact health summary — counts of listings missing images, missing type, quote-only, and low stock, each linking to the Products page pre-filtered.
2. The section cards' metrics ("8 products") and the generic "Open" button on the next-action banner need work: name the action on the button ("Review low stock", "Add product") instead of "Open".
3. Rename the nav label to "Overview" (grower nav in app/grower/layout.tsx currently shows both "Catalog" and "Products" side by side, which reads as duplicates) — keep the route.
4. Use shared PageHeader/StatCard components.
Run npm run verify.
```

## 38. Message Grower modal + shared ConfirmDialog — files: app/dispensary/catalog/CatalogContent.tsx (message modal), app/components/ui/ConfirmDialog.tsx

```
Polish PhenoFarm's remaining small dialogs:

1. The "Message Grower" modal (in app/dispensary/catalog/CatalogContent.tsx) is a bare textarea. Add: the product context as a chip (name + grower, already in the subtitle — make it visual), 3 template chips that prefill the textarea ("Request pricing & MOQ", "Check availability this week", "Introduce my dispensary"), a character counter, and a note that replies arrive in the Messages drawer. On send, open the ChatDrawer to that conversation (dispatch 'phenofarm-open-chat').
2. ConfirmDialog (app/components/ui/ConfirmDialog.tsx): verify and, if missing, add — Escape to cancel, backdrop click to cancel, focus trap with initial focus on Cancel for danger intent, and aria-labelledby/aria-describedby wiring. All destructive confirms in the app route through this component, so fixes land everywhere.
3. Both dialogs: animate in with a 150ms fade/scale and respect prefers-reduced-motion.
Run npm run verify.
```
