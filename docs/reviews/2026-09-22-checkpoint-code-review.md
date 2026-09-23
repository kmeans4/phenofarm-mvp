# PhenoFarm / PhenoShop — Checkpoint code review (2026-09-22)

Read-only review of `origin/codex/project-checkpoint-2026-09-22`, same scope as the 2026-09-17 and 2026-09-22 reviews: every route under `app/`, API routes, layouts, server actions, `lib/*`, `prisma/schema.prisma` and migrations, auth, Stripe, and client components. Priority was edge cases and correctness, then egress and other cost, then speed, then security.

No application code, database, or migration was changed. `node_modules/next/dist/docs/` is not in this checkout, so the Next.js guide was not re-read. Dynamic route handlers that were opened use async `params` (for example `app/api/dispensary/products/[id]/thumbnail/route.ts`). There is still no `middleware.ts` or `proxy.ts`. Generated review screenshots under `docs/reviews/**` were not treated as application code.

Prior items keep the numbers **PF-001** through **PF-126** in the order they appear in `docs/reviews/2026-09-17-full-code-review.md`. New items are **N-001** onward. The in-repo remediation note (`docs/reviews/2026-09-17-remediation.md`) marks every prior item complete. This pass checked the source, not that note.

---

## 1. Commit reviewed

- Branch reviewed: `origin/codex/project-checkpoint-2026-09-22`
- Tip: `d2379f6829fcb5dd4c6f7014225a6554bc9bd140` — "Make CI verification independent of private authentication settings" (2026-09-22)
- Parents on this branch, ahead of `origin/main` (`d3114dd`):
  - `5d11e79` Checkpoint app hardening, responsive UI, and launch preparation
  - `6054ca8` Provide an isolated build-only database URL for GitHub verification
  - `d2379f6` Make CI verification independent of private authentication settings
- `origin/main` is still the parent of the 2026-09-17 review. This report does not restate that main-only result.

---

## 2. Delta vs the 126 PF items

| | Count |
|---|---|
| Prior items | 126 |
| Fixed | 113 |
| Still open | 0 |
| Partially fixed | 13 |
| Could not re-verify | 0 |
| New | 9 |

Fixed ids: PF-001, PF-003, PF-004, PF-006 through PF-008, PF-010 through PF-037, PF-039 through PF-068, PF-070, PF-073, PF-075 through PF-087, PF-089 through PF-093, PF-095 through PF-111, PF-113 through PF-115, PF-117 through PF-120, PF-122 through PF-126.

The September 17 criticals are fixed: `.env` is no longer tracked, customer routes are scoped to the caller’s grower, and catalog search no longer drops in-flight queries. Indexes, Stripe event receipts, checkout partial success, THC/CBD/harvest writes, and the always-on chat poll are also fixed.

### Partially fixed

- **PF-002** · **High** · Cost · `lib/blob-storage.ts:31-39`, `app/api/dispensary/products/[id]/thumbnail/route.ts:11-17`, `prisma/schema.prisma:207`, `app/grower/marketplace/page.tsx:198`, `app/grower/settings/page.tsx:39`
  - Residual: new uploads go to blob or local URLs, with size checks, and production fails closed without `BLOB_READ_WRITE_TOKEN`. Columns are still unbounded strings/JSON. Unmigrated data URLs are still stored and are decoded inside the thumbnail function. Marketplace preview and grower settings still select `images` / `logo`.

- **PF-005** · **Low** · Other · `prisma/migrations/20260211153021_init/migration.sql:135-143`
  - Residual: `Session`, `Payment`, and `Cart` are gone from the schema. `metrc_sync_logs` is still created by the init migration and has no later drop, while the Prisma schema has no model for it.

- **PF-009** · **Low** · Speed · `app/page.tsx:17-20`, `next.config.js:2-4`
  - Residual: the landing page is a server component, footer and marquee are server components, and `output: 'standalone'` is gone. The interactive landing sections are still client components behind `MarketingMotion`.

- **PF-038** · **Medium** · Cost · `app/api/products/route.ts:74-133`, `app/grower/orders/add/page.tsx:49`, `app/grower/inventory/add/page.tsx:35`, `app/grower/inventory/page.tsx:20-35`
  - Residual: `?paged=true` returns a summary without image bytes. The default `GET /api/products` is still every non-deleted product for the grower. Order-add, inventory-add, and the inventory page all load that full set.

