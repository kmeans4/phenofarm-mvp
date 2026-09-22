# CursorAgent review remediation

Source: [CursorAgent review, commit 71d79e9](https://github.com/kmeans4/phenofarm-mvp/blob/71d79e909957c9032fc4dcd97a24f6eeea5ebfa2/docs/reviews/2026-09-17-full-code-review.md). A [local copy of the original review](2026-09-17-cursor-review.md) is retained alongside this record.

Reviewed against the current working copy on September 17, 2026. There are 126 numbered findings; IDs follow each section's original bullet order. Every finding has a disposition below. Some were already resolved by pre-existing local work and were verified rather than replaced. METRC credentials, schema and integrations were excluded as requested. Existing unrelated edits were preserved. The unused, clean `mission-control` copy named in A12 was removed after confirming it had no application references.

## Validation and review

- The combined local run passed all **50 regression cases** across the five suites listed below, including authenticated desktop/mobile journeys and isolated API/database fixtures.
- Targeted checks followed the relevant fixes. Independent reviews covered authentication, tenant boundaries, customer ownership, inventory concurrency, partial checkout, billing events and shared UI. Review discoveries were fixed and rechecked.
- The full `npm run verify` command passed: environment documentation, Prisma generation, production compilation and TypeScript checks. The final cleanup then passed full lint with **zero errors and zero warnings** and a standalone TypeScript check.
- Additional focused checks passed for mobile focus restoration, canonical logo previews, failed/aborted read acknowledgments, sent drafts across thread switches, newer quote edits, late send errors and storefront grid/list rendering at 1440px and 390px. The expanded server tests also passed for bounded read acknowledgments and invalid webhook signatures.
- The final diff whitespace check passed. Generated build-only changes to `next-env.d.ts` were restored.
- All database writes and migrations during verification targeted **localhost / phenofarm**. No live Stripe customer, subscription or charge was created. Subscription race tests used an isolated Stripe adapter and real local database transactions.
- No deployment, commit or push was performed. This document is local validation evidence, not production verification.

Repeatable regression suites:

- [Critical API, authentication, billing and concurrency regressions](../../tests/cursor-review-regressions.spec.ts)
- [Dispensary workflows and saved-state races](../../tests/dispensary-remediation.spec.ts)
- [Grower workflows and shared UI](../../tests/grower-review-regressions.spec.ts)
- [Admin and product API boundaries](../../tests/review-admin-and-product-apis.spec.ts)
- [Existing order, import, upload and settlement regressions](../../tests/order-inventory-and-import.spec.ts)

## Release prerequisites

1. **Configure production Blob storage.** A fresh read-only production configuration check found no `BLOB_READ_WRITE_TOKEN`. New uploads now require durable Blob storage in production and fail explicitly when it is unavailable. The local adapter was verified; production uploads were not exercised.
2. **Review production migration status and apply the task migrations before releasing the dependent code.** Four additive migrations provide rate limits/webhook receipts, managed customer ownership, order indexes and the pending checkout session field. They have been applied locally only. Pre-existing cleanup migrations remain separate and must follow their existing data checks.
3. **Migrate existing inline media after durable storage is configured.** `scripts/migrate-blobs.ts` is available and its shared decoder handles data URIs and legacy raw base64; the production backfill was not run. Existing references retain compatibility in the interim.
4. **Perform deployment and live verification separately.** The exposed fallback authentication secret was rotated locally, `.env` was removed from the Git index, and the current production authentication secret was confirmed to differ from the exposed one. METRC portions of the secret finding were intentionally skipped.

## Coverage

| Section | Area | Findings |
| --- | --- | ---: |
| A | Cross-cutting | 14 |
| B | Authentication | 6 |
| C | Subscriptions | 7 |
| D | Orders and checkout | 9 |
| E | Products and inventory | 11 |
| F | Customers | 3 |
| G | Dispensary APIs | 9 |
| H | Messaging | 3 |
| I | Administration | 4 |
| J | Shared components | 6 |
| K | Catalog component cleanup | 3 |
| L | Dispensary pages | 25 |
| M | Grower pages and shared UI | 26 |

## Item-by-item outcomes

### A01

**Critical** · Security · `.env:5-10`, `.gitignore` — `.env` with `AUTH_SECRET`, `METRC_API_KEY/SECRET` is committed. → Rotate secrets, `git rm --cached .env`, add `.env` to `.gitignore`.

**Status:** complete.

Stopped tracking .env and ignored environment files; rotated the exposed fallback AUTH_SECRET. A fresh production environment read confirmed its AUTH_SECRET differs from the exposed value. METRC keys were intentionally left untouched.

Files: [.gitignore](../../.gitignore), `.env`.

Checks: Git index no longer tracks .env; Production secret equality check returned false; values were not printed; Local active authentication tests passed.

### A02

**High** · Cost · `prisma/schema.prisma:172,182,40,88`; `app/api/products/upload/route.ts:31-56,66-89`; `app/api/products/upload-document/route.ts:29-46`; `app/api/grower/settings/route.ts:151-153`; `app/api/dispensary/settings/route.ts:165-167`; `app/api/batches/route.ts:112-113` — base64 images/PDFs/logos stored in DB columns with no size/count validation. → Move to Vercel Blob/S3, store URLs, enforce size limits server-side, serve through `next/image`.

**Status:** fixed locally; production storage setup required.

New image/PDF/logo writes use Vercel Blob URLs, with bounded content validation and a local-file development adapter. Multipart clients avoid inline uploads; legacy encoded values are converted on writes, and the migration utility supports legacy data. Production Blob setup and the existing-data migration remain release prerequisites. Authenticated thumbnails and temporary legacy previews retain ordinary image elements where image optimization would not carry session credentials; uploads are compressed and bounded before storage.

Files: [lib/blob-storage.ts](../../lib/blob-storage.ts), [lib/upload-validation.ts](../../lib/upload-validation.ts), [app/api/products/upload/route.ts](../../app/api/products/upload/route.ts), [app/api/products/upload-document/route.ts](../../app/api/products/upload-document/route.ts), [lib/profile-settings.ts](../../lib/profile-settings.ts), [scripts/migrate-blobs.ts](../../scripts/migrate-blobs.ts).

Checks: Valid image returns /uploads URL locally; Mismatched content and image count limits rejected; Fresh production environment read: Blob token absent.

### A03

**High** · Cost · `prisma/schema.prisma:163-207, 209-246` — no `@@index` on `Product.growerId`, `Product(growerId,isDeleted,isAvailable)`, `Order.growerId`, `Order.dispensaryId`, `Order(status,createdAt)`, `OrderItem.orderId`, `OrderItem.productId`, `CartItem.*`. → Add indexes and a migration.

**Status:** complete.

Verified existing product/order/item indexes and added account/date and status/date order indexes. Removed-cart tables need no indexes.

Files: [prisma/schema.prisma](../../prisma/schema.prisma), [prisma/migrations/20260917162000_order_query_indexes/migration.sql](../../prisma/migrations/20260917162000_order_query_indexes/migration.sql).

Checks: Migration applied successfully to localhost/phenofarm only; Scoped order and inventory regression queries passed.

### A04

**Medium** · Other · `prisma/migrations/20260316211000_add_product_status_draft/migration.sql` vs `prisma/schema.prisma:163-207`; `app/api/products/route.ts:96,174` — DB has a `products.status` enum column, the Prisma schema does not; code comments say "disabled until migration applied". → Reconcile (add the field to the schema or drop the column) before `prisma migrate` reports drift.

**Status:** already resolved; verified.

ProductStatus/status already exists in the current schema and write paths; retained and verified the reconciled implementation.

Files: [prisma/schema.prisma](../../prisma/schema.prisma), [lib/product-payload.ts](../../lib/product-payload.ts).

Checks: Published and draft fixture queries succeeded; Stock restoration preserves DRAFT visibility.

### A05

**Medium** · Other · `prisma/schema.prisma:248-256 (Session), 270-283 (Payment), 258-268 (MetrcSyncLog), 334-365 (Cart/CartItem)` — zero runtime references (`db.cart`/`db.payment`/`db.session` unused; JWT session strategy). → Remove, or implement (a server-side cart would fix several cart bugs below).

**Status:** already resolved; METRC portion skipped.

Current schema and migrations already remove unused Session/Payment/Cart tables; runtime uses JWT sessions and the shared validated browser cart. No METRC schema work was performed.

Files: [prisma/schema.prisma](../../prisma/schema.prisma).

Checks: No runtime db.cart/db.session/db.payment usage; Schema and order tests passed.

### A06

**Medium** · Cost · `prisma/client.ts:4-10` (eager `new PrismaClient` at import) used by `app/dispensary/grower/[id]/page.tsx:3`; everything else uses `lib/db.ts` — two connection pools per lambda. → Delete `prisma/client.ts`, standardize on `@/lib/db`.

**Status:** complete.

Removed the eager duplicate Prisma client after all application imports were standardized on lib/db.

Files: `prisma/client.ts`, [lib/db.ts](../../lib/db.ts).

Checks: Application import search found no references to removed client; TypeScript passed.

### A07

**Medium** · Cost · no `proxy.ts`/middleware; `getServerSession` is called in every layout **and** every page (31 files, e.g. `app/grower/layout.tsx:11` + `app/grower/dashboard/page.tsx:76`); `app/dispensary/layout.tsx:19-30,46` also runs `db.order.count` on every navigation. → Gate auth once (proxy or layout), pass the session down, load the badge count lazily or cache it.

**Status:** complete.

Request-memoized auth avoids duplicate session lookups while preserving guards at data access. The buyer navigation count is cached for 30 seconds with the account id in its cache key.

Files: [lib/auth-helpers.ts](../../lib/auth-helpers.ts), [app/grower/layout.tsx](../../app/grower/layout.tsx), [app/dispensary/layout.tsx](../../app/dispensary/layout.tsx).

Checks: Foreign/ownerless account regression passed; Admin data pages retain cached requireAdmin guards.

### A08

**Medium** · Cost · `app/providers.tsx:9` — `SessionProvider` without a `session` prop wraps the whole tree including `/`, `/legal/*`, `/help`, `/contact`, so every marketing page load triggers a `/api/auth/session` function invocation (plus refetch on window focus). → Move the provider into authenticated layouts and pass the server session.

**Status:** complete.

Removed the root SessionProvider and mounted it only in the authenticated grower, dispensary, and admin layouts with the server session supplied. The redirect-only dashboard now uses the shared auth helper.

Files: [app/providers.tsx](../../app/providers.tsx), [app/layout.tsx](../../app/layout.tsx), [app/grower/layout.tsx](../../app/grower/layout.tsx), [app/dispensary/layout.tsx](../../app/dispensary/layout.tsx), [app/admin/layout.tsx](../../app/admin/layout.tsx), [app/dashboard/page.tsx](../../app/dashboard/page.tsx).

Checks: Focused ESLint passed; Type generation passed; Provider scope source check passed.

### A09

**Low** · Speed · `app/page.tsx` + `app/landing/*.tsx` (all `'use client'`, framer-motion) — the marketing page ships a large client bundle; no `revalidate`/static caching anywhere in the app; `output: 'standalone'` in `next.config.js` is unnecessary on Vercel. → Make static sections server components, lazy-load motion.

**Status:** complete.

Converted the static footer and CSS-only principles marquee to server components, moved interactive landing motion to LazyMotion/m with an asynchronously loaded domMax feature bundle, and removed the unnecessary standalone output setting without caching private data.

Files: [app/landing/footer.tsx](../../app/landing/footer.tsx), [app/landing/marquee.tsx](../../app/landing/marquee.tsx), [app/page.tsx](../../app/page.tsx), [app/landing/motion.tsx](../../app/landing/motion.tsx), [app/landing/motion-features.ts](../../app/landing/motion-features.ts), [app/landing/cta.tsx](../../app/landing/cta.tsx), [app/landing/faq.tsx](../../app/landing/faq.tsx), [app/landing/feature-tour.tsx](../../app/landing/feature-tour.tsx), [app/landing/hero.tsx](../../app/landing/hero.tsx), [app/landing/money-flow.tsx](../../app/landing/money-flow.tsx), [app/landing/nav.tsx](../../app/landing/nav.tsx), [app/landing/personas.tsx](../../app/landing/personas.tsx), [app/landing/pricing.tsx](../../app/landing/pricing.tsx), [app/landing/social-proof.tsx](../../app/landing/social-proof.tsx), [next.config.js](../../next.config.js).

Checks: Focused ESLint passed; Landing TypeScript check passed for assigned files; Rendered desktop and mobile landing checks showed the hero heading; the lazy motion feature chunk loaded.

### A10

**Low** · Other · `lib/stripe.ts:6-16` mock Stripe object when key missing; `:11` `apiVersion` cast to `LatestApiVersion`; `:23-25` success/cancel/return URLs become relative when `NEXTAUTH_URL` is unset (Stripe rejects them). → Fail fast instead of mocking; pin a real API version.

**Status:** complete.

Removed mock Stripe success paths; lazy initialization fails closed, uses the real installed-SDK API version without a cast, and requires a valid absolute billing origin.

Files: [lib/stripe.ts](../../lib/stripe.ts), [app/api/grower/subscription/checkout/route.ts](../../app/api/grower/subscription/checkout/route.ts), [app/api/grower/subscription/portal/route.ts](../../app/api/grower/subscription/portal/route.ts).

Checks: Focused ESLint and TypeScript passed; Subscription configuration response regression passed.

### A11

**Low** · Other · `playwright.config.ts:11` defaults `baseURL` to the production URL and `tests/order-smoke.spec.ts` creates orders — `npm run test` mutates production. → Default to localhost.

**Status:** complete.

Playwright now defaults to the local loopback app and accepts an optional PLAYWRIGHT_CHANNEL for an installed Chrome channel, so the default test target cannot mutate production.

Files: [playwright.config.ts](../../playwright.config.ts).

Checks: Focused ESLint passed; TypeScript check is blocked by unrelated dirty-tree errors in cart/catalog and grower pages; no errors were reported in the assigned files.

### A12

**Low** · Other · repo clutter: `temp.tsx` (empty), root `seed-demo-users.ts` (near-duplicate of `scripts/seed-demo-users.ts`), `mission-control/` (unrelated static site), `fix-column.sql`, `prisma/schema.prisma.patch`, six `BUILD_SUMMARY*/MVP_PAGE_*` docs, both `.eslintrc.json` and `eslint.config.mjs`, unused `app/layout/SessionProviderWrapper.tsx`, `lib/animations.ts`, `app/lib/haptic.ts`; 35 lint warnings (unused vars in `app/api/products/upload-document/route.ts:42,85`, `app/api/dispensary/search-suggestions/route.ts:37`, etc.). → Remove.

**Status:** complete.

Removed the review-listed unused artifacts, duplicate seed entrypoint, stale lint config, obsolete provider/helpers, old build docs and the unused mission-control static-site copy after confirming a clean Git state and no application references. Removed remaining unused imports/parameters. Authenticated thumbnails retain documented native image handling, with lazy decoding and explicit dimensions.

Files: [README.md](../../README.md), `.eslintrc.json`, `temp.tsx`, `seed-demo-users.ts`, `fix-column.sql`, `prisma/schema.prisma.patch`, `app/layout/SessionProviderWrapper.tsx`, `lib/animations.ts`, `app/lib/haptic.ts`, `app/components/Layout.tsx`, `app/grower/products/components/ProductTable.tsx`, `app/grower/products/components/ProductCard.tsx`, `app/grower/products/components/ProductActions.tsx`, `app/grower/products/components/InventoryToggle.tsx`, `app/grower/products/components/DeleteButton.tsx`, `app/grower/products/components/EditButton.tsx`, `app/grower/products/components/index.ts`, `BUILD_SUMMARY_DASHBOARD.md`, `BUILD_SUMMARY_DASHBOARD_PAGE_1.md`, `BUILD_SUMMARY_ITERATION_1.md`, `BUILD_SUMMARY_ITERATION_2.md`, `MVP_PAGE_1_COMPLETE.md`, `MVP_PAGE_2_COMPLETE.md`, `MVP_PAGE_2_SUMMARY.md`, [app/hooks/useToast.ts](../../app/hooks/useToast.ts), `mission-control/cron-calendar.js`, `mission-control/cron-calendar.css`, `mission-control/index.html`, [app/api/growers/me/route.ts](../../app/api/growers/me/route.ts), [tests/auth-screenshots.spec.ts](../../tests/auth-screenshots.spec.ts), [app/dispensary/grower/[id]/GrowerShopContent.tsx](../../app/dispensary/grower/%5Bid%5D/GrowerShopContent.tsx), [app/dispensary/grower/[id]/page.tsx](../../app/dispensary/grower/%5Bid%5D/page.tsx).

Checks: Repository reference search found no imports for removed helpers/components; Focused ESLint passed; No secrets were added or printed; Full application lint passed with zero errors and zero warnings after cleanup; Review-listed static-site files were clean and had no external references in this repository.

### A13

**Low** · Other · `app/dashboard/layout.tsx:17-38` reads `user.businessName/firstName/lastName` (not in session → renders "undefined undefined") and links to `/dashboard/inventory`, `/dashboard/orders`, `/dashboard/admin`, none of which exist; `app/dashboard/page.tsx` only redirects. → Delete the layout.

**Status:** complete.

Deleted the dead dashboard layout; /dashboard remains a role redirect without undefined profile labels or links to nonexistent child routes.

Files: `app/dashboard/layout.tsx`, [app/dashboard/page.tsx](../../app/dashboard/page.tsx).

Checks: Next route type generation passed; Focused ESLint passed.

### A14

**Medium** · Edge case · `app/admin/growers/page.tsx:152`, `app/admin/dispensaries/page.tsx:152`, `app/admin/users/page.tsx:73` — links to `/auth/register`, which does not exist (route is `/auth/sign_up`) → 404. → Fix the hrefs.

**Status:** complete.

Corrected empty-state admin signup links to the existing /auth/sign_up route and verified no /auth/register links remain in admin or landing code.

Files: [app/admin/growers/page.tsx](../../app/admin/growers/page.tsx), [app/admin/dispensaries/page.tsx](../../app/admin/dispensaries/page.tsx), [app/admin/users/page.tsx](../../app/admin/users/page.tsx).

Checks: Unsafe-link source search passed; Focused ESLint passed.

### B01

**Medium** · Edge case · `lib/auth.ts:31-33` — `findUnique({ email: credentials.email })` without trim/lowercase, while registration lowercases (`app/api/auth/register/route.ts:17`). Users typing a capitalized email cannot sign in. → Normalize in `authorize`.

**Status:** complete.

Credentials email is trimmed and lowercased before lookup.

Files: [lib/auth.ts](../../lib/auth.ts).

Checks: Real credential authorization with uppercase padded email passed.

### B02

**Medium** · Security · `app/api/auth/register/route.ts:27`, `app/auth/sign_up/page.tsx:57`, `lib/auth.ts:25-56` — 6-character minimum password, no rate limiting or lockout on register/login, no CAPTCHA. → Add rate limiting (Vercel WAF or KV counter) and a stronger password policy.

**Status:** complete.

Registration requires 12 characters with a 72-byte bcrypt ceiling. Login and registration use durable hashed counters with atomic database increments.

Files: [lib/auth.ts](../../lib/auth.ts), [lib/auth-rate-limit.ts](../../lib/auth-rate-limit.ts), [app/api/auth/register/route.ts](../../app/api/auth/register/route.ts), [app/auth/sign_up/page.tsx](../../app/auth/sign_up/page.tsx), [prisma/migrations/20260917160000_review_security/migration.sql](../../prisma/migrations/20260917160000_review_security/migration.sql).

Checks: Nine concurrent counter requests allowed exactly three; Short registration password rejected.

### B03

**Medium** · Edge case · `app/api/auth/register/route.ts:34-47` — check-then-create race → concurrent duplicate email hits the unique constraint → 500 instead of 409; `:71` dispensary path uses raw `businessName` (can be `''`) while the grower path uses `resolvedBusinessName` (`:61`). → Catch `P2002`; use `resolvedBusinessName` for both.

**Status:** complete.

Concurrent duplicate email registration returns 409; both profile types use the resolved business name within the existing transaction.

Files: [app/api/auth/register/route.ts](../../app/api/auth/register/route.ts).

Checks: Concurrent registration returned one 201 and one 409; Dispensary blank-business-name fallback persisted correctly.

### B04

**Medium** · Edge case · `lib/auth.ts:63-86` — 30-day JWT snapshots `role/growerId/dispensaryId/email`; settings email changes (`app/api/grower/settings/route.ts:162-166`, `app/api/dispensary/settings/route.ts:176-181`) never refresh the token so `email !== user.email` is true on every save (extra `user.update` each time), and admin un-verification/role changes are not reflected until re-login. → Re-read the user in the `jwt` callback periodically or on `trigger === 'update'`.

**Status:** complete.

JWT callbacks refresh user role, email, and real profile relations every minute or on explicit session update; removed users lose their session identity.

Files: [lib/auth.ts](../../lib/auth.ts).

Checks: JWT update reflected changed role and email; Missing grower profile denied by protected APIs.

### B05

**Low** · Edge case · `app/auth/sign_in/page.tsx:119-127` "Remember me" does nothing; `:36` pushes to `/dashboard` which immediately redirects again (extra function hit); `app/auth/error/page.tsx` ignores `?error=`. → Remove or wire the checkbox; redirect by role directly.

**Status:** complete.

Sign-in and registration navigate directly by role; the inert remember checkbox and ignored auth error were already corrected in the local source.

Files: [app/auth/sign_in/page.tsx](../../app/auth/sign_in/page.tsx), [app/auth/sign_up/page.tsx](../../app/auth/sign_up/page.tsx), [app/auth/error/page.tsx](../../app/auth/error/page.tsx).

Checks: Focused lint passed; Direct role destinations and error mapping inspected.

### B06

**Medium** · Security · undefined-owner filter pattern: `where: { growerId: user.growerId }` where `growerId` may be `undefined` (Prisma treats `undefined` as "no filter") in `app/api/products/[id]/route.ts:73,100,194`, `app/api/inventory/route.ts:22,61-64`, `app/api/orders/[id]/route.ts:481-485` (DELETE checks role only), `app/api/products/upload/route.ts:62,72,86,133`, `app/api/products/upload-document/route.ts:43`, `app/grower/dashboard/page.tsx:96`, `app/grower/orders/page.tsx:26,46`, `app/grower/inventory/page.tsx:40`, `app/grower/customers/page.tsx:21`. A GROWER user without a `growerId` (admin-created/seeded) can read or mutate every grower's data. → Add a central `requireGrower()` helper that 403s when the id is missing.

**Status:** complete.

Added reusable requireGrower and strict profile-id checks to APIs/pages; missing-owner sessions never reach an unscoped Prisma filter.

Files: [lib/auth-helpers.ts](../../lib/auth-helpers.ts), [app/api/inventory/route.ts](../../app/api/inventory/route.ts), [app/api/products/[id]/route.ts](../../app/api/products/%5Bid%5D/route.ts), [app/api/dispensaries/route.ts](../../app/api/dispensaries/route.ts).

Checks: Ownerless account GET/POST denied 403; Foreign product access returned 404 without changing stock.

### C01

**High** · Edge case · `app/api/stripe/webhooks/route.ts:125-141, 57-85` — no `event.id` dedupe and no ordering guard; a retried `checkout.session.completed` sets `subscriptionStatus:'active'` over a later `past_due`/`canceled`. → Persist processed event ids; on checkout completion only store customer/subscription ids and let `customer.subscription.*` own status (or fetch the subscription from Stripe).

**Status:** complete.

Webhook receipts and updates commit together. Duplicate events are ignored, older events cannot overwrite newer state, canonical subscription reads handle stale snapshots, and checkout only links ids.

Files: [lib/subscription-events.ts](../../lib/subscription-events.ts), [app/api/stripe/webhooks/route.ts](../../app/api/stripe/webhooks/route.ts).

Checks: Duplicate event, canceled-then-old-checkout, and canceled-then-old-subscription tests passed.

### C02

**Medium** · Edge case · `app/api/stripe/webhooks/route.ts:78-80` — `customer.subscription.deleted` keeps `subscriptionPlan` (`'pro'`) with status `'canceled'`; `app/grower/dashboard/page.tsx:191` treats `plan === 'pro'` as subscribed. → Reset plan to `'free'` on deleted/canceled/unpaid and gate on `status === 'active' || 'trialing'` only.

**Status:** complete.

Only active/trialing subscriptions grant paid entitlements across shared helpers, dashboard and CSV import. Canceled/unpaid subscriptions reset to free.

Files: [lib/plans.ts](../../lib/plans.ts), [lib/subscription-events.ts](../../lib/subscription-events.ts), [lib/subscription.ts](../../lib/subscription.ts), [app/grower/dashboard/page.tsx](../../app/grower/dashboard/page.tsx), [app/grower/products/page.tsx](../../app/grower/products/page.tsx).

Checks: Canceled and unpaid entitlement checks passed; Rendered canceled/unpaid/trialing dashboard fixtures passed.

### C03

**Medium** · Edge case · `app/api/stripe/webhooks/route.ts:62, 131` — `metadata.plan` trusted without validating against `'pro'|'business'`. → Validate, or derive from `price.id` only.

**Status:** complete.

Plan mapping derives solely from configured Stripe price ids rather than arbitrary metadata.

Files: [lib/stripe.ts](../../lib/stripe.ts), [lib/subscription-events.ts](../../lib/subscription-events.ts).

Checks: Malicious metadata plan ignored in signed-event processing logic test.

### C04

**Medium** · Edge case · `app/api/stripe/webhooks/route.ts:128` — `db.grower.update` on an unknown `growerId` throws P2025 → 500 → Stripe retries indefinitely. → Use `updateMany`/catch and return 200.

**Status:** complete.

Unknown subscription customers/profile ids safely affect zero rows and can be acknowledged.

Files: [lib/subscription-events.ts](../../lib/subscription-events.ts).

Checks: Unknown grower checkout event processed without exception.

### C05

**Low** · Security · `app/api/stripe/webhooks/route.ts:111-115, 163` — if `STRIPE_SECRET_KEY` is unset in production, `stripe.webhooks.constructEvent` is the mock returning `null`, and the route answers 200 `received` without processing; `webhookSecret!` non-null assertion. → Return 503 when unconfigured.

**Status:** complete.

Every environment requires configured Stripe credentials, webhook secret, and a valid signature; missing configuration returns 503 and processing failures return retryable 500.

Files: [app/api/stripe/webhooks/route.ts](../../app/api/stripe/webhooks/route.ts).

Checks: Unsigned bypass removed by source review; Focused lint/type checks passed; Unsigned and invalid-signature webhook HTTP requests rejected and left billing state unchanged.

### C06

**Low** · Other · `app/api/grower/subscription/checkout/route.ts:57-77` — creates a new Stripe Customer per attempt when `stripeCustomerId` is null (`customer_email`), never persisting it until the webhook, and does not block growers who already have an active subscription. → Create/persist the customer first; refuse checkout when active.

**Status:** complete.

Subscription checkout is serialized per grower and persists one pending session. Same-plan retries reuse it; changing plans expires the prior session first; completed checkout blocks duplicates while billing syncs. A plan-independent idempotency key also prevents duplicate creation after an ambiguous external response.

Files: [lib/subscription-checkout.ts](../../lib/subscription-checkout.ts), [app/api/grower/subscription/checkout/route.ts](../../app/api/grower/subscription/checkout/route.ts), [prisma/migrations/20260917163000_subscription_checkout/migration.sql](../../prisma/migrations/20260917163000_subscription_checkout/migration.sql).

Checks: Local real-database regression passed with an isolated Stripe adapter: simultaneous same/different plans, completed checkout before webhook, ambiguous response and retry, active subscription rejection; Independent second review confirmed the original cross-plan race was resolved; No live Stripe customer or charge created.

### C07

**Low** · Cost · `app/api/grower/subscription/route.ts` + `app/components/settings/SubscriptionBilling.tsx:24-27` — subscription state fetched client-side on every settings visit. → Render it in the server page.

**Status:** complete.

A shared subscription-summary service supplies the server-rendered settings page and API.

Files: [lib/subscription.ts](../../lib/subscription.ts), [app/api/grower/subscription/route.ts](../../app/api/grower/subscription/route.ts), [app/grower/settings/page.tsx](../../app/grower/settings/page.tsx).

Checks: Subscription response regression passed; Grower page passes initial billing state.

### D01

**High** · Edge case · `app/api/checkout/route.ts:283-287` + `app/dispensary/cart/page.tsx:298-321` — multi-grower partial success returns 200 with `issues`; the client wipes the whole cart, including items that were *not* ordered, and redirects. → Return per-grower results and only remove ordered items.

**Status:** complete.

Checkout returns grower ids and exact ordered product ids; failed grower groups remain in issues even after earlier success. The shared cart removes only successful lines.

Files: [app/api/checkout/route.ts](../../app/api/checkout/route.ts), [lib/cart.ts](../../lib/cart.ts), [app/dispensary/cart/page.tsx](../../app/dispensary/cart/page.tsx).

Checks: Mixed available/sold-out checkout produced one order and retained the failed item; Buyer partial-success/double-submit browser regression passed; Independent review confirmed the entire per-grower read/validation/write path is within its catch, preserving earlier committed successes on later read failures.

### D02

**Medium** · Edge case · `app/api/checkout/route.ts:120` unguarded `request.json()` (500 on bad JSON); `:120,257` `notes` unvalidated (type/length); `:252` and `app/api/orders/route.ts:225` `orderId = ORD-${Date.now()}...` collides under concurrency → unique violation → 500. → Validate body; use the `cuid()` default / add retry.

**Status:** complete.

Malformed JSON, cart bounds and notes now return 400. Collision-safe random request ids with retry were already present and retained.

Files: [app/api/checkout/route.ts](../../app/api/checkout/route.ts), [app/api/orders/route.ts](../../app/api/orders/route.ts), [lib/order-id.ts](../../lib/order-id.ts).

Checks: Malformed checkout body rejected; Rapid direct orders produced distinct ids.

### D03

**Medium** · Edge case · `app/api/checkout/route.ts:100-118`, `app/api/orders/route.ts:91-109` — gating checks `licenseStatus === 'verified'` only; `licenseExpiry` is never checked and nothing ever sets `expired` (`docs/dispensary-license-verification.md` describes an admin PATCH that doesn't exist). `app/api/dispensary/settings/route.ts:146-149` lets a verified dispensary change `licenseNumber`/`licenseState` without resetting `licenseStatus`. → Check expiry at checkout; reset to `pending_review` on license edits.

**Status:** complete.

Checkout/direct order paths check license expiry; changes to license identity or expiry reset profile verification in the same transaction. License dates remain valid through the expiry day in Vermont, with matching API, marketplace and UI checks.

Files: [lib/profile-settings.ts](../../lib/profile-settings.ts), [app/api/checkout/route.ts](../../app/api/checkout/route.ts), [app/api/orders/route.ts](../../app/api/orders/route.ts), [lib/license.ts](../../lib/license.ts).

Checks: Buyer license edit set pending_review/isVerified false/verifiedAt null; Grower license edit removed verification; Today accepted and yesterday/invalid calendar dates rejected by settings API; UTC and daylight-saving midnight boundary regression passed.

### D04

**Medium** · Edge case · `app/api/checkout/route.ts:232-235` — `isPriceVisible=false` products can be ordered at the hidden catalog price. → Reject or require an accepted quote.

**Status:** complete.

Hidden-price products require an unexpired accepted quote covering the entire requested quantity; the hidden catalog price is never a fallback.

Files: [app/api/checkout/route.ts](../../app/api/checkout/route.ts).

Checks: Hidden product without quote returned 409 and left stock unchanged; Visible-product quote consumption and list-price fallback test passed; Partial hidden-price quote rejected without consumption; fully covered order succeeded.

### D05

**Medium** · Edge case · `app/api/orders/[id]/route.ts:460-525` DELETE — non-transactional inventory restore + hard delete, allowed for PROCESSING; inconsistent with the soft-cancel in `orders/[id]/status/route.ts`. → Remove DELETE or make it a transactional cancel.

**Status:** complete.

Legacy DELETE delegates to transactional status cancellation, preserving order/items/history. Compare-and-set claiming prevents concurrent mutation side effects.

Files: [app/api/orders/[id]/route.ts](../../app/api/orders/%5Bid%5D/route.ts), [lib/order-mutations.ts](../../lib/order-mutations.ts).

Checks: Parallel DELETE, single cancel and batch cancel restored stock once; Order and exactly one cancellation audit event retained.

### D06

**Medium** · Edge case · `app/api/orders/[id]/status/route.ts:91-96`, `app/api/orders/[id]/route.ts:276-281`, `app/api/orders/batch-status/route.ts:131-136` — cancellation restores `inventoryQty` but not `isAvailable` (auto-set false at 0 by `app/api/products/[id]/route.ts:155-160`), so the product stays hidden. → Re-enable when qty > 0 (or flag it for the grower).

**Status:** complete.

Restoring canceled quantities re-enables exhausted published products; manually hidden stocked products and drafts keep their visibility.

Files: [lib/order-mutations.ts](../../lib/order-mutations.ts), [app/api/orders/[id]/status/route.ts](../../app/api/orders/%5Bid%5D/status/route.ts), [app/api/orders/batch-status/route.ts](../../app/api/orders/batch-status/route.ts).

Checks: Overlapping cancellation restored quantity and availability once; Edit reconciliation regression passed.

### D07

**Medium** · Edge case · `app/api/orders/route.ts:113-115, 183-187` — `shippingFee` unvalidated (negative allowed); `GET :303-312` unpaginated with items for every order, and ADMIN role → 400 (`:299`). → Validate; paginate.

**Status:** complete.

Direct orders validate finite non-negative shipping/notes; order reads retain bounded cursor pagination and explicitly deny unsupported admin API usage.

Files: [app/api/orders/route.ts](../../app/api/orders/route.ts).

Checks: Negative shipping rejected 400; Direct order lifecycle and amount tests passed.

### D08

**Low** · Cost · `app/api/orders/[id]/status/route.ts:35-38` — `include: { grower: true }` (full row incl. Stripe ids) to compare one id. → `select: { growerId, dispensaryId, status, shippedAt, deliveredAt }`.

**Status:** complete.

Status mutations load only the related user/name fields needed for authorization and notifications; order detail responses project required customer/product fields.

Files: [app/api/orders/[id]/status/route.ts](../../app/api/orders/%5Bid%5D/status/route.ts), [app/api/orders/[id]/route.ts](../../app/api/orders/%5Bid%5D/route.ts).

Checks: Existing scoped relation projection verified; Order lifecycle and edit checks passed.

### D09

**Low** · Edge case · `app/api/orders/batch-status/route.ts:87-91` — overwrites existing `shippedAt`/`deliveredAt` timestamps on re-transition. → Only set when null.

**Status:** complete.

Batch transitions preserve existing shipped/delivered timestamps and skip same-status changes, with a transaction claim per order.

Files: [app/api/orders/batch-status/route.ts](../../app/api/orders/batch-status/route.ts).

Checks: Valid/invalid batch lifecycle regression passed; Parallel batch cancellation regression passed.

### E01

**High** · Edge case · `app/api/products/[id]/route.ts:128-152` + `app/grower/products/[id]/edit/page.tsx:33-51` — `thcMin/thcMax/cbdMin/cbdMax/harvestDate` are parsed (`lib/product-payload.ts:225-229`) and editable (`app/grower/products/components/ProductForm.tsx:875-971`) but never written on PUT and not loaded into `initialData` → edits silently dropped and fields always blank. → Add the five fields to `updateData` and `initialData`.

**Status:** complete.

PUT and the editor now persist/load thcMin/thcMax/cbdMin/cbdMax/harvestDate; date-only inputs become real Date objects before Prisma writes.

Files: [app/api/products/[id]/route.ts](../../app/api/products/%5Bid%5D/route.ts), [app/grower/products/[id]/edit/page.tsx](../../app/grower/products/%5Bid%5D/edit/page.tsx).

Checks: Five-field persistence regression passed after harvest-date format correction.

### E02

**High** · Cost · `app/api/products/route.ts:106-123` — returns every product with base64 `images`, `description`, `batch.terpenes` JSON, unpaginated; consumed by `app/grower/products/page.tsx:249`, `app/grower/orders/add/page.tsx:43`, `app/grower/inventory/add/page.tsx:31`, none of which render images. → Add a summary projection (`select` without images) and pagination.

**Status:** complete.

Product summaries omit media/description/batch JSON; the products page uses server pagination, filtered counts, and an aggregate inventory value.

Files: [app/api/products/route.ts](../../app/api/products/route.ts), [app/grower/products/page.tsx](../../app/grower/products/page.tsx).

Checks: TypeScript passed; Pagination and summary shape covered by grower regressions.

### E03

**High** · Other · `app/grower/products/api/upload/route.ts:85-103` — writes `strain/category/subcategory/thc/cbd` fields that don't exist on `Product` → Prisma throws on every request; duplicate of `/api/products/bulk`. → Delete.

**Status:** already resolved; verified.

The obsolete upload route already returns explicit 410 with the canonical CSV endpoint, preserving a useful error for old clients without running broken Prisma writes.

Files: [app/grower/products/api/upload/route.ts](../../app/grower/products/api/upload/route.ts).

Checks: Legacy POST returned 410 in CSV regression.

### E04

**Medium** · Edge case · `app/api/products/route.ts:86-87,122` — `sortBy`/`sortOrder` passed straight to `orderBy` → `?sortBy=foo` = Prisma validation error → 500. → Whitelist.

**Status:** complete.

Product sort field/direction are allowlisted; malformed values cannot become arbitrary Prisma keys.

Files: [app/api/products/route.ts](../../app/api/products/route.ts).

Checks: TypeScript passed; Invalid sort query covered by focused API regression.

### E05

**Medium** · Cost · `app/api/inventory/route.ts:21-26` — `include: { grower: true }` per product (Stripe fields), no `isDeleted` filter, no `select`; `:60-68` P2025 → 500 instead of 404. → `select` needed fields; filter deleted; catch not-found.

**Status:** complete.

Inventory uses a small projection, filters soft-deleted products, strictly scopes owners, and returns 404 for missing records or 409 for stale stock.

Files: [app/api/inventory/route.ts](../../app/api/inventory/route.ts).

Checks: Ownerless/foreign reads denied; Missing inventory product returned 404.

### E06

**Medium** · Edge case · `app/api/products/bulk/route.ts:47-97` — naive `split(',')` (breaks on quoted commas), one `create` per row, `parseFloat` NaN price, `name: ''` allowed, no row/file-size cap; template at `:117-119` differs from the other upload route's template. → Use `csv-parse` (already a dependency), validate rows through `parseProductPayload`, `createMany`.

**Status:** already resolved; verified.

Existing CSV parser handles quoting, per-row validation, caps, and atomic bulk creation; retained the single canonical template and import path.

Files: [app/api/products/bulk/route.ts](../../app/api/products/bulk/route.ts), [lib/product-import.ts](../../lib/product-import.ts).

Checks: CSV invalid-row/all-or-nothing/import regression passed.

### E07

**Medium** · Edge case · `app/api/products/upload/route.ts:31-56,72,86` and `app/api/products/upload-document/route.ts:42` — no size/count limits, `update` with `where:{growerId}` throws P2025 → 500 rather than 404, and neither endpoint is called by the client (ProductForm inlines base64 in JSON). → Delete, or make this the real upload path with limits and blob storage.

**Status:** complete.

The multipart endpoints are now used by forms and store URL references; byte signatures/size/count and ownership checks precede persistence.

Files: [app/api/products/upload/route.ts](../../app/api/products/upload/route.ts), [app/api/products/upload-document/route.ts](../../app/api/products/upload-document/route.ts), [app/grower/products/components/ProductForm.tsx](../../app/grower/products/components/ProductForm.tsx).

Checks: Valid upload returned local URL; Wrong file contents/count rejected; Foreign product association denied.

### E08

**Medium** · Edge case · `app/api/products/[id]/route.ts:155-160` — increasing inventory from 0 without `isAvailable` in the body leaves the product unavailable; growers must toggle manually. → Auto-enable or surface in the UI.

**Status:** complete.

Increasing exhausted stock auto-enables published products unless visibility is explicitly supplied; inventory updates preserve draft/manual hidden states.

Files: [app/api/products/[id]/route.ts](../../app/api/products/%5Bid%5D/route.ts), [app/api/inventory/route.ts](../../app/api/inventory/route.ts).

Checks: Exhausted published product restored availability; Draft stock increase stayed hidden.

### E09

**Low** · Edge case · `app/api/product-type-config/route.ts:85-90` — `type`/`subTypes` unvalidated (non-string items → 500; unbounded length). → Validate.

**Status:** complete.

Validated product type config input, including trimmed bounded type names and bounded non-empty string subTypes.

Files: [app/api/product-type-config/route.ts](../../app/api/product-type-config/route.ts).

Checks: focused ESLint passed; assigned-route TypeScript check passed; git diff --check passed; PLAYWRIGHT_BASE_URL=http://localhost:3144 PLAYWRIGHT_CHANNEL=chrome node --env-file=.env.local node_modules/@playwright/test/cli.js test: 2 passed (3.8s), including malformed product config inputs returning 400.

### E10

**Low** · Edge case · `app/api/strains/route.ts:126-134`, `app/api/batches/route.ts:93-99` — check-then-create races (unique constraints exist → 500); names untrimmed/unbounded; the "missing `strainType` column" fallbacks (`app/api/strains/route.ts:7-30,64-91,149-174`, `app/api/strains/[id]/route.ts:7-30,72-100,170-195`) are dead since migration `20260317101500`. → Catch `P2002`; delete fallbacks.

**Status:** complete.

Trimmed and bounded strain and batch names, return 409 for unique races, added the strain summary selector contract, and removed obsolete missing-strainType fallbacks.

Files: [app/api/strains/route.ts](../../app/api/strains/route.ts), [app/api/strains/[id]/route.ts](../../app/api/strains/%5Bid%5D/route.ts), [app/api/batches/route.ts](../../app/api/batches/route.ts), [app/api/batches/[id]/route.ts](../../app/api/batches/%5Bid%5D/route.ts).

Checks: focused ESLint passed; assigned-route TypeScript check passed; git diff --check passed; Local Playwright regression passed: strain and batch duplicate races returned one 201 and one 409; summary response had exactly id/name/genetics/strainType.

### E11

**Low** · Edge case · `app/api/batches/route.ts:106-113`, `app/api/batches/[id]/route.ts:119-129` — `parseFloat` NaN, `new Date(harvestDate)` invalid → 500; `terpenes`/`testResults` JSON unbounded (holds 10 MB PDFs). → Validate; move PDFs out of JSON.

**Status:** complete.

Validated finite bounded cannabinoid metrics and harvest dates, bounded JSON payloads, persisted legacy lab document data URLs through blob storage, redacted lab blobs from batch lists with labDocumentCount, and retained full individual batch GET data.

Files: [app/api/batches/route.ts](../../app/api/batches/route.ts), [app/api/batches/[id]/route.ts](../../app/api/batches/%5Bid%5D/route.ts), [lib/blob-storage.ts](../../lib/blob-storage.ts).

Checks: focused ESLint passed; assigned-route TypeScript check passed; git diff --check passed; Local Playwright regression passed: invalid metrics/date/oversized JSON returned 400; batch list omitted testResults and reported labDocumentCount 1; individual GET retained persisted lab URL.

### F01

**Critical** · Security · `app/api/customers/[id]/route.ts:172-179` (DELETE any dispensary, cascades orders/conversations), `:29-46` (GET any dispensary incl. `licenseReviewNotes` + user email), `:71-133` (PUT can change another business's `User.email`), `app/api/customers/route.ts:46-52` (GET lists every dispensary with emails), `app/grower/customers/[id]/edit/page.tsx:24-32` (IDOR page). → Scope to dispensaries with an order/conversation relationship to the caller's grower; remove DELETE for `userId`-backed dispensaries.

**Status:** complete.

Customer APIs and pages scope records to owned contacts or existing trading relationships. Only owned off-platform contacts without any history can be deleted; platform user/profile data cannot be edited by growers.

Files: [lib/customers.ts](../../lib/customers.ts), [app/api/customers/route.ts](../../app/api/customers/route.ts), [app/api/customers/[id]/route.ts](../../app/api/customers/%5Bid%5D/route.ts), [app/grower/customers/[id]/edit/page.tsx](../../app/grower/customers/%5Bid%5D/edit/page.tsx), [app/api/dispensaries/route.ts](../../app/api/dispensaries/route.ts).

Checks: Cross-account read returned 404 and write 403; Platform account/history deletion rejected; Owned contact update succeeded.

### F02

**Medium** · Edge case · `app/api/customers/[id]/route.ts:82` — `isPlatformManaged = Boolean(existingDispensary.userId)`; `userId` is non-nullable so it is always `true` and every update branch (`:106-133`) is dead — PUT is a silent no-op that returns 200. → Decide the intended behavior and remove the dead branches.

**Status:** complete.

Removed the silent platform-managed update path. Supported off-platform contact edits save; unsupported platform edits return explicit 403.

Files: [app/api/customers/[id]/route.ts](../../app/api/customers/%5Bid%5D/route.ts).

Checks: Owned contact business name/ZIP persisted; Platform email edit rejected.

### F03

**Medium** · Edge case · `app/api/customers/route.ts:123-149` — creates a user with a `Math.random()` password that is never communicated, non-transactional (orphan user if the dispensary create fails), email not normalized, stores `''` instead of `null`. → Use an invite flow (or `$transaction` + `crypto.randomBytes`).

**Status:** already resolved model; input/ownership hardened.

Off-platform contacts are single owned Dispensary records, with normalized email and nullable optional fields; no orphan login or uncommunicated password is generated.

Files: [app/api/customers/route.ts](../../app/api/customers/route.ts).

Checks: Contact create normalized email; User/profile ownership checks passed.

### G01

**High** · Cost · `app/api/dispensary/catalog/route.ts:238-247, 261-291` — `include` fetches full Product rows (base64 `images`, legacy cols) then maps ~15 fields; `count` and `findMany` are sequential (`:238,241`); `trending` loads 1000 rows + orderItems and sorts in memory (`:243-259`). → Use `select`, `Promise.all`, a `groupBy` on `order_items` for trending; return only a thumbnail URL.

**Status:** complete.

Catalog uses a narrow product projection, separate lazy thumbnail URLs, parallel count/data/facet reads, and database quantity aggregation plus paging for trending; full image arrays and order-item collections are no longer serialized in catalog rows.

Files: [lib/buyer-products.ts](../../lib/buyer-products.ts), [app/api/dispensary/catalog/route.ts](../../app/api/dispensary/catalog/route.ts), [app/api/dispensary/products/[id]/thumbnail/route.ts](../../app/api/dispensary/products/%5Bid%5D/thumbnail/route.ts).

Checks: Catalog projection/thumbnail response regression passed; Trending quantity aggregation excluded cancelled demand in fixture; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G02

**Medium** · Edge case · `app/api/dispensary/catalog/route.ts:70-71` — `parseInt` NaN → `Math.max(1, NaN)` → Prisma error on `?page=abc`; no `isDeleted:false` in `catalog/route.ts:84-87`, `app/api/dispensary/products/route.ts:72-75`, `app/api/dispensary/catalog/products/route.ts:28-31`, `app/api/search/route.ts:34-40,144-153`, `app/api/dispensary/search-suggestions/route.ts:46-49`; no grower `isVerified` filter anywhere, so unverified growers are shown to buyers. → Validate params; add filters.

**Status:** complete.

Pagination strictly validates/caps integers. Catalog, compatibility products, search, suggestions, saved details, and thumbnails exclude deleted/draft listings and unverified/expired growers.

Files: [lib/buyer-products.ts](../../lib/buyer-products.ts), [app/api/dispensary/catalog/route.ts](../../app/api/dispensary/catalog/route.ts), [app/api/dispensary/products/route.ts](../../app/api/dispensary/products/route.ts), [app/api/search/route.ts](../../app/api/search/route.ts), [app/api/dispensary/search-suggestions/route.ts](../../app/api/dispensary/search-suggestions/route.ts).

Checks: Deliberately available DRAFT fixture excluded from catalog and returned unavailable by cart validation; Invalid page/limit returned a valid bounded response; Deleted and unverified fixture products were absent; hidden prices were null; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G03

**Medium** · Edge case · `app/api/dispensary/products/route.ts:100,123,128` — THC, price, and search each assign `where.OR`, overwriting the previous → only the last filter applies; `:63-64` `page`/`limit` uncapped (cart requests `limit=200`). Only caller is the cart's inventory check (`app/dispensary/cart/page.tsx:110`). → Replace with `POST /api/dispensary/cart/validate { productIds }`.

**Status:** complete.

Cart now validates only its exact product IDs through a dedicated endpoint. The legacy products route delegates to the bounded catalog route with combined AND-compatible filters.

Files: [app/api/dispensary/cart/validate/route.ts](../../app/api/dispensary/cart/validate/route.ts), [app/api/dispensary/products/route.ts](../../app/api/dispensary/products/route.ts), [app/dispensary/cart/page.tsx](../../app/dispensary/cart/page.tsx).

Checks: Exact-ID validation preserved requested unavailable/missing records; Combined THC, price, and text filter regression passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G04

**Low** · Other · `app/api/dispensary/catalog/products/route.ts` — no callers (dead); three overlapping catalog endpoints with different shapes. → Delete.

**Status:** complete.

Removed the unused catalog/products endpoint after checking callers; retained the old products endpoint as a bounded compatibility wrapper.

Files: `app/api/dispensary/catalog/products/route.ts`, [app/api/dispensary/products/route.ts](../../app/api/dispensary/products/route.ts).

Checks: Repository caller search found no consumers of deleted route; Compatibility endpoint covered by combined-filter regression; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G05

**Medium** · Cost · `app/api/dispensary/favorites/route.ts:83-95`, `app/api/dispensary/price-alerts/route.ts:220-239`, `app/api/dispensary/saved-filters/route.ts:142-158` — full replace (`deleteMany` + N `create`) on every PUT, and the clients PUT on every toggle; bodies parsed before auth (`favorites:63`, `price-alerts:199`, `saved-filters:131`). → `createMany({skipDuplicates})` + diff, or per-item POST/DELETE; authenticate before parsing.

**Status:** complete.

Saved endpoints authenticate before parsing, validate mutations, and preserve unchanged records. Favorites/alerts support per-item PATCH; saved filters use transactional semantic diffs and createMany rather than full replacement.

Files: [app/api/dispensary/favorites/route.ts](../../app/api/dispensary/favorites/route.ts), [app/api/dispensary/price-alerts/route.ts](../../app/api/dispensary/price-alerts/route.ts), [app/api/dispensary/saved-filters/route.ts](../../app/api/dispensary/saved-filters/route.ts), [app/dispensary/hooks/useBuyerCollection.ts](../../app/dispensary/hooks/useBuyerCollection.ts).

Checks: Delayed canonical saved-filter GET with different server ID did not resurrect a cached filter removed before hydration completed; No mount-time PUT/PATCH observed in rendered regression; Favorite IDs and unchanged saved-filter record IDs survived no-op updates; Malformed alert write did not delete persisted alerts; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G06

**Low** · Other · "missing table" fallbacks (`favorites/route.ts:26-33,52-56`, `price-alerts/route.ts:133-140`, `price-alerts/refresh/route.ts:83-90`, `saved-filters/route.ts:75-82`) are dead since migration `20260609150000`; `price-alerts/refresh/route.ts:104-133` recomputes from client-supplied alerts and returns them without persisting. → Delete fallbacks; persist or drop the client-alerts branch.

**Status:** complete.

Removed missing-table success fallbacks. Alert refresh reads and conditionally updates server-owned saved alerts, returning an error on failure instead of an empty synthetic list; caller-supplied alert records are ignored.

Files: [app/api/dispensary/favorites/route.ts](../../app/api/dispensary/favorites/route.ts), [app/api/dispensary/price-alerts/route.ts](../../app/api/dispensary/price-alerts/route.ts), [app/api/dispensary/price-alerts/refresh/route.ts](../../app/api/dispensary/price-alerts/refresh/route.ts), [app/api/dispensary/saved-filters/route.ts](../../app/api/dispensary/saved-filters/route.ts), [lib/buyer-alerts.ts](../../lib/buyer-alerts.ts).

Checks: Malformed refresh response preserved client and database alert records; Refresh transaction and conditional duplicate-notification guard reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G07

**Low** · Cost · `app/api/dispensary/search-suggestions/route.ts:45-85` three sequential queries; strains searched across all growers regardless of listing (`:59-68`); `limit` unused (`:37`); hardcoded `popular` (`:97-102`). → `Promise.all`; scope strains to available products.

**Status:** complete.

Suggestions run independent queries concurrently, honor a capped limit, scope strain/grower matches to eligible available listings, and omit fabricated popular suggestions.

Files: [app/api/dispensary/search-suggestions/route.ts](../../app/api/dispensary/search-suggestions/route.ts).

Checks: Unlisted strain excluded from suggestions and requested limit honored; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G08

**Low** · Cost · `app/api/search/route.ts:33-140` — 4 sequential queries (grower) / 2 (dispensary) → `Promise.all`; `$${o.totalAmount}` prints a raw Decimal. → Parallelize; format.

**Status:** complete.

Role-scoped search queries run in parallel and order Decimal amounts are formatted as USD. Buyer search uses verified listing filters and hides private catalog prices.

Files: [app/api/search/route.ts](../../app/api/search/route.ts).

Checks: Fixture order rendered $12.50 in search result; Source review confirmed Promise.all for each role and explicit profile guards; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### G09

**Medium** · Edge case · `app/api/dispensary/settings/route.ts:176-181`, `app/api/grower/settings/route.ts:162-167` — email update with no format/uniqueness check → P2002 → 500 after the profile row was already updated (non-transactional), not lowercased; `logo` base64 unbounded (`:165-167` / `:151-153`). → Validate/normalize email, wrap in `$transaction`, limit logo size.

**Status:** complete.

Profile/email updates are validated and atomic, normalized email conflicts return 409 without partial profile changes, and logo-only PATCH cannot submit unrelated fields.

Files: [lib/profile-settings.ts](../../lib/profile-settings.ts), [app/api/grower/settings/route.ts](../../app/api/grower/settings/route.ts), [app/api/dispensary/settings/route.ts](../../app/api/dispensary/settings/route.ts).

Checks: Duplicate-email save rolled back profile changes; Normalized email and isolated logo save succeeded.

### H01

**High** · Cost · `app/api/messages/conversations/route.ts:91-104` — N+1 `conversationMessage.count` per conversation (≤100) per request, hit every 15–30 s per user by `ChatDrawer`. → Compute unread counts in one query (raw SQL / `groupBy` with `createdAt > lastReadAt AND senderUserId != me`) and cut polling (see section M).

**Status:** complete.

Unread counts use one grouped query with per-conversation read boundaries; ChatDrawer polling is limited to an open visible pane and incremental messages. Read acknowledgments now stop at the last displayed incoming message, advance monotonically and return the remaining unread count.

Files: [app/api/messages/conversations/route.ts](../../app/api/messages/conversations/route.ts), [app/components/messaging/ChatDrawer.tsx](../../app/components/messaging/ChatDrawer.tsx), [app/api/messages/conversations/[id]/read/route.ts](../../app/api/messages/conversations/%5Bid%5D/read/route.ts).

Checks: Grouped-query source review; Incremental message fixture test passed; Real API regression passed for unauthorized/own-message bounds, same-timestamp unseen messages, and stale acknowledgment retry without erasing newer unread messages.

### H02

**Medium** · Edge case · `app/api/messages/conversations/[id]/messages/route.ts:106-114` clients can post `SYSTEM` messages; `:103` body unbounded; `:104,157` `productId` not validated against the conversation's grower; `:151-173` message create + conversation update non-transactional. `app/api/messages/conversations/route.ts:200-229` `findFirst`+`create` race can create duplicate conversations (unique index dropped in `20260416095800`). → Whitelist types, bound body, validate product, use `$transaction`.

**Status:** complete.

Messages reject SYSTEM/unbounded input and foreign products; writes update conversation timestamps transactionally. Participant/context advisory locks prevent duplicate conversation creation.

Files: [app/api/messages/conversations/route.ts](../../app/api/messages/conversations/route.ts), [app/api/messages/conversations/[id]/messages/route.ts](../../app/api/messages/conversations/%5Bid%5D/messages/route.ts).

Checks: Concurrent conversation creation returned one id; SYSTEM/foreign-product/oversized message requests rejected; Incremental cursor returned only the new message.

### H03

**Low** · Edge case · `app/api/messages/messages/[id]/offer-action/route.ts:39-41,64-67` — accept/reject is check-then-update; two responders can both accept. → `updateMany({ where: { id, offerStatus: 'PENDING' } })` and check `count`.

**Status:** already resolved; expiration path hardened.

Existing accept/reject/counter compare-and-set claims were retained; expiration now also uses a pending-only update after ownership authorization.

Files: [app/api/messages/messages/[id]/offer-action/route.ts](../../app/api/messages/messages/%5Bid%5D/offer-action/route.ts).

Checks: Accepted quote single consumption regression passed; Pending-only claims verified; Concurrent offer accept returned exactly one success and one conflict.

### I01

**Medium** · Security · `app/api/admin/seed/route.ts:36,71,87` — GET with side effects creating accounts with hardcoded `password123` and a pre-verified dispensary, reachable in production by admins. → Gate to non-production or remove (release notes acknowledge this).

**Status:** complete.

Made admin demo seeding POST-only, disabled it in production, hid the developer seed panel in production, required DEMO_SEED_PASSWORD in non-production, and replaced error responses with generic messages; updated the dashboard button to POST.

Files: [app/api/admin/seed/route.ts](../../app/api/admin/seed/route.ts), [app/admin/components/SeedDataButton.tsx](../../app/admin/components/SeedDataButton.tsx), [app/admin/dashboard/page.tsx](../../app/admin/dashboard/page.tsx).

Checks: Focused ESLint passed; Seed route source check confirmed GET is 405 and production is gated; No password or database error is returned to clients; The same local Playwright command passed 2 tests (3.8s), including seed GET 405 and authenticated non-admin POST 403.

### I02

**Low** · Edge case · `app/admin/dispensaries/[id]/verify/route.ts:39`, `app/admin/growers/[id]/verify/route.ts:36` — `NextResponse.redirect` after POST is 307 (method preserved → browser re-POSTs to the list page). No CSRF token (relies on SameSite=Lax cookies). → Use status 303.

**Status:** complete.

Changed browser redirects after grower and dispensary verification POSTs to 303 so the follow-up request is a GET.

Files: [app/admin/growers/[id]/verify/route.ts](../../app/admin/growers/%5Bid%5D/verify/route.ts), [app/admin/dispensaries/[id]/verify/route.ts](../../app/admin/dispensaries/%5Bid%5D/verify/route.ts).

Checks: Focused ESLint passed; Source check confirmed both redirects use status 303; Local Playwright regression passed: grower and dispensary verification POSTs returned 303 with the expected list locations.

### I03

**Low** · Other · admin pages re-check session/role already done by `app/admin/layout.tsx` (`dashboard/page.tsx:11-30`, `dispensaries/page.tsx:34-50`, `growers/page.tsx:34-50`, `users/page.tsx:18-36`, `settings/page.tsx:59-67`); `app/admin/growers/page.tsx:194-198` hardcodes "Subscription review / Billing portal not yet connected" though `subscriptionPlan/Status` exist; `app/admin/dashboard/page.tsx:35-42` runs 6 counts where 2 are derivable. → Remove duplicate checks; show real subscription data.

**Status:** complete.

Removed duplicate admin page session/role checks now covered by the authenticated admin layout, derived the grower review count from total and verified counts, and retained the real subscription plan/status/period display on the grower queue.

Files: [app/admin/layout.tsx](../../app/admin/layout.tsx), [app/admin/dashboard/page.tsx](../../app/admin/dashboard/page.tsx), [app/admin/growers/page.tsx](../../app/admin/growers/page.tsx), [app/admin/dispensaries/page.tsx](../../app/admin/dispensaries/page.tsx), [app/admin/users/page.tsx](../../app/admin/users/page.tsx), [app/admin/settings/page.tsx](../../app/admin/settings/page.tsx).

Checks: Focused ESLint passed; Admin page auth search shows layout-only page gating; Type generation passed; Local Playwright regression passed: unauthenticated admin navigation redirected to sign-in; authenticated desktop and mobile admin pages rendered.

### I04

**Low** · Cost · `app/admin/users/page.tsx:47`, `app/admin/growers/page.tsx:82`, `app/admin/dispensaries/page.tsx:83` — `take: 100` with no pagination controls. → Paginate.

**Status:** complete.

Added page query parameters, filtered counts, bounded database reads, and previous/next controls to admin users, cultivators, and dispensaries lists while preserving active filters.

Files: [app/admin/users/page.tsx](../../app/admin/users/page.tsx), [app/admin/growers/page.tsx](../../app/admin/growers/page.tsx), [app/admin/dispensaries/page.tsx](../../app/admin/dispensaries/page.tsx).

Checks: Focused ESLint passed; Source check found no take:100 admin list reads; Type generation passed; Local Playwright regression passed: desktop admin users pagination advanced from 25 of 26 to 1 of 26 and mobile navigation opened.

### J01

**Medium** · Cost · `app/grower/orders/page.tsx:24-55` two full `findMany` with includes for four numbers → `groupBy`/`aggregate`; `app/grower/orders/history/page.tsx:26-43` unpaginated; `app/grower/dashboard/page.tsx:94-106,177-180` "Delivered value" computed from the last 100 orders only (wrong beyond 100). → Aggregate in SQL; paginate.

**Status:** complete.

Replaced full order hydration for dashboard/request statistics with grower-scoped groupBy aggregates; added 50-row active/history pagination and computes dashboard delivered value from all delivered orders.

Files: [app/grower/dashboard/page.tsx](../../app/grower/dashboard/page.tsx), [app/grower/orders/page.tsx](../../app/grower/orders/page.tsx), [app/grower/orders/history/page.tsx](../../app/grower/orders/history/page.tsx), [app/components/ui/Pagination.tsx](../../app/components/ui/Pagination.tsx).

Checks: Local browser fixture with 105 delivered orders showed $105 rather than last-100 truncation; History showed 105 requests with pagination; detail/edit and active request pages rendered; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### J02

**Medium** · Edge case · `app/grower/reports/page.tsx:44,190,220` "Active Customers" = `db.dispensary.count()` (all dispensaries on the platform); status chart / averages use `take: 50` (`:38-42,48-63`); three sequential `$queryRaw` after the `Promise.all` (`:71-132`). → Scoped `groupBy`; parallelize.

**Status:** complete.

Reports now aggregate all grower/range-scoped orders, count distinct related customers, group top entities by ID, and execute independent report queries in parallel.

Files: [app/grower/reports/page.tsx](../../app/grower/reports/page.tsx).

Checks: Reports rendered with 106 local orders and another unrelated grower; All summary/chart queries reviewed for growerId and range scope; recent list alone remains bounded at10; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### J03

**Medium** · Cost · `app/grower/marketplace/page.tsx:21-27` full products (base64 images) while rendering an emoji placeholder (`:108-110`); `app/grower/orders/[id]/page.tsx:45-56` `dispensary: true` + full `product`; `app/grower/orders/[id]/edit/page.tsx:8-22` ships the whole `Dispensary` row (`licenseReviewNotes`, `logo`), base64 product images, and Prisma `Decimal` instances (`...item.product` → `price/thcMin/...`) as client props (RSC serialization warnings, `{s,e,d}` objects on the client). → Use `select`; convert Decimals.

**Status:** complete.

Replaced broad marketplace/order relation includes with required-field selects and explicitly serialized Decimal values before client props. Current marketplace uses its image; kept that required preview field.

Files: [app/grower/marketplace/page.tsx](../../app/grower/marketplace/page.tsx), [app/grower/orders/[id]/page.tsx](../../app/grower/orders/%5Bid%5D/page.tsx), [app/grower/orders/[id]/edit/page.tsx](../../app/grower/orders/%5Bid%5D/edit/page.tsx).

Checks: Local marketplace, request detail, and request editor returned200 with no page errors; Reviewed projected customer/product fields to exclude profile metadata and full product image payloads from order editor; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### J04

**Low** · Cost · `app/grower/customers/page.tsx:27-30` includes all order ids to count → `_count`; `app/grower/catalog/page.tsx:46-49` full scan of `price/inventoryQty` → raw `SUM(price*qty)` aggregate.

**Status:** complete.

Customer summaries use scoped order groupBy counts/sums/latest dates, include newly owned off-platform contacts, and use offPlatformEmail/contactName fallback. Catalog inventory value uses database SUM(price*inventoryQty).

Files: [app/grower/customers/page.tsx](../../app/grower/customers/page.tsx), [app/grower/catalog/page.tsx](../../app/grower/catalog/page.tsx).

Checks: Local customer/catalog pages rendered; owned fixture contact is associated with the grower; Reviewed customerWhere scope and aggregate values; no order-ID list hydration; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### J05

**Low** · Edge case · `app/grower/inventory/page.tsx:30-36`, `app/grower/customers/page.tsx:9-15` no role check (layout covers it); `app/grower/products/[id]/edit/page.tsx:29-31` redirects instead of `notFound()`.

**Status:** complete.

Retained explicit grower-role/owner checks on inventory/customers, uses the request-memoized auth helper, and returns notFound for missing owned products.

Files: [app/grower/inventory/page.tsx](../../app/grower/inventory/page.tsx), [app/grower/customers/page.tsx](../../app/grower/customers/page.tsx), [app/grower/products/[id]/edit/page.tsx](../../app/grower/products/%5Bid%5D/edit/page.tsx).

Checks: Server authorization and owner filters inspected; Product edit browser fixture loaded all five previously dropped fields; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### J06

**Medium** · Speed · `app/grower/settings/page.tsx:9-14`, `app/dispensary/settings/page.tsx:21-37`, `app/dispensary/catalog/page.tsx:20`, `app/dispensary/favorites/page.tsx:24`, `app/dispensary/price-alerts/page.tsx:24` — server pages with the session in hand render client components that immediately fetch the same data (`app/grower/settings/components/SettingsForm.tsx:185-231`, `app/components/settings/SubscriptionBilling.tsx:24-27`, `app/components/settings/CommercialTermsPanel.tsx:20-27`, favorites/alerts/saved-filters GETs) → shell → spinner → fetch waterfall, 3 API invocations on the grower settings page alone. → Fetch server-side and pass initial data (the `defaultValues` prop already exists but is always blank).

**Status:** complete.

Grower settings preloads profile, commercial terms, and subscription in the server page; shared panels accept initial data. Buyer preloads are covered by the dispensary owner.

Files: [app/grower/settings/page.tsx](../../app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](../../app/grower/settings/components/SettingsForm.tsx), [app/components/settings/CommercialTermsPanel.tsx](../../app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](../../app/components/settings/SubscriptionBilling.tsx).

Checks: Settings showed saved profile without initial profile/subscription/terms API requests; Mobile settings rendered without horizontal document overflow; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### K01

**Medium** · Cost · `app/dispensary/dashboard/page.tsx:40-55` 100 orders + items + products to derive three "featured" rows; `app/dispensary/orders/page.tsx:24-50` all orders, unpaginated, spreads the full row; `app/dispensary/orders/[id]/page.tsx:50-56` `grower: true` (Stripe ids) + `product: true` (images), `Record<string, unknown>` casts (`:76-96`), strain uses only `strainLegacy` (`:85-87`). → `select`; paginate; use the strain relation.

**Status:** complete.

Dashboard statistics use aggregates with a small recent list; orders are paginated/searchable across the complete history with narrow selects; detail rows select only required grower/product fields and use the strain relation.

Files: [app/dispensary/dashboard/page.tsx](../../app/dispensary/dashboard/page.tsx), [app/dispensary/orders/page.tsx](../../app/dispensary/orders/page.tsx), [app/dispensary/orders/[id]/page.tsx](../../app/dispensary/orders/%5Bid%5D/page.tsx).

Checks: 102-order fixture proved all-history totals and 25-row pagination; Detail/page projections reviewed for Stripe fields and encoded image leakage; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### K02

**Medium** · Security · `app/dispensary/grower/[id]/page.tsx:21-57` all products with `strain: true, batch: true` (terpenes/testResults incl. PDFs), base64 images, unused `user.email` and `description`, via the second Prisma client (`:3`); `:164-173` `href={grower.website}` unsanitized (`javascript:` possible); `:186-192` inert "Contact Grower"/"Follow Shop" buttons; `:46-52,212-214` "Orders Filled" counts cancelled orders; no `isVerified` gate. → Select fields; enforce `http(s)://`; wire or remove buttons; count delivered only.

**Status:** complete.

Grower shop uses the shared database, slim buyer products, lazy image URLs, a verified/unexpired grower gate, and safe HTTP(S) website URLs. Existing working messaging actions and delivered-only filled-order metric were retained and reviewed. Storefront grid/list switches have accessible names; product images use explicit dimensions and lazy decoding. On mobile, list actions move below product details to avoid overflow.

Files: [app/dispensary/grower/[id]/page.tsx](../../app/dispensary/grower/%5Bid%5D/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](../../app/dispensary/grower/%5Bid%5D/GrowerShopContent.tsx), [lib/buyer-products.ts](../../lib/buyer-products.ts).

Checks: Shared db import and bounded selected field shape inspected; Nullable hidden-price client handling type-checked; URL scheme, eligibility, and delivered count source checks passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used; Authenticated thumbnail/legacy logo rendering, grid/list switching and no horizontal overflow passed at 1440px and 390px.

### K03

**Low** · Edge case · `app/dispensary/saved/page.tsx:25-44,62-64` — `orderCount` counts line items, not orders. → Count distinct orders.

**Status:** complete.

Recent-product summaries count each product once per order, even when quote and list pricing create two order-item lines.

Files: [app/dispensary/saved/page.tsx](../../app/dispensary/saved/page.tsx), [app/api/dispensary/recent-products/route.ts](../../app/api/dispensary/recent-products/route.ts).

Checks: Split-price fixture counted one order in recent-products API; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L01

**Critical** · Edge case · `app/dispensary/catalog/CatalogContent.tsx:772-773,846-850,673` — `fetchProducts` early-returns when `isLoading`; refetch effect deps exclude it, so filter/search changes during an in-flight request are dropped (grid shows results for "o" after typing "og kush"); search fires per keystroke with no debounce. → Remove the guard, use a request-sequence ref + `AbortController`, debounce 300 ms.

**Status:** complete.

Catalog uses one debounced request effect with cancellation and a sequence guard; the latest search/filter state always wins even while a previous request is pending.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx).

Checks: Delayed initial request followed by new search displayed only latest results; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L02

**High** · Edge case · `CatalogContent.tsx:838-850,824-827` — mount fires two fetches (initial effect + deps effect), and `finally` on the aborted one flips `isLoading` false while the replacement is in flight. → Collapse into one effect; only touch loading for the latest request.

**Status:** complete.

Removed the duplicate catalog fetch chain; only the latest request can update products/loading/error. Collection hydration does not redundantly refetch ordinary catalog data.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx).

Checks: Delayed/latest-query rendered regression passed; Request effect/abort cleanup reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L03

**High** · Cost · `CatalogContent.tsx:352-389,406-443,478-517` — saved-filters/favorites/price-alerts each set state and the ready flag in the same tick → up to 3 GET + 6 PUT on every catalog mount; every heart/bell click PUTs the full list. → Set the ready flag after commit; diff/debounce; per-item endpoints.

**Status:** complete.

Shared collection synchronization hydrates without writes, preserves edits during GET, debounces diffs, sequences mutations, and flushes pending changed state on unmount.

Files: [app/dispensary/hooks/useBuyerCollection.ts](../../app/dispensary/hooks/useBuyerCollection.ts), [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx).

Checks: Delayed canonical saved-filter GET with different server ID did not resurrect a cached filter removed before hydration completed; Catalog mount produced no saved collection PUT/PATCH requests; Saved tab return did not repeat initial favorites GET; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L04

**High** · Cost · `CatalogContent.tsx:982-1001,510-513,330-336` — `StoredPriceAlert.productImage` and persisted `compareList` products carry full base64 images → localStorage `QuotaExceededError` (swallowed at `:334`) and re-PUT on every change. → Store ids only.

**Status:** complete.

Compare persistence contains IDs only; price-alert cache stores bounded reference/target metadata. Product images and entire product objects are excluded from persistence.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/hooks/useBuyerCollection.ts](../../app/dispensary/hooks/useBuyerCollection.ts).

