# PhenoFarm — Database Audit & Fix Prompt

**Date:** 2026-06-11 · **Scope:** prisma/schema.prisma (23 models, 13 migrations), the live Postgres data, and every query path that touches it. Each finding below was verified against the current code and local database — usage counts are from grep, index reality from `pg_indexes`, storage claims from the upload routes.

**Headline findings:**
1. **Almost no indexes exist.** `orders`, `products`, and `order_items` have ONLY their primary keys (plus `orders.orderId` unique) — every dashboard, list, and catalog query is a sequential scan. Prisma does not auto-index foreign keys on Postgres.
2. **Five tables and two enums are completely dead** (zero code references): `Session` (JWT auth — never used), `Payment` + `PaymentMethod`/`PaymentStatus` (dormant wholesale-payment remnant that contradicts the payment model), `MetrcSyncLog` (no sync exists), and `Cart`/`CartItem` (the request draft lives entirely in localStorage).
3. **Uploads store base64 data-URIs in the database** (product images, COA/lab PDFs, logos) — megabytes per row at scale, dragged through every list query.
4. **Legacy product columns** (`thcLegacy`, `cbdLegacy`, `strainLegacy`, `categoryLegacy`, `subcategoryLegacy`) are still read as fallbacks in 5–16 files each — they need a backfill-then-drop, not a straight drop.
5. **Order IDs collide under concurrency**: `ORD-${Date.now()}` in the direct-order route is unique-constrained, so two simultaneous orders = unique violation = 500.

**Copy the block below into Codex as one task.**

---

