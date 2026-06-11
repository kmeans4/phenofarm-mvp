# PhenoFarm MVP — Full App UI/UX Review

**Date:** 2026-06-10
**Scope:** Local workspace (uncommitted state), all three roles (admin, grower, dispensary)
**Method:** Static code review of routes/APIs/components + live walkthrough on `localhost:3011` with the three demo users (desktop 1380px and mobile 375px)
**Validation:** `npm run verify` (env:check + lint + build) passes with no errors.

Items marked **[live-confirmed]** were reproduced in the running app, not just inferred from code.

---

## Critical — broken core flows

### C1. Sign-up never creates an account
[sign_up/page.tsx:76](app/auth/sign_up/page.tsx:76) — `handleSubmit` waits 1.5 s (`setTimeout`) and redirects to `/auth/sign_in`. There is **no registration API route anywhere in the app**. The polished 3-step form silently discards everything, and the user lands on a sign-in page where their credentials don't work. Every landing-page CTA ("Create Account" on both pricing tiers, "Sell Your Products" in the footer) funnels into this dead end.
**Fix:** add a registration endpoint (User + Grower/Dispensary profile + passwordHash) or replace the form with a "request access" capture until registration ships.

### C2. Two divergent NextAuth configs; the stale fork drops `dispensaryId` from sessions
[lib/auth.ts](lib/auth.ts) is an older fork of the canonical config in [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts). The fork's `jwt`/`session` callbacks never copy `dispensaryId`, so any server code that calls `getServerSession(authOptions)` with the fork gets `session.user.dispensaryId === undefined`. **18 files import the fork** (all of `app/admin/*`, `app/api/admin/*`, plus `app/dispensary/layout.tsx`, `app/api/orders/route.ts`, the two legacy Stripe routes).

Live-confirmed consequences:
- **[live-confirmed]** The dispensary sidebar "Orders" badge never shows a pending count ([dispensary/layout.tsx:46](app/dispensary/layout.tsx:46) always gets `undefined`), even with 6 pending orders.
- **[live-confirmed]** `GET /api/orders` returns `400 {"error":"Dispensary ID not found"}` for any signed-in dispensary ([orders/route.ts:299](app/api/orders/route.ts:299)). No UI currently calls the GET, so it's a latent-but-broken API contract.

The fork also has worse hygiene: `authorize()` logs the attempted email, whether the user exists, and whether the password matched to console ([lib/auth.ts](lib/auth.ts) `console.log('Auth attempt:', …)`), and it exports `GET`/`POST` route handlers from a lib module.
**Fix:** keep exactly one `authOptions` (move the canonical one into `lib/auth.ts`, re-export from the route file), delete the fork's body, and update the 18 imports. This is one of the highest-leverage fixes in the codebase.

### C3. Admin "Verify" does not actually let a dispensary order
Order submission gates on `licenseStatus === 'verified'` ([checkout/route.ts:109](app/api/checkout/route.ts:109), [orders/route.ts:100](app/api/orders/route.ts:100)). But the admin UI's Verify/Unverify button toggles a *different* field, `isVerified` ([admin/dispensaries/[id]/verify/route.ts](app/admin/dispensaries/[id]/verify/route.ts)). The only way to set `licenseStatus` is [api/admin/dispensaries/[id]/license/route.ts](app/api/admin/dispensaries/[id]/license/route.ts) — **which no UI calls**.
- A real dispensary verified through the admin UI still gets `403 LICENSE_NOT_VERIFIED` on every order submit. The demo only works because the seed writes `licenseStatus: 'verified'` directly.
- Conversely, "Unverify" does not revoke ordering ability.
- The table's "Can submit requests / Needs license review" readiness column ([admin/dispensaries/page.tsx:198](app/admin/dispensaries/page.tsx:198)) reads `isVerified`, i.e. it displays the wrong signal.
**Fix:** drive admin verification through the license route (status + review notes UI), or make the verify action update both fields consistently; render readiness from `licenseStatus`.

### C4. Any dispensary can change the status of any order
[api/orders/[id]/status/route.ts:44](app/api/orders/[id]/status/route.ts:44) checks ownership **only for growers** (`if (user.role === 'GROWER' && order.growerId !== user.growerId)`). A DISPENSARY session passes straight through: it can accept, ship, deliver, or cancel *any* order in the system, including other dispensaries' orders.
**Fix:** require `order.dispensaryId === user.dispensaryId` for dispensary users, and restrict which transitions each role may perform (e.g., dispensary: cancel own PENDING only).