Checks: Storage serialization paths inspected for productImage/base64 removal; Storage failure handling covered by helper source review; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L05

**Medium** · Edge case · `CatalogContent.tsx:318-336,1660-1685,2075,2119-2123` — compare list restored unvalidated with stale `price/inventoryQty`; a malformed entry crashes on `product.grower.id`; save effect writes `[]` over storage before load lands. → Store ids, normalize on read, refresh from current products.

**Status:** complete.

Comparison IDs are validated, old object-shaped entries normalize to IDs, current product data is fetched before display, and a hydration/touched guard prevents an initial empty write or late restore overwriting edits.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx).

Checks: Comparison hydration/serialization and deleted-detail handling reviewed; Malformed cart/storage behavior regression covers common helpers; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L06

**Medium** · Edge case · `CatalogContent.tsx:636-655,681-683` — suggestion fetches have no abort/sequence guard (stale overwrite); debounce timer never cleared on unmount. → Abort/sequence; clear timer.

**Status:** complete.

Suggestion requests use a debounce, cancellation, and sequence guard; cleanup clears timers and aborts pending work.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx).

Checks: Suggestion request effect and cleanup reviewed; Eligible/limited suggestions API regression passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L07

**Medium** · Edge case · `CatalogContent.tsx:702-708` vs `1136-1198` — keyboard `highlightedIndex` over a list that includes hidden "Popular" items → Enter selects an invisible item; no `role="listbox"`/`aria-activedescendant`. → Single visible-items array; add ARIA.