- **PF-069** · **Medium** · Cost · `app/grower/marketplace/page.tsx:196-200`
  - Residual: order detail and edit now project fields and convert decimals to numbers. The marketplace preview still loads every available product, including the `images` array, for a buyer-style card.

- **PF-071** · **Low** · Edge case · `app/grower/customers/[id]/edit/page.tsx:69-70`, `app/grower/orders/[id]/edit/page.tsx:82`
  - Residual: inventory and customers pages now reject a missing grower id. Missing customer and order edit records still `redirect` to the list instead of `notFound()`.

- **PF-072** · **Medium** · Speed · `app/dispensary/settings/page.tsx:18-32`, `app/dispensary/settings/components/SettingsForm.tsx:248-254`, `app/dispensary/catalog/page.tsx:18-19`
  - Residual: grower settings, commercial terms, and subscription billing are rendered from server data. Dispensary settings still passes blank defaults and immediately fetches `/api/dispensary/settings`. The catalog page still renders an empty client shell that fetches the first page.

- **PF-074** · **Medium** · Cost · `app/dispensary/grower/[id]/page.tsx:27-34`
  - Residual: the shop is limited to verified, unexpired growers; the website href is http(s) only; fulfilled-request counts exclude cancelled orders. The page still includes every in-stock published product in one query.

- **PF-088** · **Low** · Other · `app/dispensary/catalog/components/MobileFilterSheet.tsx:75-81`
  - Residual: the sheet has dialog semantics and a focus trap. A downward move of more than 50px closes it, including while the finger is scrolling the sheet.

- **PF-094** · **Medium** · Cost · `app/dispensary/PriceAlertSessionRefresh.tsx:6-10`, `app/dispensary/price-alerts/PriceAlertsContent.tsx:75`, `app/api/dispensary/price-alerts/refresh/route.ts:14-27`
  - Residual: mount no longer double-PUTs the alert list. Every dispensary layout still POSTs `/api/dispensary/price-alerts/refresh` once per browser session, and the alerts tab POSTs it again when it becomes ready. The handler updates alerts one row at a time inside a transaction.

- **PF-112** · **Medium** · Cost · `app/api/batches/route.ts:115-141`
  - Residual: batch writes store lab files as URLs. The list handler still selects `testResults` (and `terpenes`) for every batch so it can count documents, then strips the JSON from the response.

- **PF-116** · **Medium** · Edge case · `app/grower/orders/[id]/edit/components/EditOrderForm.tsx:137-148`, `app/api/orders/[id]/route.ts:299`, `app/api/orders/[id]/route.ts:354`
  - Residual: inventory changes are bounded in the transaction and totals are recomputed on the server. The client still sends `unitPrice`, and the server stores that price instead of the catalog or quote price. Dirty detection still `JSON.stringify`s the whole edit payload.

- **PF-121** · **Medium** · Cost · `app/components/messaging/ChatDrawer.tsx:420-437`
  - Residual: conversations are no longer polled on every page. While the drawer is open the full conversation list is fetched every 15s. While a thread is visible the full message list is fetched every 12s. Mark-read is gated on visibility.

---

## 3. Highest-impact remaining or new items

1. **Merging this branch locks existing accounts out of sign-in** (N-001). `emailVerifiedAt` is added as null and is not backfilled. `authorize` rejects unverified users, and the JWT callback rejects any session whose version or verification does not match. Registration returns 503 when mail is not configured, so those users also cannot complete verification. The checkpoint note already says not to merge this enforcement until mail delivery works.
2. **Catalog images are one authenticated function per card, and legacy bytes still come out of Postgres** (N-002, PF-002). List APIs no longer embed base64, but each card’s `src` is `/api/dispensary/products/:id/thumbnail`. That route loads `images`, may base64-decode a data URL in the function, or redirects to whatever http(s) URL is stored. Every call also runs the JWT user lookup.
3. **Grower navigation still does up to 100 unread counts** (N-003). `getGrowerAttentionSummary` is awaited in the grower layout and again on the dashboard, with one `conversationMessage.count` per conversation.
4. **Several grower and buyer screens still load an unbounded catalog** (PF-038, PF-069, PF-074, N-009). Default product GET, inventory, marketplace (including `images`), the buyer grower shop, and the customer list have no page size.
5. **Batch lists still read lab JSON** (PF-112). The response hides `testResults`, but Postgres still returns it for every row.
6. **Background work remains on signed-in pages** (PF-121, PF-094, N-004). Chat polls only while open, but notification bells poll every 60s on grower and dispensary layouts, and price-alert refresh runs from the dispensary layout and again on the alerts tab.
7. **Grower-recorded orders trust the browser’s unit price** (PF-116, N-007). Checkout prices from the product or an accepted quote. Direct create and order edit persist `unitPrice` from the body. Direct create also does not mark a product unavailable when quantity hits zero.
8. **Dispensary orders count unread messages per conversation** (N-008). The page is paginated, then runs one `count` per grower conversation on that page.
9. **Dispensary settings still waterfall** (PF-072). The server page has the session and renders empty form defaults; the client then fetches the same profile.
10. **Sign-up can report success before the account exists, and the sign-in page prints a demo password** (N-005, N-006). Registration does the insert in `after()` and swallows failures. The public sign-in page always shows `password123`.