### C5. Stripe webhook fails open when the secret is missing
[stripe/webhooks/route.ts:7](app/api/stripe/webhooks/route.ts:7) — `isTestMode = !process.env.STRIPE_WEBHOOK_SECRET || secret === 'test'`. If the env var is ever absent in production, the endpoint accepts **unsigned JSON** and updates grower subscription state (anyone could activate a paid plan with a curl). Convenient for local dev, dangerous as a default.
**Fix:** fail closed when `NODE_ENV === 'production'` (500/configuration error instead of test mode).

### C6. Cancelled orders never return reserved inventory
Both order-creation paths decrement `inventoryQty` atomically at creation ([checkout/route.ts:205](app/api/checkout/route.ts:205), [orders/route.ts:190](app/api/orders/route.ts:190)) — but the CANCELLED transition in the status route does no compensation. Every cancelled request permanently drains stock. (Order *editing* paths should be checked for the same gap.)
**Fix:** restore quantities inside a transaction when an order moves to CANCELLED.

---

## High — wrong data shown to users

### H1. Grower dashboard raw-SQL aliases break the activity feed and value stats
[grower/dashboard/page.tsx:91](app/grower/dashboard/page.tsx:91) — `$queryRaw` aliases (`as dispensaryName`, `as totalAmount`, `as orderCount`, …) are unquoted, so Postgres folds them to lowercase and the TS-typed fields come back `undefined`.
- **[live-confirmed]** Every Activity Feed row reads "**From undefined**".
- "Delivered Request Value" is computed from `Number(undefined) || 0` → always **$0.00** regardless of delivered orders; the serialized `totalAmount` sent to the feed is `NaN`.
- The "Active Products" raw count (line 121) has no `isDeleted`/`isAvailable` filter, so deleted products inflate it.
**Fix:** quote the aliases (`as "dispensaryName"`) or, better, replace these with ordinary Prisma queries (no raw SQL is needed here).

### H2. Grower "Customers" page lists every dispensary on the platform
[grower/customers/page.tsx:14](app/grower/customers/page.tsx:14) — `db.dispensary.findMany()` with **no where clause**. Any grower sees all dispensaries (with contact emails) presented as "their customers", and "Active" is just the total count. With one demo dispensary this is invisible; with real data it's a data-exposure and trust problem.
Also: the "Orders" stat card is hardcoded `0` ([line 56](app/grower/customers/page.tsx:56)) even though per-customer order counts are fetched and shown in rows. **[live-confirmed]** ("Orders 0" with 7 existing orders).
**Fix:** scope to dispensaries with order/conversation history with this grower (or rename the page "Directory"), and sum the fetched counts.

### H3. `/api/checkout` trusts client-supplied prices
[checkout/route.ts:126](app/api/checkout/route.ts:126) — the unit `price` for each order item comes from the request body. A buyer can submit a draft with arbitrary prices, and those values flow into grower-facing order records and reports. No payment moves, but the "estimated request value" reporting becomes untrustworthy.
**Fix:** read the current product price server-side (and reject or flag hidden-price products that require a quote).

---

## Medium — workflow, consistency, data quality

### M1. Two competing status vocabularies
Friendly labels ("Submitted / Accepted / Preparing / Ready / Delivered") are used on order pages and saved views, while raw enum-ish labels ("Pending / Confirmed / Processing / Shipped") appear in the dispensary orders **filter dropdown on the same page** [live-confirmed], the reports "Requests by Status" panel, and auto-messages ("Status: PENDING"). Define one label map (e.g. in `lib/order-workflow.ts`) and use it everywhere.

### M2. "Request Cancellation" sends a message instantly
**[live-confirmed]** On the dispensary order detail, clicking "Request Cancellation" immediately *sends* the prefilled chat message to the grower — no draft state, no confirm. The grower-side quick status updates use a nice two-step "Click to confirm" pattern; this action should too (or open the composer unsent).

### M3. Catalog Workspace stats are computed from only 8 products
[grower/catalog/page.tsx:23-48](app/grower/catalog/page.tsx:23) — the query uses `take: 8`, then presents `products.length`, low-stock count, hidden-price count, and "inventory value" as if they were catalog totals. Wrong as soon as a grower has 9+ products; also no `isDeleted` filter.

### M4. Grower Marketplace page is half-wired
[grower/marketplace/page.tsx](app/grower/marketplace/page.tsx):
- The 12 category pill buttons are inert no-ops (server component, no handlers) — confusing, focusable dead CTAs.
- The section titled "Your Active Listings" renders **all** products (incl. unavailable/deleted) while the header stat counts only active ones.
- THC comes from `thcLegacy` only, so products using the new `thcMin/thcMax` fields never show THC.
- The page double-pads (`p-4` inside the already-padded layout), unlike sibling pages.