**Status:** complete.

Rendering and keyboard selection use one visible suggestion array, with combobox/listbox/option semantics and an active descendant.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx).

Checks: Shared visible array and keyboard bounds reviewed; Rendered search flow passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L08

**Medium** · Edge case · `CatalogContent.tsx:247,1707-1714` `showCompareBar` never set back to true; `:871-873,1357,853-868` "Favorites only" filters loaded pages client-side while infinite scroll keeps loading non-favorites; counts use `products.length`. → Reset flag in `addToCompare`; filter server-side.

**Status:** complete.

Adding comparison items reopens the bar. Favorites filtering and counts now happen on the server before pagination, using the current favorite IDs.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx), [app/api/dispensary/catalog/route.ts](../../app/api/dispensary/catalog/route.ts).

Checks: Server favorites predicate/count path reviewed; Favorite diff/detail regression passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L09

**Medium** · Other · `CatalogContent.tsx:2283,2571,2400-2403,2676-2678,2702-2706` — "MOQ" badge fabricated as `ceil(price/50)`; misleading to buyers. → Remove or add a real `minOrderQty` column.

**Status:** complete.

Removed fabricated minimum-order quantities and their price-derived calculation; no unsupported MOQ is presented as a product fact.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx).

Checks: Source search verified fabricated MOQ calculation/badges removed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L10