---

## 4. Current issues

Fully fixed prior items are omitted. Partially fixed items are listed with the residual. New items are marked **New**.

### A. Repo, config, schema, infrastructure

- **PF-002** · **High** · Cost · `lib/blob-storage.ts:31-39`; `lib/upload-validation.ts`; `app/api/dispensary/products/[id]/thumbnail/route.ts:11-17`; `prisma/schema.prisma:207`; `app/grower/marketplace/page.tsx:198`; `app/grower/settings/page.tsx:39` — New image, logo, and PDF writes are size-limited and stored as URLs. Production throws if `BLOB_READ_WRITE_TOKEN` is missing. Existing data URLs remain valid column values. The thumbnail route selects `images` and, for a data URL, decodes it in the function (`Cache-Control: private, max-age=300`). An http(s) value is redirected as-is, so a stored URL is fetched by the buyer’s browser. Marketplace and grower settings still read the image/logo columns into the server render. → Run `scripts/migrate-blobs.ts` after blob storage is configured, stop accepting new data URLs, and serve a stored URL (or a public blob path) without a per-image function. Do not select `images` or `logo` on list pages.
- **PF-005** · **Low** · Other · `prisma/migrations/20260211153021_init/migration.sql:135-143` — Fresh databases still create `metrc_sync_logs`. The current schema has no `MetrcSyncLog` model and no migration drops the table. → Add a drop migration after confirming the table is unused, or put the model back if Metrc sync is planned.
- **PF-009** · **Low** · Speed · `app/page.tsx:17-35`; `app/landing/*`; `next.config.js` — `standalone` output is gone and the page shell is a server component. Hero, pricing, FAQ, and the other motion sections still ship as client components. → Keep motion on the sections that animate and leave the rest as server components.
- **N-002** · **New** · **High** · Cost · `lib/auth.ts:84-106`; `app/api/dispensary/products/[id]/thumbnail/route.ts:6-20`; `lib/buyer-products.ts:19-34` — The JWT callback loads the user, grower, and dispensary on every `getServerSession`. Catalog cards point at the thumbnail route, so a page of N products is N more session lookups and N `images` reads, on top of the page render. Redirect responses are not given a long private cache. → Cache the revocation check briefly (or compare `sessionVersion` without a join on every image), and put a durable image URL on the product list so the browser can load it directly.

### B. Auth

- **N-001** · **New** · **High** · Edge case · `lib/auth.ts:48`; `lib/auth.ts:86-93`; `app/api/auth/register/route.ts:33-34`; `prisma/migrations/20260918010000_account_recovery/migration.sql:2-3` — Sign-in requires `emailVerifiedAt`. The migration adds that column as null and does not backfill it, so current users fail `authorize`. The JWT callback also throws when verification is missing or `sessionVersion` does not match, which clears an existing session. Register returns 503 unless account mail is configured, and the checkpoint text says that mail provider is not ready. → Do not enable this path in production until a verified sender works. Backfill `emailVerifiedAt` for accounts that already signed in, or gate the check with an explicit flag.
- **N-005** · **New** · **Medium** · Edge case · `app/api/auth/register/route.ts:35-58` — The handler returns 201 before `after()` creates the user and sends the verification link. A dropped `after()` callback, or an error inside it, still looks like success and is only logged as `REGISTRATION_FAILED`. → Create the user before responding, or make the background work durable and visible when it fails. Keep the generic body so existing addresses are not disclosed.
- **N-006** · **New** · **Medium** · Security · `app/auth/sign_in/page.tsx:225-239` — The public sign-in page always expands a “Demo access” block that prints `password123` next to demo emails. It is not limited to development. → Remove the block from production builds. Demo seeding is already disabled when `NODE_ENV` or `VERCEL_ENV` is production (`app/api/admin/seed/route.ts:13-29`).