### M5. Inventory page issues
[grower/inventory/page.tsx](app/grower/inventory/page.tsx) + [api/inventory/route.ts](app/api/inventory/route.ts):
- No `isDeleted` filter → deleted products in list, totals, and low-stock count.
- The "Out of Stock" badge actually means `isAvailable === false` — a hidden listing with 50 units reads "Out of Stock".
- `/grower/inventory/add` collects `reorderLevel`, `batchNumber`, `harvestDate`, `expirationDate`, `location`, `notes` — the API silently drops all of them (only `productId` + `quantityAvailable` are used).
- The POST *replaces* quantity, though the page is titled "Add to Inventory"; and `!quantityAvailable` rejects a legitimate `0`.
- Rows aren't actionable despite "Manage product stock, pricing, and availability" copy — no edit links.

### M6. `/grower` is a stale duplicate dashboard
[grower/page.tsx](app/grower/page.tsx) is an old dashboard with hardcoded zero stats, reachable by URL. `/admin` correctly redirects to `/admin/dashboard`; `/grower` should do the same.

### M7. ChatDrawer over-fetches conversations
**[live-confirmed]** Every page load fires 4–8 `GET /api/messages/conversations` requests (drawer + unread polling + StrictMode double-mount). Use SWR (per the workspace's UI defaults) or a single deduped poller.

### M8. Tax row contradicts the no-tax payment model
Order detail shows "Tax estimate $1.50" and seeded orders carry tax, while [checkout/route.ts:243](app/api/checkout/route.ts:243) always writes `tax = 0` and the payment model says PhenoFarm never calculates tax. Remove the tax line from UI + seed (or label it as grower-entered) to keep the model coherent.

### M9. Fulfillment timeline captions the DB cuid
Grower order detail "Fulfillment Progress" subtitle prints `Order request #cmoivlols…` (internal id) instead of the friendly `ORD-…` id shown everywhere else. **[live-confirmed]**

### M10. `npm run prisma:migrate` fails out of the box
`DATABASE_URL` lives in `.env.local`, but the Prisma CLI only reads `.env` — the documented local-run sequence dies with `P1012 Environment variable not found`. Add a `dotenv -e .env.local --` wrapper to the prisma scripts (or move local `DATABASE_URL` into `.env`).

### M11. Landing pricing doesn't match the product
[landing/pricing.tsx](app/landing/pricing.tsx) sells "Starter Review" and "Wholesale Pro" ($249/mo, $199 annual) — the app's actual plans are Free / Pro / Business driven by `STRIPE_PRO_PRICE_ID` / `STRIPE_BUSINESS_PRICE_ID` (grower settings, admin settings). Both CTAs lead to the broken sign-up (C1).

### M12–M15. Smaller items
- **M12** Admin checklist "Subscription configuration" is hardcoded `complete: false` ([admin/dashboard/page.tsx:69](app/admin/dashboard/page.tsx:69)) — it can check the same env vars `/admin/settings` already inspects.
- **M13** Admin Users page is read-only while `/api/admin/users` + `/api/admin/users/[id]` mutation routes exist unused — add actions or remove the routes.
- **M14** Products without images render broken `<img>` alt text overlapping the "Compare" chip ([live-confirmed] on mobile catalog). Show a placeholder when `images` is empty. Related: uploads are stored as base64 in the DB ([api/products/upload/route.ts](app/api/products/upload/route.ts)) — fine for MVP, but payloads will bloat; plan object storage.
- **M15** Test artifacts are user-visible in messaging ("Automated unread check read-1777…" conversation) — scrub Playwright leftovers from demo data.

---

## Dead code and redundancy

- **Legacy Stripe Connect endpoints are still live code**: [api/stripe/connect/route.ts](app/api/stripe/connect/route.ts) and [api/stripe/account/route.ts](app/api/stripe/account/route.ts) have zero callers (the `StripeConnect` settings component was deleted in this working tree) and contradict the payment model if ever invoked. Remove them (schema fields can stay dormant per `.codex/payment-model.md`).
- **Unreferenced files** (safe deletes after a final grep):
  - [app/components/Navbar.tsx](app/components/Navbar.tsx)
  - [app/ProtectedRoute/AuthContext.tsx](app/ProtectedRoute/AuthContext.tsx)
  - [app/dashboard/protected-route.tsx](app/dashboard/protected-route.tsx)
  - [app/components/ux/CommercialReadinessPanel.tsx](app/components/ux/CommercialReadinessPanel.tsx)
  - [app/dispensary/catalog/components/ProductComparison.tsx](app/dispensary/catalog/components/ProductComparison.tsx)
  - [app/grower/products/add/components/ProductForm.tsx](app/grower/products/add/components/ProductForm.tsx) — a 623-line older fork; the add page actually imports the shared 1156-line form
  - [app/grower/orders/api/route.ts](app/grower/orders/api/route.ts) — page-nested API route, no callers
  - `requireGrowerRole` / `requireDispensaryRole` in [lib/auth-helpers.ts](lib/auth-helpers.ts) — unused (pages re-implement the checks inline)
- **Duplicates to consolidate**: two dispensary OrdersTables ([dispensary/components/OrdersTable.tsx](app/dispensary/components/OrdersTable.tsx) 376 L vs [dispensary/dashboard/OrdersTable.tsx](app/dispensary/dashboard/OrdersTable.tsx) 153 L); [grower/orders/components/Button.tsx](app/grower/orders/components/Button.tsx) vs the shared [ui/Button](app/components/ui/Button.tsx); near-identical grower/dispensary MobileNavs (admin borrows the grower one); ad-hoc `SessionUser` interfaces re-declared per file instead of one shared type.
- **Information architecture overlap (grower)**: Catalog / Products / Inventory / Marketplace are four nav destinations over the same product list, each computing stats differently (8-row cap, deleted included or not, legacy THC or not). Recommend folding Inventory and Marketplace into Products as views/tabs — or at minimum extracting shared stat helpers so the numbers agree.
- **Dispensary**: standalone `/dispensary/favorites` and `/dispensary/price-alerts` pages duplicate the Saved workspace tabs (nav links only "Saved"). Keep them as deep links if desired, but they're a second surface to maintain.

---

## Polish / accessibility

- Grower orders "Estimated Request Value" sums **all** orders including cancelled ([grower/orders/page.tsx](app/grower/orders/page.tsx) `trackedWholesaleValue`); exclude CANCELLED at least.
- Marketplace dead category buttons are keyboard-focusable no-ops (a11y noise) — same root cause as M4.
- The floating chat FAB overlaps sticky mobile action bars on form pages at 375px; consider hiding it when a sticky bar is present.
- Admin desktop sidebar pins "Admin Access" + sign-out with absolute positioning; on short viewports it can overlap nav items.

---

## What's working well

Worth keeping and patterning on:
- The **request-draft builder** (`/dispensary/cart`) is excellent: stepper with completion states, smart defaults, draft autosave, review modal with per-grower split, and clear "PhenoFarm does not collect wholesale payment" framing. [live-confirmed] end-to-end submit works and decrements stock atomically.
- The **quote/offer flow authorization** ([offer-action route](app/api/messages/messages/[id]/offer-action/route.ts)) is the most carefully guarded code in the app — role, ownership, self-response, and state checks all present.
- Product CRUD APIs consistently scope by `growerId`.
- Grower quick status updates use a two-step confirm; empty states across the app are consistently well-written with clear next actions.
- Payment-model copy discipline is strong almost everywhere ("settlement is direct", "value tracked only") — the work to retire marketplace-payment language has clearly been done deliberately.

---

## Suggested fix order

1. **C2** (single authOptions) — unblocks the dispensary badge and the orders API in one change.
2. **C3** (license verification UI) — without it no real dispensary can ever order.
3. **C4 + C6** (status route authz + inventory restore) — small, contained, high-impact.
4. **C1** (real sign-up or explicit gate) — top-of-funnel.
5. **H1, H2** (dashboard SQL aliases, customers scoping) — visible wrong data.
6. **C5, H3** (webhook fail-closed, server-side prices) — production hardening.
7. Then the medium/cleanup batches (status label map, dead code sweep, IA consolidation).

---

## Addendum — fixes applied (2026-06-10)

All findings above were fixed in the working tree on the same day:
- **C1–C6, H1–H3, M1–M15** implemented as recommended (C3 via the verify-route syncing `isVerified` + `licenseStatus`; M5 reframed `/grower/inventory/add` as an explicit "Update Stock" form).
- Dead files/routes deleted (incl. legacy Stripe Connect endpoints and the unused admin user/grower/stats/license APIs); `prisma:migrate`/`prisma:studio` now load `.env.local` via `scripts/prisma-env.mjs`; landing pricing renamed to Free/Pro/Business; corrupt seed product JPEGs replaced; test-artifact conversations scrubbed.
- Stale Playwright specs updated to the current request/quote vocabulary (they predated this review).

Validation: `npm run verify` ✅ · `npm run smoke` ✅ (2/2) · `npm run test` ✅ (31 passed, 3 skipped) · key flows re-verified live (sign-up → auto-login, admin verify → ordering unlocked, dispensary self-cancel → stock restored, badge + activity feed correct).