**Medium** · Other · `CatalogContent.tsx:1732-2182` four modals with no `role="dialog"`/`aria-modal`/focus trap/Escape; `:1986` vs `components/MobileFilterSheet.tsx:66,71` conflicting body-scroll cleanup; `:295-315` URL→state sync exists but state→URL never (`?product=` from `app/dispensary/saved/SavedContent.tsx:119` never read). → Shared `<Modal>` primitive; `router.replace` on filter change.

**Status:** complete.

Catalog save/alert dialogs use the shared accessible Modal; existing comparison/request dialogs retain focus/Escape semantics with shared scroll locking. Filters synchronize both ways with the URL, and product deep-link highlighting is retained.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](../../app/dispensary/catalog/components/MobileFilterSheet.tsx), [app/components/ui/Modal.tsx](../../app/components/ui/Modal.tsx).

Checks: 390px filter dialog staged changes, Escape dismissal, and scroll restoration passed; Desktop/mobile catalog screenshots inspected; no overflow; URL guard and preserved product deep-link handling reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L11

**Low** · Edge case · `CatalogContent.tsx:1536` `&apos;` rendered literally in a string prop; `:1048-1052,1927-1929` success text stored in `requestPricingError` (red); `:2435,2443,2671,2683,2084,2007-2008` `thc &&` hides 0%; `:553-560,1399` saved filters omit `recentlyAdded/trending`; `:611-612,658-668` popular searches fetched on every mount; `:2576-2616` icon buttons without `aria-label`/`type="button"`.

