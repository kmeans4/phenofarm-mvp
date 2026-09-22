# PhenoFarm — Business Workflow Audit & Fix Prompt

**Date:** 2026-06-11 · **Scope:** how the flows actually operate end-to-end — company creation & verification, listing products, buying (requests), selling (fulfillment), quote negotiation, subscriptions, admin operations. This is NOT a UI audit; every finding below was verified in the current code.

**Payment model (unchanged, enforced throughout):** no wholesale money ever passes through PhenoFarm. Buyers and growers settle directly. The only in-app payment is the platform subscription (Stripe Billing).

**⚠️ DECISION NEEDED BEFORE RUNNING (owner call, not Codex's):** everything currently built — Prisma schema, Stripe checkout/portal/webhooks, grower settings, landing pricing, `.codex/payment-model.md` — bills the **grower/cultivator** for the subscription. The latest instruction said "the **dispensaries** subscription to be on there in the first place." If the payer is actually the dispensary (or both sides), that inverts the billing feature. The prompt below implements enforcement for the **current grower-pays model** and marks the payer-swap as W0; strike W0 or answer it before handing this to Codex.

**Verified working — do not rebuild:** request pipeline with atomic inventory reservation + restore on cancel; role-scoped status transitions; quote send/counter/accept/reject mechanics; admin verify syncing `isVerified`+`licenseStatus`; buyer self-withdraw of pending requests; reorder-from-delivered; favorites/price alerts persistence; registration with auto sign-in.

---

```
You are working in /Users/sam/dev/phenofarm-mvp (Next.js 16 App Router + Tailwind v4 + Prisma + NextAuth + Stripe). PhenoFarm is a B2B cannabis marketplace: growers list products, verified dispensaries submit order requests, quotes are negotiated in a recorded chat, fulfillment is tracked Submitted→Accepted→Preparing→Ready→Delivered, and ALL wholesale settlement happens directly between the businesses outside the app. The only in-app payment is the platform subscription via Stripe Billing. Demo logins: grower@vtnurseries.com / dispensary@greenvermont.com / admin@phenofarm.com, password `password123`. Run `npm run verify` and `npm run test` when done; add Playwright coverage where noted.

This task fixes WORKFLOW gaps found in an end-to-end audit. Do not restyle the UI; reuse existing components and the friendly status labels from lib/order-workflow.ts. Never add any flow that moves wholesale money through the platform.

━━━━━━━━ W0. SUBSCRIPTION PAYER (confirm before implementing) ━━━━━━━━

The entire billing stack currently charges GROWERS (Grower.stripe*/subscription* fields, /api/grower/subscription/*, grower settings billing panel, landing pricing "cultivator subscription"). If the business decision is that DISPENSARIES pay to be on the platform instead, implement the mirror: subscription fields on Dispensary, /api/dispensary/subscription/* (checkout, portal, status), billing panel in dispensary settings, webhook handling keyed to dispensary metadata, and update every copy surface (landing pricing, FAQ, grower settings, admin settings, payment-model docs). If grower-pays stands, skip this section entirely. Everything in W3 applies to whichever side pays.

━━━━━━━━ W1. TRUST & VERIFICATION CHAIN (P1 — the marketplace's core promise leaks) ━━━━━━━━

W1a. Unverified growers sell immediately. app/api/dispensary/catalog/route.ts only SELECTS grower.isVerified for a badge — it never filters on it, and nothing gates product publishing on grower verification. A brand-new, unreviewed grower account can list products that all buyers see instantly. Fix: buyer-facing catalog queries (catalog route, catalog/products route, search, grower shop page, dispensary product APIs) must include `grower: { isVerified: true }` in the WHERE. On the grower side, allow creating/editing products at any time but show an "Awaiting PhenoFarm verification — listings are hidden from buyers until your account is verified" banner on grower dashboard/products when isVerified=false (marketplace-readiness checklist already tracks license info; wire this state in). Admin growers queue already exists for the review itself.

W1b. License expiry is never enforced. Dispensary.licenseExpiry and Grower.licenseExpiry are stored and validated in settings forms, but /api/checkout and /api/orders only check licenseStatus === 'verified' — a license verified once keeps ordering forever, even years past expiry. Fix:
  - At order submission (checkout + grower direct-order route): if the dispensary's licenseExpiry is set and in the past, block with a clear 403 ("License expired MM/DD/YYYY — update it in Settings; ordering resumes after re-verification") and flip licenseStatus to 'expired'.
  - Same principle for growers: if the grower's license is expired, their listings drop out of the buyer catalog (reuse W1a's filter with an OR on expiry) and their dashboard shows the blocking banner.
  - Admin: on /admin/growers and /admin/dispensaries add an "Expiring ≤30 days / Expired" filter chip and sort expired to the top; the existing LicenseExpiryBadge already colors these.
  - Buyer/grower settings already collect expiry — no new fields needed.

W1c. Grower-created "customers" pollute the real registry. POST /api/customers (grower "Add customer") creates a REAL User (no password) + Dispensary row. Those rows appear in the admin verification queue and the platform user list as if they were signups, and the dead User occupies the email forever. Fix: make grower-added customers explicit off-platform records — add `isOffPlatform Boolean @default(false)` (or `source` enum) to Dispensary, stop creating a User row entirely, exclude off-platform records from /admin/users, from the admin dispensary verification queue (or show them under a separate collapsed "Grower-recorded customers" group), and from anything buyer-facing. Grower direct orders to them still work (they already bypass buyer login). If a real dispensary later registers with the same email, offer nothing automatic — just don't block the signup (drop any unique collision with the dead User by not creating Users here).

━━━━━━━━ W2. QUOTE → ORDER CONTINUITY (P1 — negotiated prices literally cannot be transacted) ━━━━━━━━

Today an ACCEPTED quote only flips offerStatus (app/api/messages/messages/[id]/offer-action/route.ts) and renders a badge in chat. Nothing carries the agreed quantity/price into an order: the buyer's request draft knows nothing about quotes, and /api/checkout deliberately overwrites client prices with the CURRENT LIST PRICE. Net effect: a buyer who negotiated 50 × $55/g can only submit a request at $60 list — the negotiated term exists nowhere in the order record. Fix, staying settlement-free:

W2a. On quote ACCEPT, snapshot the terms: add an AcceptedQuote model (id, conversationId, messageId, growerId, dispensaryId, productId, quantity, unitPrice, note, acceptedAt, expiresAt default +14 days, consumedByOrderId nullable) written inside the existing accept transaction.

W2b. Honor accepted quotes at checkout: in /api/checkout, when building each order item, look up the newest unexpired unconsumed AcceptedQuote for (dispensaryId, growerId, productId); if found, use ITS unitPrice (and cap the quoted quantity at the quoted amount — quantities above it price at list), mark it consumed with the created order id, and include a `quotedItems` list in the response. Everything else keeps using server-side list price exactly as now.

W2c. Surface it to the buyer: in the request draft (dispensary/cart), for any line with an applicable accepted quote show a "Quoted: $55.00/g × up to 50" pill and use the quoted price in the estimate; after acceptance in chat, the existing "Terms accepted" bubble gets a "Add to request draft" button that adds the product at the quoted quantity/price (dispatch the same cart-update event the catalog uses).

W2d. Expire stale offers: OfferStatus.EXPIRED exists but is never set. When an offer message older than 14 days is still PENDING, treat it as expired at read time (offer-action returns 409 'Quote expired'; chat renders an Expired badge). No cron needed — evaluate on access.

W2e. Grower-side visibility: on the grower order detail page, if the order consumed an accepted quote, show "Priced by accepted quote from [date]" next to the line item so both sides see why the price differs from list.

Add a Playwright test: negotiate a quote (existing messaging spec flow) → accept as buyer → add to draft → submit → order item unitPrice equals the quoted price, quote marked consumed, second order falls back to list price.

━━━━━━━━ W3. SUBSCRIPTION ENFORCEMENT (plan promises are currently decorative) ━━━━━━━━

Nothing anywhere reads subscriptionPlan to gate behavior; the Free tier advertises "up to 50 product listings" and Pro advertises CSV import + advanced analytics, none of which is enforced or delivered (see W8 for CSV). Fix:

W3a. Central plan config: lib/plans.ts exporting PLAN_LIMITS = { free: { maxActiveListings: 50, csvImport: false, advancedAnalytics: false }, pro: {...unlimited/true...}, business: {...} } and a getGrowerPlan(grower) helper that treats subscriptionStatus past_due/canceled as free.

W3b. Enforce the listing cap where products are created: POST /api/products, the quick-add path, product duplication, and the CSV/bulk import all count the grower's non-deleted products first and return 402-style JSON ("Free plan includes 50 listings — upgrade to Pro") when at cap; surface that error in the product form/quick-add with an "Upgrade" link to /grower/pricing. Do NOT hide/delete existing over-cap listings if a subscription lapses — only block NEW creations.

W3c. Billing-state UX: when subscriptionStatus is 'past_due', show a dismissible amber banner on grower dashboard/settings ("Payment issue — update billing to keep Pro features") linking to the Stripe portal; when a Pro subscription is canceled at period end, the existing settings panel already shows dates — also reflect it in the dashboard checklist item.

W3d. Keep marketing honest: the landing/pricing feature lists must match what W3a actually gates (analytics stays available to all for now unless you also gate the reports page — gating reports is OPTIONAL; if you skip it, remove "Advanced analytics" from the Pro differentiators or reword to "Priority support & higher limits").

━━━━━━━━ W4. ONBOARDING GAPS ━━━━━━━━

W4a. Dispensaries register with zero license info and land on a dashboard that tells them ordering is locked, but nothing routes them to fix it. Add a guided first-run step: after dispensary registration (or first dashboard visit with licenseStatus=pending_review AND empty licenseNumber), show a prominent "Get verified to start ordering" card at the top of the dispensary dashboard with a 2-field inline form (license number, expiry) that PATCHes the existing settings API, then shows "Submitted for review — PhenoFarm verifies within 1 business day". The existing setup checklist keeps tracking the rest.

W4b. Growers: same pattern exists via marketplace-readiness checklist — just add the W1a "listings hidden until verified" banner state so the incentive is explicit.

W4c. Admin has queues but no signal for NEW signups since last visit. On /admin/dashboard, the "Pending verification" quick-list should order by createdAt desc and badge accounts created in the last 7 days with a "New" chip.

━━━━━━━━ W5. NOTIFICATIONS (biggest operational gap for an async two-sided market) ━━━━━━━━

There is no notification of anything: growers learn about new requests only by logging in; buyers learn about acceptance/delivery only by logging in; quote counters sit unseen. Chat polls only while the app is open. Implement a minimal, extensible in-app notification system (email OPTIONAL behind env):

W5a. Prisma model Notification { id, userId, type, title, body, href, readAt, createdAt } + index (userId, readAt, createdAt).

W5b. Emit on: order request created (→ grower user), order status change (→ the other side's user, with friendly label), quote sent/countered/accepted/rejected (→ recipient), dispensary verification decision (→ dispensary user), license expiring in 30 days (checked lazily on login/dashboard load, deduped per week). Write emissions inside the same transactions that mutate the data (checkout, status routes, offer-action, admin verify).

W5c. UI: a bell button in each portal's sidebar/header (next to search) with unread count, opening a simple dropdown/drawer list (title, relative time, mark-all-read); clicking navigates to href and marks read. Reuse the portal's existing styling. GET/PATCH /api/notifications with pagination (take 20).

W5d. Email (optional, env-gated): if RESEND_API_KEY (or SMTP_URL) is set, also send email for: new order request, verification decision, quote accepted. Plain, unstyled transactional templates with links into the app; no-op silently when env is absent. Never include pricing amounts in email subject lines.

━━━━━━━━ W6. GROWER-RECORDED DIRECT ORDERS NEED BUYER ACKNOWLEDGMENT ━━━━━━━━

/grower/orders/add lets a grower create an order against any verified dispensary, which then appears in that dispensary's Orders list as "Submitted" — indistinguishable from a request the buyer actually made, and the buyer never consents. Fix: add `createdBy` ('DISPENSARY' | 'GROWER') to Order (default DISPENSARY, set GROWER on the direct route). Buyer-side: grower-created orders render a "Recorded by grower" badge and, while PENDING, an explicit "Confirm request" / "Decline" action pair (Confirm = no-op acknowledgment flag or reuse existing self-cancel for Decline; add `buyerAcknowledgedAt` to Order and stamp it). Grower-side detail shows "Awaiting buyer confirmation" until acknowledged. Off-platform customers from W1c are exempt (no buyer to confirm — show "Off-platform record" instead).

━━━━━━━━ W7. ORDER AUDIT TRAIL ━━━━━━━━

Orders only persist shippedAt/deliveredAt; nobody can answer "who cancelled this and when". Add OrderStatusEvent { id, orderId, fromStatus, toStatus, actorUserId, actorRole, createdAt } and write it in EVERY path that changes status: /api/orders/[id]/status, /api/orders/batch-status, /api/orders/[id] PUT, checkout creation (initial Submitted event), grower direct-order creation. Render the trail as a compact "History" list (actor role + friendly labels + timestamp) under the existing Fulfillment Timeline on BOTH order detail pages. Backfill nothing; old orders just show fewer events.

━━━━━━━━ W8. CSV IMPORT HAS NO DOOR ━━━━━━━━

lib/product-import.ts and POST /api/products/bulk exist and are tested, but no UI reaches them — while the pricing page sells "CSV bulk upload" as a Pro feature. Add an "Import CSV" button on /grower/products (next to Quick add): a modal with (1) a downloadable template link (generate the CSV header row client-side from the import schema), (2) file picker, (3) dry-run preview table showing per-row parse results (create/update/error with reason) using the import lib's validation before committing, (4) commit button that calls the bulk API and reports created/updated/failed counts. Gate it per W3a (Pro/Business only; Free sees the button with a lock + upgrade link).

━━━━━━━━ W9. METRC HONESTY ━━━━━━━━

Metrc appears in plan features and landing copy as "integration ready", the schema has MetrcSyncLog, and env docs list METRC_* keys — but there is no sync code or UI. Keep the promise honest: leave copy as "Metrc-ready" ONLY where it says ready/prepared (that's accurate); remove/avoid any UI implying sync exists today. Add a short "Integrations" card in grower settings: "Metrc state-tracking sync — in development. Your batch and COA records are structured for it." No functional work.

━━━━━━━━ W10. PRICE-ALERT CHECKS ARE PAGE-LOCAL ━━━━━━━━

Alerts only re-evaluate when the buyer opens the price-alerts page (POST /api/dispensary/price-alerts/refresh from PriceAlertsContent). Buyers who don't visit never learn a price dropped. Cheap fix without background jobs: also fire the refresh (fire-and-forget) when the dispensary loads the catalog or dashboard (throttle to once per session via sessionStorage), and emit a W5 notification when refresh flips an alert to triggered. Keep the honest copy about when checks run.

━━━━━━━━ W11. RECORDS FOR DIRECT SETTLEMENT (the product's core value) ━━━━━━━━

Since settlement is direct, PhenoFarm's value is the RECORD. Two additions:
W11a. Grower per-customer statement: on /grower/customers/[id] (or expandable row), a "Statement" view listing that dispensary's delivered orders in a date range with order ids, dates, item lines, and total delivered value, plus a CSV export button — what a grower attaches to their own invoice. Reuse the reports export utilities.
W11b. Both order-detail pages get an "Export record (CSV)" action producing a single-order line-item export (id, dates from the W7 trail, items, quantities, unit prices incl. quoted flags from W2, totals, settlement note "Settled directly between businesses — no funds processed by PhenoFarm").

━━━━━━━━ VERIFICATION ━━━━━━━━

1. `npm run verify` passes; `npx prisma migrate dev` produces clean migrations for the new models/fields (AcceptedQuote, Notification, OrderStatusEvent, Order.createdBy/buyerAcknowledgedAt, Dispensary.isOffPlatform).
2. `npm run test` green, including the new quote→order Playwright test (W2) and existing messaging/order specs.
3. Manual: fresh grower signup → products hidden from a buyer until admin verifies (W1a); set a dispensary licenseExpiry in the past → checkout blocked with the expiry message (W1b).
4. Manual: accept a quote as buyer → add to draft → submit → order shows quoted price + grower detail shows the quote attribution (W2).
5. Free-plan grower with 50 listings → product create/quick-add/CSV blocked with upgrade message (W3b).
6. Grower records a direct order → dispensary sees "Recorded by grower" + Confirm/Decline (W6); notification bell shows the event on both sides (W5).
7. No new flow moves or implies moving wholesale funds; every new copy surface repeats direct settlement where relevant.
```