### C. Stripe

No remaining PF items. Webhook receipts, subscription status, plan derivation from price id, and checkout customer reuse are in place (`app/api/stripe/webhooks/route.ts`, `lib/subscription-events.ts`, `lib/subscription-checkout.ts`).

### D. Orders and checkout

- **PF-116** · **Medium** · Edge case · `app/grower/orders/[id]/edit/components/EditOrderForm.tsx:137-148`; `app/api/orders/[id]/route.ts:296-354` — Edit recomputes line totals and refuses a quantity the inventory cannot cover. `unitPrice` still comes from the client (`item.unitPrice ?? existing` or `item.unitPrice ?? product.price`). The form marks itself dirty by stringifying the full payload whenever those fields change. → Price edited lines from the product or an accepted quote unless a grower override is an explicit, server-checked field. Compare dirty fields without serializing the order.
- **N-007** · **New** · **Medium** · Edge case · `app/api/orders/route.ts:134-146`; `app/api/orders/route.ts:206-221`; `app/api/orders/route.ts:255-260` — `POST /api/orders` (grower direct orders) decrements stock with a conditional `updateMany`, then stores `item.unitPrice` from the body in a range of 0 to 999999.99. Checkout, by contrast, uses the product price or an accepted quote (`app/api/checkout/route.ts:281-300`). Hitting zero quantity does not set `isAvailable: false`, which checkout does. → Use the same server price rules as checkout, and clear availability when the decrement lands on zero.
- **N-008** · **New** · **Medium** · Cost · `app/dispensary/orders/page.tsx:41-68` — After a paged order query, the page loads conversations for those growers and then `count`s unread messages once per conversation. The conversations API already does this with one `groupBy` (`app/api/messages/conversations/route.ts:91-98`). → Use that single grouped query.

### E. Products, strains, batches

- **PF-038** · **Medium** · Cost · `app/api/products/route.ts:117-133`; `app/grower/orders/add/page.tsx:49`; `app/grower/inventory/add/page.tsx:35`; `app/grower/inventory/page.tsx:20-35` — Image bytes are no longer in this payload, and the paged path is capped at 100. Callers that omit `paged=true` still receive every product. The inventory page runs its own unpaged `findMany`. → Default the API to a page, and paginate inventory.
- **PF-112** · **Medium** · Cost · `app/api/batches/route.ts:115-141` — List responses only expose `labDocumentCount`, but the query selects `testResults` and `terpenes` for every batch. A legacy row can still hold a large JSON document. → Store a document count, or count keys in SQL, and leave `testResults` off the list select.

### F. Customers

- **N-009** · **New** · **Medium** · Cost · `app/grower/customers/page.tsx:30-34`; `lib/customers.ts:3-7`; `app/grower/dashboard/page.tsx:143-155` — The customer page loads every dispensary that this grower created or that has any order or conversation with them, including the user email, then runs two `groupBy`s. That `OR` of `some` relations is unpaginated. The dashboard loads every delivered order from the last 30 days into memory to draw a daily chart, and it calls `getGrowerAttentionSummary` again in the same request as the layout. → Paginate customers. Aggregate delivered totals by day in SQL. Share the attention summary with `cache()` so the layout and dashboard hit it once.

### G. Dispensary APIs and shop

- **PF-074** · **Medium** · Cost · `app/dispensary/grower/[id]/page.tsx:27-35` — Verification, license window, website scheme, and delivered-only counts are fixed. `products` is still an unbounded nested `findMany` of every in-stock SKU (`buyerProductSelect` omits image bytes; each card then requests a thumbnail). → Paginate the shop, or cap the first page and load more from the catalog API.

### H. Messaging and notifications