**Status:** complete.

Fixed literal apostrophe text, zero-percent cannabinoid rendering, complete saved filter values, redundant popular-search fetching, and icon control labels/types. Existing separate request-pricing success feedback was retained.

Files: [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx), [lib/catalog-filters.ts](../../lib/catalog-filters.ts).

Checks: Zero THC fixture displayed correctly in rendered catalog; Saved-filter normalization retains recentlyAdded/trending; Accessible icon controls and success styling reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L12

**Medium** · Edge case · `app/dispensary/catalog/components/AddToCartButton.tsx:55-66,94-95` — cart parsed without shape validation (`cart.items.findIndex` throws); computes `tax = subtotal*0.06` while `cart/page.tsx:59` and the checkout API use 0; `:54,103` timers not cleared; `:114-175` missing `type="button"`/labels. `components/CartBadge.tsx:5-17` re-parses cart JSON in `getSnapshot` on every render. → Shared `lib/cart.ts` read/write/totals helper; cache snapshot by raw string.

**Status:** complete.

Shared cart helpers validate shape, cache snapshots, strip unsafe/encoded images, and compute consistent zero-tax totals. Add controls use proper button types/labels and clear feedback timers.

Files: [lib/cart.ts](../../lib/cart.ts), [app/dispensary/catalog/components/AddToCartButton.tsx](../../app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](../../app/dispensary/catalog/components/CartBadge.tsx).