```
You are working in /Users/sam/dev/phenofarm-mvp (Next.js 16 + Prisma 6.5 + Postgres; local DB `phenofarm` on localhost:5432, production on Neon). PhenoFarm is a B2B cannabis marketplace; NO wholesale money moves through the platform (the Payment table below is a dead remnant, not a feature). This task hardens the database layer for scale and removes dead weight. Work in THREE ordered phases: (1) additive migration + code, (2) backfill scripts, (3) destructive migration — never combine additive and destructive changes in one migration. Use `npm run prisma:migrate` mechanics (`node scripts/prisma-env.mjs` wraps the CLI to read .env.local). Run `npm run verify` and `npm run test` after each phase.

━━━━━━━━ PHASE 1 — ADDITIVE: INDEXES + INTEGRITY (safe, do first) ━━━━━━━━

D1. Add the missing indexes. pg_indexes confirms orders/products/order_items currently have ONLY primary keys. Add to schema.prisma:
   - Order: @@index([growerId, status, createdAt]), @@index([dispensaryId, status, createdAt]), @@index([growerId, createdAt]) — these cover the grower/dispensary order lists, saved-view chips, dashboards, and reports.
   - OrderItem: @@index([orderId]), @@index([productId]), @@index([growerId]), @@index([acceptedQuoteId]).
   - Product: @@index([growerId, isDeleted, isAvailable]) (grower catalog/products/inventory), @@index([isDeleted, isAvailable]) (buyer catalog scans all growers), @@index([strainId]), @@index([batchId]).
   - Batch: @@index([strainId]) (growerId is covered by the @@unique([growerId, batchNumber]) prefix).
   - OrderStatusEvent: @@index([actorUserId]).
   - ConversationMessage: @@index([productId]).
   Do NOT add redundant indexes where a @@unique already covers the prefix (strains, product_type_configs, dispensary_* tables are already covered).

D2. Model integrity fixes (same migration):
   - Batch.thc / cbd / totalCannabinoids are Float while Product potency uses Decimal(5,2) — convert the three Batch columns to Decimal(5,2) (values are percentages; a USING cast in the generated SQL is fine).
   - Add @updatedAt to Batch and ProductTypeConfig (both are editable but have no updatedAt).
   - ConversationMessage.respondedToMessageId is a bare String — make it a real self-relation (respondedToMessage ConversationMessage? @relation("QuoteResponse", fields:[respondedToMessageId], references:[id], onDelete: SetNull) + opposite list) with an index. Same for ConversationMessage.productId → optional Product relation (onDelete: SetNull) and Conversation.createdByUserId → optional User relation (onDelete: SetNull); update any code that relied on these being plain strings (they can stay populated the same way).
   - ProductTypeConfig @@unique([growerId, type]) does NOT prevent duplicate global defaults because Postgres treats NULL growerId rows as distinct. The table is currently empty of NULL rows — move global default types into a code constant (lib/product-types.ts already exists; make the API merge constants + grower rows) and add a raw-SQL partial unique index `CREATE UNIQUE INDEX ... ON product_type_configs (type) WHERE "growerId" IS NULL` in the migration as a backstop.
   - Leave the LicenseStatus enum's lowercase casing alone (migration churn outweighs cosmetics) — just add a schema comment noting it is intentionally legacy-cased.

D3. Collision-safe order IDs. app/api/orders/route.ts writes orderId: `ORD-${Date.now()}` (unique column — concurrent orders 500 on P2002) and checkout uses `ORD-${Date.now()}-${n}` (only unique within one request). Create lib/order-id.ts with a single generator used by BOTH routes: `ORD-{YYYYMMDD}-{6-char base36 from cuid/crypto}` (human-scannable, collision-safe), and wrap order creation with one retry on P2002. Do not touch existing rows.

D4. File storage off the database. app/api/products/upload/route.ts and upload-document/route.ts convert files to `data:` base64 URIs that get persisted into products.images[], ingredientsDocumentUrl, batch lab-document fields, and grower/dispensary logo columns. This bloats rows into the megabytes and rides along in every list query. Fix:
   - Integrate @vercel/blob: when BLOB_READ_WRITE_TOKEN is set, upload routes `put()` the file (path like `products/{growerId}/{cuid}.{ext}`) and return the blob URL instead of a data URI. When the token is absent (local dev), keep the current base64 behavior so dev works with zero setup. lib/upload-validation.ts stays as the gatekeeper for both paths.
   - Add scripts/migrate-blobs.ts: scans all columns that may hold `data:` URIs (products.images, ingredientsDocumentUrl, batches' coa/lab doc fields, growers.logo, dispensaries.logo), uploads each to blob storage, replaces the value, prints a summary; refuses to run without the token; idempotent (skips http(s) URLs).
   - Trim hot-path selects so images stop riding along where unused: /api/products GET (grower list) should select explicit fields; the dispensary catalog route already selects — audit it for images being fetched in list mode and keep only images[0].
   - Document BLOB_READ_WRITE_TOKEN in .env.example and docs/ENVIRONMENT_VARIABLES.md, and align .codex/file-storage-policy.md with this implementation.

D5. Unbounded queries. /api/orders GET returns every order for the account with full item includes, and the catalog fetch has no ceiling. Add default pagination that does not break existing UIs: `take` (default 100, max 200) + optional `cursor` on /api/orders GET and the catalog/products APIs; include `nextCursor` in responses. UIs that pass nothing get the first page — verify the orders/catalog pages still render (they currently show small datasets).

━━━━━━━━ PHASE 2 — BACKFILL SCRIPTS (run before any drop) ━━━━━━━━

D6. Legacy product columns retirement (thcLegacy, cbdLegacy, strainLegacy, categoryLegacy, subcategoryLegacy — still read as fallbacks across 5–16 files each). Write scripts/backfill-legacy-product-fields.ts:
   - thcLegacy → thcMin/thcMax (set both to the legacy value) where thcMin/thcMax are null; same for cbdLegacy → cbdMin/cbdMax.
   - strainLegacy → find-or-create Strain by (growerId, name=strainLegacy trimmed) and set strainId where strainId is null.
   - categoryLegacy → productType where productType is null; subcategoryLegacy → subType where subType is null.
   - Print per-field backfill counts and write a JSON snapshot of the original legacy values to .codex/tmp/legacy-backup-{date}.json before mutating.
   Then update ALL readers to stop falling back to legacy fields (grep each field; the fallback chains like `thcMax ?? thcMin ?? thcLegacy` become `thcMax ?? thcMin`), and remove legacy fields from serializers/types. Do NOT drop the columns yet — that is Phase 3.

D7. Row cleanup script. Add scripts/cleanup-dev-data.ts (guarded: exits unless NODE_ENV !== 'production' or --force): deletes conversation messages LIKE 'Automated %' plus their emptied conversations, notifications older than 90 days that are read, and any rows in sessions/payments/metrc_sync_logs/carts/cart_items (all dead tables — verify and print counts first). Run it locally.

━━━━━━━━ PHASE 3 — DESTRUCTIVE MIGRATION (only after Phases 1–2 verified) ━━━━━━━━

D8. Drop the dead weight. Preconditions printed and checked by a script (scripts/verify-drop-safety.ts) that counts rows in the target tables on the CONNECTED database and refuses if any table it is about to drop has rows (except the ones cleanup emptied):
   - Drop models + tables: Session, Payment, MetrcSyncLog, Cart, CartItem. Drop enums PaymentMethod, PaymentStatus. Remove the relations they held (User.sessions, Order.payments, Grower.metrcSyncLogs, Grower.cartItems, Product.cartItems, Dispensary.cart).
   - Drop the dormant Stripe Connect columns on Grower: connectOnboardedAt, stripeAccountId, stripeAccountStatus (zero code references; .codex/payment-model.md explicitly parks them "until a dedicated migration removes them" — this is that migration; update that doc to say they were removed).
   - Drop Product.lastSyncedAt (zero references). KEEP Product.isFeatured (still used).
   - Drop the five legacy product columns from D6 ONLY IF the backfill ran and no code references remain (grep must be clean).
   - Keep Order.tax (it records grower-entered tax on direct invoices — do not confuse it with the dead Payment machinery).
   Run this as its own migration with a clear name (e.g. drop_dead_payment_cart_session_tables). For production: take a Neon branch/backup first, run scripts/verify-drop-safety.ts against the prod DATABASE_URL, then prisma migrate deploy.

━━━━━━━━ OPTIONAL STRETCH (do only if time permits, as a separate commit) ━━━━━━━━

D9. Single source of truth for account links. User.growerId/User.dispensaryId duplicate Grower.userId/Dispensary.userId — two writable copies of the same edge (registration writes both; off-platform customers now have Dispensary.userId = null which User-side can't represent). Correct fix: drop User.growerId/dispensaryId, and in the NextAuth jwt callback resolve the profile id via the relation at sign-in (db.grower.findUnique({ where: { userId } }) etc.), keeping the token shape identical so nothing downstream changes. This touches lib/auth.ts + register + seed + the customers route. Only attempt with the full test suite green before and after.

━━━━━━━━ VERIFICATION ━━━━━━━━

1. `npx prisma validate` and `npx prisma migrate dev` produce three cleanly separated migrations (additive / none for backfill / destructive).
2. `npm run verify` and `npm run test` green after each phase.
3. EXPLAIN sanity check (document in the PR/commit message): `EXPLAIN SELECT * FROM orders WHERE "growerId"='x' AND status='PENDING' ORDER BY "createdAt" DESC` uses the new index.
4. With BLOB_READ_WRITE_TOKEN unset, product image upload still works (base64 path); with it set, uploads produce https blob URLs.
5. Two rapid consecutive direct orders (script or test) both succeed with distinct ORD- ids.
6. Demo flows still work end-to-end: catalog → request → accept → deliver; grower direct order; quotes. No page references cart/session/payment tables (grep clean).
7. Production rollout order documented in the final commit: backup/branch → phase-1 deploy → backfill script → phase-3 deploy.
```