- **PF-121** · **Medium** · Cost · `app/components/messaging/ChatDrawer.tsx:420-437` — The drawer is mounted from grower and dispensary layouts (`PortalFloatingActions`) but the 15s conversation interval and the 12s thread interval run only while open / visible. Each tick refetches the whole list or thread. → Poll with `?after=`, or replace the timer with server push. Pause the conversation interval when the tab is hidden (the visibility listener currently adds an extra fetch rather than replacing the interval).
- **N-003** · **New** · **High** · Cost · `lib/grower-attention.ts:109-140`; `app/grower/layout.tsx:38-40` — Every grower navigation loads up to 100 conversations, each with its latest inbound message, then runs `Promise.all` of one `count` per conversation. That summary also drives the nav badge. → One grouped unread query, as in `app/api/messages/conversations/route.ts:91-98`, and a short cache keyed by grower id.
- **N-004** · **New** · **Medium** · Cost · `app/components/notifications/NotificationBell.tsx:47-50`; `app/api/notifications/route.ts:10-26` — Grower and dispensary layouts render the bell, which fetches `/api/notifications` on mount and every 60 seconds. The handler counts unread rows and, when notification hrefs point at orders, loads those orders. → Poll only while the panel is open, or back off while the document is hidden. The unread badge can be a single count.

### I. Admin

No remaining PF items. Demo seed is POST-only, non-production, and requires `DEMO_SEED_PASSWORD`. Verify redirects use status 303. Admin lists are paged.

### J. Grower server pages

Covered above: PF-038 (inventory), PF-069 (marketplace images), PF-071 (redirect vs `notFound`), PF-112 (batch list), N-003 and N-009 (layout, dashboard, customers). Grower settings itself now passes `initialSettings` and skips the client refetch when that prop is set (`app/grower/settings/page.tsx:37-60`, `app/grower/settings/components/SettingsForm.tsx:195-197`). The logo value in that payload is still the stored column (PF-002).

### K. Dispensary server pages

- **PF-072** · **Medium** · Speed · `app/dispensary/settings/page.tsx:18-32`; `app/dispensary/settings/components/SettingsForm.tsx:248-254`; `app/dispensary/catalog/page.tsx:18-19` — Dispensary settings is a server page that renders an empty form, then the client loads `/api/dispensary/settings`. Catalog does not pass the first page of products. Favorites and price-alert URLs only redirect to `/dispensary/saved`. → Load the dispensary profile in the server page and pass it as `initialSettings`, the same way grower settings does. Optionally pass the first catalog page as initial data.

### L. Client components — dispensary

- **PF-088** · **Low** · Other · `app/dispensary/catalog/components/MobileFilterSheet.tsx:75-81` — Dialog semantics are present. `handleTouchMove` calls `onClose` as soon as the finger moves down 50px, so a scroll inside the sheet can dismiss it. → Close only from a drag on the handle, or require the gesture to start at the top of the sheet.
- **PF-094** · **Medium** · Cost · `app/dispensary/layout.tsx:66`; `app/dispensary/PriceAlertSessionRefresh.tsx:6-10`; `app/dispensary/price-alerts/PriceAlertsContent.tsx:75`; `app/api/dispensary/price-alerts/refresh/route.ts:14-27` — The dispensary layout POSTs a price-alert refresh once per browser session, and the alerts tab POSTs it again when it becomes ready. The handler loads every visible alert and updates changed rows one by one. → Refresh once per session from one place. Update changed prices with a single SQL statement.

### M. Client components — grower and shared

No additional client-only PF items. Product cards on the grower products page are module-scope components (`app/grower/products/page.tsx:240` is above `GrowerProductsPage` at line 561), so they are not recreated on each keystroke. Chat residuals are PF-121. Order-edit residuals are PF-116.

---

## 5. Counts

| Severity | Sep 17 | This checkpoint (partial residuals + new) |
|---|---:|---:|
| Critical | 3 | 0 |
| High | 27 | 4 |
| Medium | 66 | 14 |
| Low | 30 | 4 |
| **Total** | **126** | **22** |

Sep 17 had 126 open items (3 critical, 27 high, 66 medium, 30 low). On this checkpoint, 113 of those 126 are fixed, 13 are partial, none are still fully open, and 9 new items bring the current list to 22 (0 critical, 4 high, 14 medium, 4 low).

Current high items: PF-002, N-001, N-002, N-003.