Checks: Cart malformed shape/zero-tax/merge regression passed; Add/quantity button semantics and timer cleanup reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L13

**Low** · Other · `components/MobileFilterSheet.tsx:76-89,106-110,142-146,115-131,176-185,3` — swipe-close only on `e.target === e.currentTarget`, "Clear All" applies immediately vs "Show Results", stale `activeFilterCount`, no dialog semantics, unused `Clock`; `THC_RANGES/PRICE_RANGES/FilterState` duplicated from `CatalogContent.tsx:50-56,93-105`. → Fix behaviors; share constants.

**Status:** complete.

Mobile filters stage all edits including Clear All until Apply, calculate pending counts, support swipe-handle descendants, and share filter constants/types; accessible focus/scroll behavior uses shared hooks.

Files: [app/dispensary/catalog/components/MobileFilterSheet.tsx](../../app/dispensary/catalog/components/MobileFilterSheet.tsx), [lib/catalog-filters.ts](../../lib/catalog-filters.ts).

Checks: 390px staged clear/apply and Escape test passed; No horizontal overflow; screenshot visually inspected; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L14

**High** · Edge case · `app/dispensary/cart/page.tsx:163-190,104` — `setMounted(true)` runs before the async inventory sync resolves; the persist effect writes the initial empty cart to `phenofarm-cart` and dispatches `cart-updated`. Navigating away before `/api/dispensary/products` responds (or a non-array `items`) permanently wipes the cart. → Hydrate synchronously; persist only after hydration and when changed.

**Status:** complete.

Cart hydrates validated storage synchronously before enabling persistence, writes only changes, and reconciles inventory with the current draft. Navigating away during validation cannot write an initial empty cart.

Files: [app/dispensary/cart/page.tsx](../../app/dispensary/cart/page.tsx), [lib/cart.ts](../../lib/cart.ts).

Checks: Slow-inventory navigation preserved stored cart before and after leaving; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L15

**High** · Edge case · `app/dispensary/cart/page.tsx:298-321` — client side of the partial-success bug (clears the whole cart on 200 + `issues`). → Remove only ordered growers' items; keep issue items with a notice.

**Status:** complete.

Checkout removes only the exact successfully ordered product IDs; unsuccessful growers/items remain with an issue notice. Missing success identifiers preserve the draft and ask the buyer to check orders.

Files: [app/dispensary/cart/page.tsx](../../app/dispensary/cart/page.tsx), [lib/cart.ts](../../lib/cart.ts).

Checks: Partial 200 success regression retained the failed product and removed only the confirmed one; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L16

**High** · Cost · `app/dispensary/cart/page.tsx:110-123,129-145` — inventory sync downloads up to 200 full catalog products (base64 images) to check a few ids; products beyond 200 or temporarily unavailable are treated as deleted and silently removed; price never refreshed. → Dedicated validate endpoint returning `{id, price, inventoryQty, isAvailable}`.

**Status:** complete.

Cart inventory sync requests exact IDs via a slim validation endpoint, refreshes visible prices/accepted quotes, and retains unavailable products with actionable status instead of deleting them.

Files: [app/api/dispensary/cart/validate/route.ts](../../app/api/dispensary/cart/validate/route.ts), [app/dispensary/cart/page.tsx](../../app/dispensary/cart/page.tsx).

Checks: Exact-ID response included unavailable/missing products and suppressed hidden prices; Slow request retention regression passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L17

**Medium** · Edge case · `app/dispensary/cart/page.tsx:278-329,894` state-based double-submit guard, unguarded `response.json()`, uncleared `setTimeout(router.push)`; `:228-263` `setInventoryAdjustmentNotice` called inside a `setCart` updater (double-invoked in StrictMode); `:521-538` quantity/remove controls unlabeled, `unit` may be `undefined`; `:330-339` entire page CSR behind a `mounted` gate; `:544-647` vs `:808-870` duplicated fulfillment fields. → `submittingRef`; guard JSON; compute then set; labels; consider server cart.

**Status:** complete.

Checkout uses a synchronous submission ref and guarded JSON; inventory notices are computed outside state updaters, redirect timers are cleaned up, and quantity/remove controls are labelled with default units. Existing review summaries avoid duplicate fulfillment entry.

Files: [app/dispensary/cart/page.tsx](../../app/dispensary/cart/page.tsx).

Checks: Double-click checkout generated exactly one request; Partial/malformed response paths reviewed; Cart hydration loading state and single fulfillment form reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L18

**High** · Edge case · `app/dispensary/price-alerts/PriceAlertsContent.tsx:143-159,129-140` + `app/api/dispensary/price-alerts/refresh/route.ts:184-187` — refresh does `setAlerts(data.alerts)` unvalidated; an empty fallback `[]` wipes local alerts and the save effect PUTs `[]` → irreversible loss. → Validate/merge the response; never overwrite with an empty fallback.

**Status:** complete.

Price refresh validates its payload and merges updates into known saved alerts, preserving local changes and omitted records. Server refresh errors no longer masquerade as an empty successful array.

Files: [app/dispensary/price-alerts/PriceAlertsContent.tsx](../../app/dispensary/price-alerts/PriceAlertsContent.tsx), [app/dispensary/hooks/useBuyerCollection.ts](../../app/dispensary/hooks/useBuyerCollection.ts), [app/api/dispensary/price-alerts/refresh/route.ts](../../app/api/dispensary/price-alerts/refresh/route.ts).

Checks: Malformed/empty refresh regression preserved alerts and performed no destructive write; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L19

**Medium** · Cost · `PriceAlertsContent.tsx:92-140` double PUT on mount; prices only refresh on manual click (`:288-295`). Low sub-issues: `:456-458` strikes `targetPrice` not `originalPrice`; `:433` `thc &&`; `:336-339` `window.location.href` full reload; `:118-120,208-217` UI blocked until sync although local data exists.

**Status:** complete.

Price alerts hydrate cached references before server completion, never PUT on mount, and refresh after hydration. Zero THC displays, client routing avoids full reload, and current/target/history pricing is nullable and correctly labelled.

Files: [app/dispensary/price-alerts/PriceAlertsContent.tsx](../../app/dispensary/price-alerts/PriceAlertsContent.tsx), [app/dispensary/hooks/useBuyerCollection.ts](../../app/dispensary/hooks/useBuyerCollection.ts).

Checks: Saved alerts tab rendered and mounted without duplicate mutation; Automatic refresh/error-preservation regression passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L20

**High** · Cost · `app/dispensary/favorites/FavoritesContent.tsx:72-162,165-171` — mount fires 1 GET, 2 PUT, 2 details POST (racing, no abort); every removal → PUT + POST. Medium: `:477-481,573-578` deep link `?search=` never read by `GrowerShopContent`. Low: `:181-194` non-transitive `price-desc` comparator, dead `thc-asc/name-desc`; out-of-stock favorites silently dropped by `app/api/dispensary/favorites/route.ts:124-127`. → Fetch details once after merge; abort superseded requests; wire or drop the deep link.

**Status:** complete.

Favorites share one hydration chain and abortable detail load; cached remaining details avoid removal refetches. Shop search deep links are read, hidden-price sorting is transitive, and unavailable favorites remain visible.

Files: [app/dispensary/favorites/FavoritesContent.tsx](../../app/dispensary/favorites/FavoritesContent.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](../../app/dispensary/grower/%5Bid%5D/GrowerShopContent.tsx), [app/api/dispensary/favorites/route.ts](../../app/api/dispensary/favorites/route.ts).

Checks: Favorites hydration called GET once across tab switches; Out-of-stock favorite returned by details API; Comparator/deep-link and stale-request cleanup reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L21

**Medium** · Cost · `app/dispensary/saved/SavedContent.tsx:74-75` — tab switch remounts `FavoritesContent`/`PriceAlertsContent`, re-running their sync chains; `:53-70` tabs lack `role="tablist"`/`aria-selected`. → Keep panels mounted or lift data to the server.

**Status:** complete.

Saved tabs lazily mount once and preserve their panels on subsequent tab changes, with tablist/tab/panel relationships and selected state.

Files: [app/dispensary/saved/SavedContent.tsx](../../app/dispensary/saved/SavedContent.tsx).

Checks: Returning to Favorites did not repeat its initial GET; Rendered tab roles/selection passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L22

**High** · Cost · `app/dispensary/settings/components/SettingsForm.tsx:125-132` + `app/components/settings/LogoUpload.tsx:38-45` — entire `formData` including a ≤2 MB base64 logo written to localStorage 600 ms after every keystroke via `useLocalDraft` (quota exceptions uncaught at `app/hooks/useLocalDraft.ts:77`). Medium sub-issues: `:187-236` draft restored *over* server data incl. `licenseStatus`/`logo` (masks admin verification); `:254-299` logo upload calls `handleSave(true)` skipping validation; `:341-362` global Escape discards all changes, listener re-registered per keystroke; `LogoUpload.tsx:40` `Buffer.from` in client, input value never reset, preview not synced; `:476-694` labels without `htmlFor`; `:86-93` "expires today" rejected (UTC parse). → Exclude logo from drafts; restore only editable fields; logo-only save; scoped Escape with confirm.

**Status:** complete.

Settings draft persistence allows only bounded editable fields, excludes logo and server verification fields, and uses account-scoped guarded storage. Logo saves separately through PATCH; normal saves reload canonical state. Escape is scoped/confirmed, controls have labels, and date-only expiry allows today. Shared LogoUpload now uploads files, resets/syncs preview, and avoids Buffer. Delayed logo upload/remove completion cannot overwrite a newer canonical logo prop.

Files: [app/dispensary/settings/components/SettingsForm.tsx](../../app/dispensary/settings/components/SettingsForm.tsx), [app/components/settings/LogoUpload.tsx](../../app/components/settings/LogoUpload.tsx), [app/hooks/useLocalDraft.ts](../../app/hooks/useLocalDraft.ts), [lib/license.ts](../../lib/license.ts), [lib/profile-settings.ts](../../lib/profile-settings.ts), [app/dispensary/dashboard/LicenseVerificationCard.tsx](../../app/dispensary/dashboard/LicenseVerificationCard.tsx).

Checks: Real local settings PATCH accepted Vermont expiry today and correctly reset changed license to pending_review; Malicious/stale draft could not override license status or inject a large logo; Persisted draft stayed compact; Expiry today accepted and Escape in an input preserved edits; Logo-only callback/normal save canonical refresh source reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used; Delayed upload preview regression and normal logo-only save passed.

### L23

**Medium** · Edge case · `app/dispensary/orders/[id]/OrderDetailActions.tsx:85-104` — reorder overwrites the entire existing cart without merge/confirm. → Merge via shared cart helper or confirm.

**Status:** complete.

Reorder validates and merges products into the existing draft using the shared cart helper and reports storage failure instead of overwriting unrelated items.

Files: [app/dispensary/orders/[id]/OrderDetailActions.tsx](../../app/dispensary/orders/%5Bid%5D/OrderDetailActions.tsx), [lib/cart.ts](../../lib/cart.ts).

Checks: Cart merge regression retained an unrelated existing item; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L24

**Medium** · Other · `app/dispensary/components/OrdersTable.tsx:34-50,288-320,64-69` vs `app/dispensary/dashboard/OrdersTable.tsx:25-32,83,128` — two `OrdersTable`s with different badge mappings; sortable `<th onClick>` not focusable, no `aria-sort`; density read in `setTimeout(0)`; `dashboard/OrdersTable.tsx:35-38` `new Date()` in render (hydration risk). → Consolidate into one component with props.

**Status:** complete.

Verified the existing shared OrdersTable consolidation, then made sorting keyboard-accessible with aria-sort and moved density persistence to a stable external-store snapshot, removing timer-based hydration.

Files: [app/dispensary/components/OrdersTable.tsx](../../app/dispensary/components/OrdersTable.tsx), `app/dispensary/dashboard/OrdersTable.tsx`, [app/dispensary/dashboard/page.tsx](../../app/dispensary/dashboard/page.tsx).

Checks: Repository search confirmed one shared OrdersTable used by dashboard/orders; Sort button and aria-sort source review; Order pagination/dashboard rendered regression passed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### L25

**Medium** · Other · `app/dispensary/_components/MobileNav.tsx:47-130` — no focus trap/Escape/scroll lock; near-duplicate of `app/grower/components/MobileNav.tsx`. → Extract a shared `MobileNav`.

**Status:** complete.

Verified the pre-existing shared MobileNav replacement and its focus trap, Escape dismissal, and scroll locking; no duplicate buyer-specific navigation remains.

Files: [app/components/ui/MobileNav.tsx](../../app/components/ui/MobileNav.tsx), [app/dispensary/layout.tsx](../../app/dispensary/layout.tsx), `app/dispensary/_components/MobileNav.tsx`.

Checks: Rendered 390px navigation opened, trapped accessible dialog state, dismissed with Escape, and restored body scrolling; Shared component implementation reviewed; Full TypeScript check passed after final auth-helper conversion; Scoped ESLint passed with no errors (three existing image-element warnings); tests/dispensary-remediation.spec.ts: 12-case local regression run plus final focused hydration regression passed (13 distinct cases); no production target used.

### M01

**High** · Edge case · `app/grower/products/page.tsx:228-243,247` — effect depends on `session` (new object on every `useSession` refetch/window focus) → full refetch + spinner replacing the list on each tab focus. → Depend on `status`; don't set `loading` on background refetch.

**Status:** complete.

Product fetching now depends only on page/filter primitives and retains rows during background requests; session object refreshes do not trigger a catalog reload.

Files: [app/grower/products/page.tsx](../../app/grower/products/page.tsx).

Checks: Focused browser test dispatched window focus and confirmed no extra product-list request; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M02

**High** · Edge case · `app/grower/products/page.tsx:653,779,860` — `ProductCard`/`ProductRow`/`ProductTable` defined inside the page component → remounted on every keystroke (focus loss, full DOM rebuild). → Hoist to module scope.

**Status:** complete.

Hoisted ProductCard/ProductRow/ProductTable to module scope with explicit controls, preserving component and DOM identity.

Files: [app/grower/products/page.tsx](../../app/grower/products/page.tsx).

Checks: Selecting a product by keyboard retained checkbox focus; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M03

**High** · Edge case · `app/grower/products/page.tsx:276,312-321,289-329` (+ `app/grower/batches/page.tsx:84`, `app/grower/strains/page.tsx:92`) — `setProducts(products.filter/map(...))` stale closures; `toggleAvailability` has no in-flight guard (double-click toggles back and forth). → Functional updates; pending-id set; optimistic update with rollback.

**Status:** complete.

Used functional list updates, per-product/pending delete guards, optimistic availability rollback, and loading confirmation controls. Bulk delete preserves failed selections and removes successful deletions independently.

Files: [app/grower/products/page.tsx](../../app/grower/products/page.tsx), [app/grower/batches/page.tsx](../../app/grower/batches/page.tsx), [app/grower/strains/page.tsx](../../app/grower/strains/page.tsx), [app/components/ui/ConfirmDialog.tsx](../../app/components/ui/ConfirmDialog.tsx).

Checks: Bulk disable changed exactly one local fixture record without a catalog refetch; Reviewed delete and availability error rollback paths and pending cleanup; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M04

**Medium** · Cost · `app/grower/products/page.tsx:511-530` bulk-update triggers a full refetch (spinner, loses `bulkMessage`); `:551-577` five `filter` passes over the unpaginated list per render. → Apply updates locally; memoize counts; paginate server-side.

**Status:** complete.

Products use server pagination, summary selects without media/description/batch JSON, safe sort allowlists, database counts, and locally adjusted aggregate counters after edits. Bulk updates consume updatedIds and keep success messaging.

Files: [app/api/products/route.ts](../../app/api/products/route.ts), [app/grower/products/page.tsx](../../app/grower/products/page.tsx), [app/components/ui/Pagination.tsx](../../app/components/ui/Pagination.tsx).

Checks: 55-product browser fixture returned50 then5 rows with correct total55; Confirmed summary has no description and empty image payload, and bulk update does not reload; Mobile page had no document overflow and fixed header stayed at y=0 while scrolled; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M05

**High** · Edge case · `app/grower/products/components/ProductForm.tsx:256-269` vs `app/grower/products/add/page.tsx:56-67,158-172` — two draft systems (`useLocalDraft` auto-restores; the page prompts on a `sessionStorage` draft); "Discard" only clears one, "Restore" gets overwritten by the other. → Keep one store; opt-in restore.

**Status:** complete.

Removed the duplicate sessionStorage product draft system and keeps one account-scoped useLocalDraft store with explicit Restore/Discard.

Files: [app/grower/products/components/ProductForm.tsx](../../app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](../../app/grower/products/add/page.tsx), [app/hooks/useLocalDraft.ts](../../app/hooks/useLocalDraft.ts).

Checks: Browser reload left form blank until Restore draft was clicked; restored exact unsent name; Switching test accounts did not expose the previous account draft; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M06

**High** · Cost · `ProductForm.tsx:256-285,479` — `{...formData, images: imagePreviews}` (base64, ≤5 MB × N) stringified to localStorage every 600 ms and sessionStorage per render → uncaught `QuotaExceededError` (`app/hooks/useLocalDraft.ts:77`, `:280`, `:479`). → Exclude images; try/catch.

**Status:** complete.

Product drafts omit images; profile drafts omit logos; draft values are memoized and writes catch storage errors with a bounded payload.

Files: [app/grower/products/components/ProductForm.tsx](../../app/grower/products/components/ProductForm.tsx), [app/hooks/useLocalDraft.ts](../../app/hooks/useLocalDraft.ts), [app/grower/settings/components/SettingsForm.tsx](../../app/grower/settings/components/SettingsForm.tsx).

Checks: Stored product draft had images:[] and account ID in its key; Forced QuotaExceededError showed a recoverable warning and kept the form editable; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M07

**High** · Cost · `ProductForm.tsx:393-433,455-458,524-526` + `add/page.tsx:81-85` + `app/grower/products/[id]/edit/components/EditProductPageClient.tsx:46-50` — images read via `readAsDataURL` (no count cap) and posted inline in the JSON body to `/api/products` → exceeds Vercel's 4.5 MB body limit with one large photo, opaque failure; `/api/products/upload` unused. → Upload separately (blob storage), send URLs, compress client-side.

**Status:** complete.

Image files are compressed/resized when needed, separately uploaded via multipart, capped, and submitted to product APIs only as URLs.

Files: [app/components/uploads/uploadFile.ts](../../app/components/uploads/uploadFile.ts), [app/grower/products/components/ProductForm.tsx](../../app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](../../app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](../../app/grower/products/%5Bid%5D/edit/components/EditProductPageClient.tsx).

Checks: Browser image fixture made separate multipart requests and product draft JSON contained only /uploads URLs; No base64 was present in submitted product data; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M08

**Medium** · Edge case · `ProductForm.tsx:405-417` completion detection breaks if any `FileReader` errors (no `onerror`), order nondeterministic, input never reset; `:1022-1028` `next/image` with `data:` URLs; `:494-501` page-level Escape shortcut fires while `BatchSelector` (`app/grower/components/BatchSelector.tsx:79-85`) / `SearchDialog` (`app/components/SearchDialog.tsx:63-69`) / `ConfirmDialog` are open (also `EditOrderForm.tsx:290-297`, `EditCustomerForm.tsx:268-275`) → closes modal *and* navigates away; `:271-298` unsaved-changes guard disabled for new products, works by accident; `:1066` + `:1138-1142` two submit controls, double-tap POSTs twice; `:518-537` draft save skips validation, duplicate toasts (`add/page.tsx:111`, `EditProductPageClient.tsx:86`). → `Promise.all` readers; plain `<img>` previews; stop Escape propagation from dialogs; `useRef` submit guard.

**Status:** complete.

Image processing is sequential/error-safe with reset inputs and plain upload previews; modal Escape is consumed; new products use the unsaved guard; submit refs cover duplicate buttons and draft validation/toasts are centralized.

Files: [app/grower/products/components/ProductForm.tsx](../../app/grower/products/components/ProductForm.tsx), [app/hooks/useKeyboardShortcuts.ts](../../app/hooks/useKeyboardShortcuts.ts), [app/hooks/useFocusTrap.ts](../../app/hooks/useFocusTrap.ts), [app/grower/products/add/page.tsx](../../app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](../../app/grower/products/%5Bid%5D/edit/components/EditProductPageClient.tsx).

Checks: Selecting the same image twice triggered two uploads in order; Two synchronous Save Draft clicks produced onePOST; Opening Search then Escape retained unsaved product data and route; focus stayed within the dialog; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M09

**Medium** · Edge case · `app/grower/products/add/page.tsx:48-76` draft check coupled to `/api/growers/me` response; `initialData` never updates when params change; `EditProductPageClient.tsx:58-59,87-88` `router.push` then `router.refresh()` of the *current* route. → Separate effects; `useMemo` initial data; refresh from destination.

**Status:** complete.

Separated grower lookup from drafts, memoized add-page initial query data, remounts the form when those params change, and removed push-then-refresh from product saves.

Files: [app/grower/products/add/page.tsx](../../app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](../../app/grower/products/%5Bid%5D/edit/components/EditProductPageClient.tsx).

Checks: Product add/draft navigation browser checks passed; Reviewed destination navigation and query-derived initialData; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M10

**Medium** · Edge case · `app/grower/batches/page.tsx:38,62` dead `filterStrain`; `:87` / `app/grower/strains/page.tsx:95` unguarded `await response.json()` on error; `:152` divides by count of batches with THC → `NaN%`; `app/grower/batches/[id]/edit/page.tsx:71-105` sequential strains→batch waterfall, `lotNumber` typed but never editable; `[id]/edit:154-158` + `add/page.tsx:98-101` send `coaDocumentUrl:null`/`testResults:null` wiping existing values; `add/page.tsx:51-63,134-143` full strains list for a `<select>`, empty-state `<a href>` full reload drops `returnUrl`. → Remove dead state; guard JSON; guard divisor; `Promise.all`; omit unowned fields.

**Status:** complete.

Batch filters derive from the URL, error JSON is guarded, THC division handles an empty sample, edit fetches independent data concurrently, lot number remains editable, and unowned COA/testResults metadata is preserved.

Files: [app/grower/batches/page.tsx](../../app/grower/batches/page.tsx), [app/grower/strains/page.tsx](../../app/grower/strains/page.tsx), [app/grower/batches/[id]/edit/page.tsx](../../app/grower/batches/%5Bid%5D/edit/page.tsx), [app/grower/batches/add/page.tsx](../../app/grower/batches/add/page.tsx).

Checks: Local PDF/batch edit regression preserved LOT-KEEP and retained testResults metadata; Batch edit rendered with existing metadata; Batch list consumes labDocumentCount instead of testResults; Reviewed summary strain requests and preserved returnUrl Link; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M11

**High** · Security · `app/grower/batches/add/page.tsx:35,113-115`, `app/grower/strains/add/page.tsx:21,75-77` — `returnUrl` query param passed straight to `router.push` → open redirect to external hosts. → Allow only `/^\/(?!\/)/` paths.

**Status:** complete.

Both add flows validate returnUrl through a same-origin path helper that rejects schemes, protocol-relative paths, controls, and backslashes.

Files: [app/grower/batches/add/page.tsx](../../app/grower/batches/add/page.tsx), [app/grower/strains/add/page.tsx](../../app/grower/strains/add/page.tsx), [app/components/ui/safeNavigation.ts](../../app/components/ui/safeNavigation.ts).

Checks: Regression assertions reject javascript:, //external, and backslash host paths while preserving valid in-app query paths; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M12

**Medium** · Cost · `app/grower/batches/add/page.tsx:96-101`, `app/grower/batches/[id]/edit/page.tsx:151-158`, `app/grower/components/BatchSelector.tsx:139-155`, `app/grower/components/BatchLabDocumentUploaders.tsx:29` — up to 10 MB base64 PDFs per document embedded in JSON to `/api/batches` (body limit) and stored in `testResults` JSON returned by every `/api/batches` list. → Blob storage + URLs; never return `testResults` in lists.

**Status:** complete.

Batch PDFs upload separately and store file URLs in the existing document reference field. Form save/create is disabled while documents upload; lists consume document counts instead of full JSON.

Files: [app/grower/components/BatchLabDocumentUploaders.tsx](../../app/grower/components/BatchLabDocumentUploaders.tsx), [app/grower/components/BatchSelector.tsx](../../app/grower/components/BatchSelector.tsx), [app/grower/batches/add/page.tsx](../../app/grower/batches/add/page.tsx), [app/grower/batches/[id]/edit/page.tsx](../../app/grower/batches/%5Bid%5D/edit/page.tsx), [app/grower/batches/page.tsx](../../app/grower/batches/page.tsx).

Checks: Separate document-upload helper uses multipart and accepts bounded URL responses; Local PDF browser regression passed: save disabled during upload, URL stored, lotNumber and unknown testResults metadata retained, list returned only labDocumentCount; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M13

**Medium** · Edge case · `BatchLabDocumentUploaders.tsx:62-72` unhandled rejection on read error, input not reset; `BatchSelector.tsx:87-105` strain-switch race, `batchId` not cleared; `:113-126` duplicate `/api/strains` fetch already done by `StrainSelector`; `:185-187` loading unmounts the open create dialog; `app/grower/components/StrainSelector.tsx:82,139-186` Enter in inline strain form submits the parent product form, stale `setStrains([...strains])`; `app/grower/components/ProductTypeSelector.tsx:97-101` + `ProductForm.tsx:646-653` effect calls a fresh callback each render (loop risk for non-idempotent aliases). → try/catch + reset; abort on strain change; lazy-load strains; keep dialog mounted; `preventDefault` on Enter; normalize once in parent.

**Status:** complete.

Upload errors are caught and inputs reset; batch loads abort on strain changes, selectors retain open dialogs during loading, strains load lazily for batch creation, inline strain Enter stops parent submission, and type normalization occurs in ProductForm initialization.

Files: [app/grower/components/BatchLabDocumentUploaders.tsx](../../app/grower/components/BatchLabDocumentUploaders.tsx), [app/grower/components/BatchSelector.tsx](../../app/grower/components/BatchSelector.tsx), [app/grower/components/StrainSelector.tsx](../../app/grower/components/StrainSelector.tsx), [app/grower/components/ProductTypeSelector.tsx](../../app/grower/components/ProductTypeSelector.tsx), [app/grower/products/components/ProductForm.tsx](../../app/grower/products/components/ProductForm.tsx).

Checks: Local PDF upload regression passed with save blocked until upload completed; Inline strain Enter did not POST a product; Reviewed stale-response abort and functional newly-created strain/batch updates; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M14

**Medium** · Edge case · `app/grower/orders/add/page.tsx:41-62` non-OK responses treated as empty lists; `:165-175,415-416` quantity `parseInt||0` + clamp on every keystroke makes typing impossible; `:239-241` 2 s `setTimeout` before push, not cleared, submit re-enabled; Low: `:180-189` float totals. → Error state; raw string in state, clamp on blur; navigate immediately; integer cents.

**Status:** complete.

Direct request loading reports non-OK responses, quantity strings remain editable until blur, totals use integer cents, and submit guards navigate immediately.

Files: [app/grower/orders/add/page.tsx](../../app/grower/orders/add/page.tsx).

Checks: Browser quantity could be cleared and typed to12, then999 clamped to20 on blur; Reviewed integer-cent total calculation and guarded numeric submit payload; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M15

**Medium** · Edge case · `app/grower/orders/components/OrdersList.tsx:52,133-136` `useState(initialOrders)` never resyncs after `router.refresh()`; `app/grower/orders/[id]/components/QuickStatusUpdate.tsx:85-86` buttons re-enabled before RSC refresh → second PATCH on stale status; Low: `app/grower/orders/[id]/components/OrderStatusTimeline.tsx:26,36,66-73,162` dead `onStatusChange` props/buttons. → Derive from props; keep pending until prop changes; remove dead props.

**Status:** complete.

Verified OrdersList resynchronizes initialOrders; status mutation stays pending until a new status prop arrives; removed dead timeline callback/state/actions.

Files: [app/grower/orders/components/OrdersList.tsx](../../app/grower/orders/components/OrdersList.tsx), [app/grower/orders/[id]/components/QuickStatusUpdate.tsx](../../app/grower/orders/%5Bid%5D/components/QuickStatusUpdate.tsx), [app/grower/orders/[id]/components/OrderStatusTimeline.tsx](../../app/grower/orders/%5Bid%5D/components/OrderStatusTimeline.tsx).

Checks: Rendered active request/detail pages passed; Reviewed success keeps pendingRef locked until currentStatus effect, while errors unlock; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M16

**Medium** · Edge case · `app/grower/orders/[id]/edit/components/EditOrderForm.tsx:109-127` `JSON.stringify` of both full payloads every render; `:219,254-268` client sends `totalPrice` and no inventory bound; `:271-277` 1.5 s timer, `resetDirtyState()` before navigating; Low: `:294` Escape target differs from Cancel. → `useMemo`; server recomputes totals; navigate immediately.

**Status:** complete.

Order editor memoizes baseline/current data, applies quantity inventory bounds, omits client totals, navigates without timers, and uses one confirmation-aware Cancel destination.

Files: [app/grower/orders/[id]/edit/components/EditOrderForm.tsx](../../app/grower/orders/%5Bid%5D/edit/components/EditOrderForm.tsx), [app/grower/orders/[id]/edit/page.tsx](../../app/grower/orders/%5Bid%5D/edit/page.tsx).

Checks: Local order editor rendered numeric product/order props without runtime serialization errors; Inspected payload: server owns totalPrice; client quantities are bounded; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M17

**Medium** · Edge case · `app/grower/customers/add/page.tsx:52-55` `router.push` in render body; `:96` unguarded json; `app/grower/customers/[id]/edit/components/EditCustomerForm.tsx:143-165` `initialData` recreated per render (lint-suppressed), `:277-292` no `isDeleting` guard, `:243-247` sends ignored `email/contactName`, `zipCode`→`zip` mismatch. → `useEffect` redirect; `useMemo`; pending flag; send only editable fields.

**Status:** complete.

Removed render-time auth navigation, guarded response parsing/deletion, memoized customer baseline, respected platform-managed editing, and maps zipCode to API zip.

Files: [app/grower/customers/add/page.tsx](../../app/grower/customers/add/page.tsx), [app/grower/customers/[id]/edit/components/EditCustomerForm.tsx](../../app/grower/customers/%5Bid%5D/edit/components/EditCustomerForm.tsx).

Checks: Customer list/edit authorization coordinated with root API changes; Reviewed editable off-platform email/contactName support and platform guard; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M18

**Medium** · Edge case · `app/grower/inventory/add/page.tsx:46-54,121-131` — `quantityAvailable` sent as raw string, no integer/non-negative validation client-side. → Parse/validate, send a number.

**Status:** complete.

Stock updates require a selected product and finite nonnegative integer quantity, sent as a JSON number under a pending guard.

Files: [app/grower/inventory/add/page.tsx](../../app/grower/inventory/add/page.tsx).

Checks: Browser stock fixture submitted quantityAvailable:12 as a number; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M19

**High** · Edge case · `app/grower/settings/components/SettingsForm.tsx:334-355` — window-level Escape reverts the entire form with "Changes discarded", no confirmation (fires when closing autocomplete/autofill/chat). Medium: `:247-290` logo upload saves unvalidated form, base64 logo in draft (`:130-136`); Low: `:320-322` uncleared timer. → Remove or gate behind confirm; logo-only save; exclude logo from draft.

**Status:** complete.

Removed destructive settings Escape behavior, uses logo-only PATCH with upload URLs, excludes logos from browser drafts, handles pending saves, cleans success timer, and uses shared calendar-date license validation.

Files: [app/grower/settings/components/SettingsForm.tsx](../../app/grower/settings/components/SettingsForm.tsx), [app/components/settings/LogoUpload.tsx](../../app/components/settings/LogoUpload.tsx).

Checks: Changing an invalid unsaved business name then uploading a logo submitted only {logo} and preserved the name edit; Escape retained unsaved settings text; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M20

**Medium** · Edge case · `app/components/settings/SubscriptionBilling.tsx:28-59` any non-OK/network error → synthetic "Free plan / Upgrade" UI for a paying grower. Low: `:249-282` three identical "Manage" portal buttons; `:80,99` `window.location.href = data.url` without asserting a Stripe host. → Error state with retry; one button; validate URL host.

**Status:** complete.

Subscription failures show a retryable error instead of fabricated Free state, billing UI has one portal button, validates exact HTTPS Stripe hosts, and uses action guards.

Files: [app/components/settings/SubscriptionBilling.tsx](../../app/components/settings/SubscriptionBilling.tsx), [app/grower/settings/page.tsx](../../app/grower/settings/page.tsx).

Checks: Settings billing preloaded without client waterfall; Reviewed network/JSON/error path and redirect validation; canceled/unpaid/trialing readiness regression passed; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M21

**High** · Cost · `app/components/messaging/ChatDrawer.tsx:246-262` 30 s conversation polling for every user on every page (interval recreated + immediate fetch each `open` toggle); `:196-215,264-279` 12 s poll refetches the entire thread, unconditionally POSTs `/read`, and yanks scroll to bottom; `:173,241-244,535` auto-selects conversation 0 and marks it read even when the pane is hidden on mobile; `:196-215,556-558` no abort → wrong-conversation `setMessages`/read; `:111-128` draft value object recreated per render, key flips to `…:none` leaking draft text between conversations; `:209` uncleared timer; `:667` renders "$undefined" for null `offerUnitPrice`; `:216-234` overwrites unsent text, `conversationContexts` unbounded; `:303-306,353-355,385-386,456-459` two extra round-trips per send. → Poll only when open (or SSE), incremental `?after=`, mark read only when visible, append POST response optimistically, memoize draft value.

**Status:** complete.

Chat polls only while open/visible, never auto-selects mobile conversations, uses timestamp+ID incremental requests and offer updates, aborts stale requests, marks only visible incoming messages read, preserves scroll position, appends send responses, scopes/memoizes drafts, bounds contexts, and uses validated shared cart storage. Independent cross-review follow-up separates pending and acknowledged read cursors, retries bounded acknowledgements, clears only matching submitted origin draft fields, caches sent responses for returning threads, and scopes late errors to their origin.

Files: [app/components/messaging/ChatDrawer.tsx](../../app/components/messaging/ChatDrawer.tsx), [app/hooks/useLocalDraft.ts](../../app/hooks/useLocalDraft.ts), [lib/cart.ts](../../lib/cart.ts).

Checks: Focused chat race suite:5 passed, including non-OK/aborted read retries, A-to-B send completion, and preservation of newer quote edits; read acknowledgements send throughMessageId and retain server unreadCount; Delayed failed A send regression verifies B remains unchanged and A draft is retained; Mobile mocked threads: no closed requests or list-only reads, late A response could not replace B, B draft restored after A switch; Sending appended the returned message without conversation refetch; closing stopped polling after clock advance; Reviewed missing-price display, flash cleanup, offer updates, and quoted cart metadata; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M22

**Medium** · Edge case · `app/components/SearchDialog.tsx:72-105` no `AbortController`, `res.ok` unchecked (HTML error body → "No results"); `:108-118` + `app/grower/layout.tsx:45,60` / `app/dispensary/layout.tsx:65,79` two `SearchDialog` instances per layout → two ⌘K listeners and two stacked dialogs; Low: `:121-125` duplicate Escape handling, `:128-133` server-supplied `href` pushed without same-origin check. → Abort; check `res.ok`; one dialog + two triggers; validate `href`.

**Status:** complete.

Search has one dialog plus separate triggers, aborts stale requests, handles non-OK/malformed responses visibly, consumes Escape once, and validates result navigation paths. Mobile dialog closure restores focus to the visible mobile trigger.

Files: [app/components/SearchDialog.tsx](../../app/components/SearchDialog.tsx), [app/components/ui/safeNavigation.ts](../../app/components/ui/safeNavigation.ts), [app/grower/layout.tsx](../../app/grower/layout.tsx), [app/dispensary/layout.tsx](../../app/dispensary/layout.tsx).

Checks: Keyboard shortcut opened exactly one dialog; Tab stayed inside; Escape closed it without navigating a dirty product form; Layout SearchTrigger wiring completed by root; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification; Mobile Search Escape focus regression passed after independent shared UI review.

### M23

**Medium** · Edge case · `app/hooks/useKeyboardShortcuts.ts:47-52` document-wide Escape with `preventDefault`, no target/dialog check; `app/hooks/useUnsavedChanges.ts:49-56,76-135` monkey-patches the shared `router.push/replace/back/forward` per `isDirty` change (two consumers corrupt each other), `useFormDirty` (`:162-192`) unused; `app/hooks/useLocalDraft.ts:70-82` no try/catch, keys not namespaced by user → drafts (messages, product data) leak to the next account in a shared browser; Low: `app/hooks/useFocusTrap.ts:48-52,79-83` Escape doesn't stop propagation, focus restored on every dep change; `app/components/ui/ConfirmDialog.tsx:26-78` no focus trap/Escape/backdrop, static `id`, confirm never disabled (double `deleteProduct` from `app/grower/products/page.tsx:1297`). → Scope shortcuts; replace router patching with explicit confirm; try/catch + per-user keys; `useId` + `loading` prop.

**Status:** complete.

Scoped global shortcuts, removed shared router mutation and unused useFormDirty, added explicit programmatic navigation confirmation, made drafts account-scoped/quota-safe, stabilized focus traps, and added pending-aware accessible confirmations.

Files: [app/hooks/useKeyboardShortcuts.ts](../../app/hooks/useKeyboardShortcuts.ts), [app/hooks/useUnsavedChanges.ts](../../app/hooks/useUnsavedChanges.ts), [app/hooks/useLocalDraft.ts](../../app/hooks/useLocalDraft.ts), [app/hooks/useFocusTrap.ts](../../app/hooks/useFocusTrap.ts), [app/components/ui/ConfirmDialog.tsx](../../app/components/ui/ConfirmDialog.tsx), [app/components/ui/Modal.tsx](../../app/components/ui/Modal.tsx).

Checks: Account-isolation, quota, duplicate submission, nested Escape, and dialog focus regressions passed; Reviewed topmost trap handling, focus return, hidden-focus exclusion, and pending dialog controls; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M24

**Low** · Other · `app/components/ux/RecentActivityDrawer.tsx:70-84` unvalidated localStorage entries; `app/components/ui/DateRangeFilter.tsx:22-60` missing ARIA, "last 7 days" compares with time-of-day; `app/grower/dashboard/ActivityFeed.tsx:1-4,52` `date-fns` only for one format; `app/grower/reports/ReportsExportActions.tsx:60-103` `csvEscape` doesn't neutralize `= + - @` (CSV formula injection via names); `app/components/SignOutButton.tsx:11` / `app/grower/components/MobileNav.tsx:34` duplicate sign-out without pending state; `app/components/ui/Badge.tsx:1`, `Card.tsx:1`, `FetchState.tsx:1`, `app/components/ux/StickyMobileActionBar.tsx:1` needless `'use client'` (pull `class-variance-authority` into client bundles). → Validate; add ARIA; `Intl.DateTimeFormat`; prefix risky cells with `'`; share handler; drop directives.

**Status:** complete.

Validated account-scoped recent activity, replaced the custom date menu with an accessible native select/calendar boundaries, uses Intl for activity dates, neutralizes CSV formula cells, shares guarded sign-out, and removed unnecessary client directives.

Files: [app/components/ux/RecentActivityDrawer.tsx](../../app/components/ux/RecentActivityDrawer.tsx), [app/components/ui/DateRangeFilter.tsx](../../app/components/ui/DateRangeFilter.tsx), [app/grower/dashboard/ActivityFeed.tsx](../../app/grower/dashboard/ActivityFeed.tsx), [app/grower/reports/ReportsExportActions.tsx](../../app/grower/reports/ReportsExportActions.tsx), [app/hooks/useSignOut.ts](../../app/hooks/useSignOut.ts), [app/components/SignOutButton.tsx](../../app/components/SignOutButton.tsx), [app/components/ui/MobileNav.tsx](../../app/components/ui/MobileNav.tsx), [app/components/ui/Badge.tsx](../../app/components/ui/Badge.tsx), [app/components/ui/Card.tsx](../../app/components/ui/Card.tsx), [app/components/ui/FetchState.tsx](../../app/components/ui/FetchState.tsx), [app/components/ux/StickyMobileActionBar.tsx](../../app/components/ux/StickyMobileActionBar.tsx).

Checks: Report CSV for customer =2+3 contained a leading apostrophe; Last7days included midnight6days ago and excluded end of7days ago; Reviewed activity shape/path/time validation and sign-out pending guard; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M25

**Low** · Other · dead/duplicate code: `app/grower/products/components/{ProductTable,ProductCard,ProductActions,InventoryToggle,DeleteButton,EditButton}.tsx` + `index.ts` (never imported; the page re-implements them), `app/dispensary/catalog/components/FilterSidebar.tsx` (unused, mismatched filter shape), `app/components/Layout.tsx` (only used by the dead dashboard layout), `app/hooks/useToast.ts:19-45` helpers (only `update` used), `ProductForm.tsx:426-433` `getBase64Images` identity map, client-side auth/role redirect blocks duplicated in `app/grower/products/page.tsx:228-243`, `batches/page.tsx:41-56`, `strains/page.tsx:50-65`, `orders/add/page.tsx:27-39`, `inventory/add/page.tsx:20-27`, `customers/add/page.tsx:44-55` (already enforced by `app/grower/layout.tsx:11-20`), identical `deleteX` helpers (`products/page.tsx:272-287`, `batches/page.tsx:80-95`, `strains/page.tsx:88-103`), THC/strain-type color helpers duplicated 6× across `CatalogContent`/`FavoritesContent`, `CartItem` interface duplicated 3× with differing fields. → Delete/consolidate.

**Status:** complete.

Removed duplicate product draft/base64/auth code; extracted shared delete handling and product badge color helpers, consolidated cart type/operations, and removed unused toast dismiss. Dead component/layout removal belongs to cleanup owner; still-used toast helpers retained.

Files: [app/components/ui/deleteRecord.ts](../../app/components/ui/deleteRecord.ts), [lib/product-badges.ts](../../lib/product-badges.ts), [app/grower/products/page.tsx](../../app/grower/products/page.tsx), [app/grower/batches/page.tsx](../../app/grower/batches/page.tsx), [app/grower/strains/page.tsx](../../app/grower/strains/page.tsx), [app/grower/marketplace/page.tsx](../../app/grower/marketplace/page.tsx), [app/dispensary/catalog/CatalogContent.tsx](../../app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](../../app/dispensary/favorites/FavoritesContent.tsx), [app/hooks/useToast.ts](../../app/hooks/useToast.ts), [lib/cart.ts](../../lib/cart.ts).

Checks: Shared badge helpers preserve card/compact color variants and 0% rendering behavior; scoped lint passed; Reviewed actual imports before helper removal and coordinated dead-file removal with cleanup owner; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.

### M26

**Low** · Other · `app/contact/page.tsx:79-93` — form "submits" by sleeping 1.5 s and `console.log`-ing the user's message; nothing is sent or stored. → Wire to an API/email provider or remove the form.

**Status:** complete.

Verified existing contact form honestly opens an email draft via mailto and never claims a sent message; there is no fake delay or console-only submission remaining.

Files: [app/contact/page.tsx](../../app/contact/page.tsx).

Checks: Inspected mailto composition, Open email draft action, and honest success instructions; Contact page focused lint passed; Scoped ESLint: zero errors and zero warnings for grower/shared files; TypeScript passed after server-page, form, pagination, and messaging changes; parent runs integrated verification.
