# Production release-candidate workflow audit — September 23, 2026

**Result: not ready for a broad launch.** The main quote-to-delivery workflow works on production, but onboarding, safe order retries, and settlement records have release-blocking gaps. This audit tested the deployed app and its actual production database and file storage; local test results were not substituted for live evidence.

## Release and method

- Site: https://phenofarm-mvp.vercel.app
- Commit: `79bfae0d381e2adac8269eb7539598a9ce01fbb9`
- Deployment: `dpl_6VPuDJ7bmn4eDTagkxiyWdPqvwCy`, `phenofarm-7yxmxfnyv-kevin-means-projects.vercel.app`, production, Ready.
- The production alias and commit were verified before testing and again after the workflow runs.
- Browsers: real Chrome credential sign-in, desktop at 1440 px and mobile viewport at 390 px. Mobile evidence is browser emulation, not a physical iPhone or Android device.
- Accounts: two fresh growers, two fresh buyers, and a temporary test administrator. Public registration failed, so these isolated fixtures were provisioned in the database with unverified licenses. All five accounts then signed in through the real production login form. No forged sessions were used. This continuation does **not** establish successful public signup or verified email ownership.
- Synthetic licenses, products, lab reports, orders, and payment notes were clearly marked QA TEST ONLY. Approval tests exercise the application's admin decision flow, not external license authenticity checks. No goods or real payments moved.
- Faults were injected only into test browser requests or test record expiry dates. The successful requests still reached the actual production services. Database/server outage recovery was not deliberately induced on shared production.
- Evidence: [71 final observations](evidence.json), [fixture transaction evidence](fixture-evidence.json), [before snapshot](baseline.json), [after cleanup snapshot](after-cleanup.json). Superseded harness errors are explicitly identified in the evidence file and are not app findings.

## Confirmed findings

### 1. P1 — Public registration and account email flows are unavailable

Both grower and buyer registration forms returned **503**, “Sign-up is temporarily unavailable,” and created no accounts. Production has `AUTH_REQUIRE_EMAIL_VERIFICATION=false`; the registration route intentionally rejects signup in this state. Account mail provider/sender settings are absent. The actual password recovery form and email verification request endpoint both returned **503**, “Email delivery is temporarily unavailable.”

The earlier local tests therefore do not establish production onboarding, inbox delivery, successful password recovery, or single-use emailed links. Invalid token submissions did correctly preserve password hashes, session versions, and verification state.

Required before launch: configure and verify actual email delivery, test real inbox receipt and link completion, and enable registration only once that prerequisite works. Repeat expired-link, used-link, and session-revocation checks on the final configured deployment.

Source: `app/api/auth/register/route.ts:16`, `lib/account-security-api.ts:38`.
Evidence: [grower signup](signup-grower.png), [buyer signup](signup-dispensary.png), [recovery error](recovery-unavailable-mobile.png).

### 2. P1 — Growers cannot save profile/license settings through the UI

A valid profile save returned **400**, `Invalid email`, twice. The form strips `email` from its saved draft value and sends that same value to the settings endpoint; the endpoint requires email on a full update. The existing license remained unchanged.

The downstream audit continued using the real API with the current email explicitly supplied. That workaround allowed the profile to be submitted for approval but does not fix the UI or complete normal grower onboarding.

Required fix: make the profile form's submission contract match the endpoint, then repeat a fresh grower's profile submission and admin approval without the workaround.

Source: `app/grower/settings/components/SettingsForm.tsx:134` and `:306`; `lib/profile-settings.ts:49`.
Evidence: [production error](grower-settings-invalid-email.png).

### 3. P1 — Retrying an order after a lost response creates a duplicate order

Two identical concurrent submissions with the same `Idempotency-Key` both returned **200**, producing two orders and reserving stock twice (10 → 6 for a quantity of two per submission).

The mobile UI reproduced the practical failure: the first request reached production and committed successfully, then its response was deliberately dropped. The draft remained and displayed a network error. Retrying through the visible Submit request button created a second order, leaving stock at 8 instead of 9. Both server requests returned 200.

Ordinary rapid double-taps **did** submit once. The current client guard does not solve ambiguous network failures, retries from another tab, or repeated server requests.

Required fix: persist a stable submission identifier through browser retries and enforce it transactionally on the server. Cover per-grower partial success so retrying failed portions does not duplicate already committed orders. A retry must recover the original result.

Source: `app/dispensary/cart/page.tsx:427`, `app/api/checkout/route.ts:100`.
Evidence: [mobile retry screen](lost-response-retry-mobile.png), observations “Duplicate submissions with same idempotency key” and “Lost response after production commit followed by mobile retry.”

### 4. P2 — Saved settlement notes disappear from request detail pages

The grower edited the delivered order through the real UI and appended a synthetic settlement date, amount, method, and reference `QA-SETTLEMENT-001`. The update returned 200. The note remained in the database and edit form, but it was absent from both grower and buyer request detail pages.

The note parser separates structured buyer notes from additional lines. Both detail pages render `buyerNotes || legacyNotes`, hiding the additional text whenever buyer notes already exist. This also affects ordinary appended instructions and multiline notes, not only settlement notes.

Required fix: render both note portions without dropping text, or provide a structured note model with clear ownership. Repeat save, reload, both-account display, and export checks.

Source: `app/grower/orders/[id]/page.tsx:483`, `app/dispensary/orders/[id]/page.tsx:332`, `lib/order-workflow.ts:108`.
Evidence: [grower detail](settlement-detail-g1.png), [buyer detail](settlement-detail-b1.png), persisted notes in [fixture evidence](fixture-evidence.json).

### 5. P2 — Exports imply completed settlement and omit the supporting terms/reference

A still-submitted, unpaid test request exported a Settlement value of **“Settled directly between businesses — no funds processed by PhenoFarm.”** That text is unconditional; it is not evidence of payment. Both pending and delivered exports omitted Net 30 terms and the saved settlement reference.

Required fix: describe settlement responsibility without asserting payment occurred, and include payment terms and relevant saved record fields in the export. If the product is intended to track settlement completion, add an explicit record of status, amount, date, method, and reference with an audit trail. The current schema has no structured paid/settled record. External settlement can be documented without processing funds or using Stripe.

Source: `app/components/ui/OrderRecordExport.tsx:9`, `prisma/schema.prisma:244`.
Evidence: [submitted order CSV](pending-export.csv), [delivered settlement CSV](settlement-export.csv).

### 6. P2 — Repeating an admin approval request reverses the decision

After a test buyer was approved, repeating the same POST to its verification endpoint changed it back to unverified/pending review. The test restored its approved state afterward. The endpoint toggles the current state instead of applying an explicit desired decision. Grower verification uses the same pattern; the live duplicate test was performed on the buyer endpoint.

Required fix: submit an explicit verify/revoke action, enforce the expected current state where appropriate, and make retrying the same decision safe. Keep notification/history creation consistent with one effective change.

Source: `app/admin/dispensaries/[id]/verify/route.ts:30`, `app/admin/growers/[id]/verify/route.ts:30`.

## Workflow coverage

| Workflow / edge case | Production result |
| --- | --- |
| Public grower and buyer registration | Blocked: both 503; no accounts created |
| Fresh credential login for both roles and administrator | Passed with provisioned fixtures |
| Buyer profile/license submission on mobile and reload | Passed |
| Grower profile/license submission through normal UI | Failed: missing email in request |
| Admin approval of both growers and both buyers through UI | Passed; buyer existing session recognized approval |
| Unapproved buyer attempts to order; grower attempts admin approval | Denied; no unauthorized approval |
| Buyer license changed after approval | Approval reset; ordering blocked until review |
| Buyer license expires while signed in | Ordering blocked with LICENSE_EXPIRED; renewal and reapproval restored access |
| Grower license expires | Listings hidden; valid buyer's order rejected |
| Strain, batch, product creation | Passed; batch/product created through real forms |
| Three lab PDF uploads and product image | Passed against production Blob; saved database references and byte-for-byte download parity |
| Invalid PDF signature and buyer product-image upload | Rejected |
| Image upload network failure before dispatch, then retry | Form remained usable; retry uploaded and saved successfully |
| Buyer mobile catalog, pricing request, grower quote, buyer counter, grower acceptance | Passed through UI |
| Hidden list prices in buyer API | Price remained null |
| Sender accepts own offer / other account acts on offer | Rejected |
| Concurrent quote acceptance | One success, one conflict, one accepted quote |
| Quote consumption, oversized request, expired quote | Consumed quote could not be reused; exceeding cap and expiry rejected with no stock loss |
| Quote quantity semantics | Quantity is a maximum, not a minimum; a smaller order consumes the single-use quote |
| Accepted quote → mobile draft → order | Passed; 3 × $7.50 = $22.50; quote linked and consumed; stock 30 → 27 |
| Grower-created order | Passed; actual server catalog price used despite a supplied lower price |
| Buyer confirms and withdraws grower-created request | Passed through UI; inventory returned |
| Fulfillment Submitted → Accepted → Preparing → Ready/In transit → Delivered | Passed through grower UI; both parties saw delivery; five history events, shipped/delivered timestamps |
| Buyer attempts fulfillment / invalid skipped status | Rejected |
| Buyer withdraws pending request | Passed; stock restored |
| Buyer withdraws after grower acceptance | Rejected |
| Concurrent cancellation and repeated cancellation | Inventory returned exactly once; one cancellation history event |
| Delivered order quantity edit and cancellation | Rejected; quantities and inventory unchanged |
| Order quantity edits | Increase reserved stock; decrease restored stock; insufficient increase rolled back |
| Two buyers compete for 5 units, each requests 3 | One order succeeded, one conflicted; 2 units remained; no oversell |
| Duplicate lines in a single draft | Consolidated to one line/reservation |
| Identical logical order retried concurrently or after lost response | Failed: duplicate orders |
| Rapid mobile double-tap | Passed: one request and one order |
| Failure before an order reaches the server | Draft retained; retry created one order |
| One grower's multi-line request contains insufficient stock | Whole grower order rolled back; no partial inventory loss |
| Mixed-grower request partially succeeds | Passed API and mobile UI; only failed items stayed in draft, including after reload |
| Cross-account orders, status mutations, conversations, messages, offer actions | Tested second grower/buyer and anonymous sessions; private API access denied |
| Other grower edits/deletes product or batch, or attaches an image | Denied; original fixture data unchanged |
| Other account opens private order page | Private product/order content absent |
| Settlement notes and CSV | Failed as described above; no real payment processing attempted |
| Recovery and verification email requests | Blocked by actual production configuration |
| Invalid recovery/verification tokens | Rejected; hash/session version/verification unchanged |

## Scope limits and follow-up gates

The buyer catalog currently displays **“Labs on request”**, with no link to the uploaded COAs. Upload, persistence, and file retrieval were verified; automatic buyer discovery/download of those lab reports was not established. Decide whether a request-only delivery flow is sufficient before claiming end-to-end self-service COA access.

Public signup and successful emailed recovery/verification remain blocked, so there is no complete new-public-user onboarding pass. The administrator and business profiles were synthetic test fixtures. Real email delivery, actual licensing decisions, external payment reconciliation, physical fulfillment, physical mobile devices, sustained load, and provider outages were not tested.

Application code and production configuration were not changed during this audit. These results describe this exact release candidate. Fix the findings and rerun the affected journeys on the deployment that will actually launch; new local passes alone do not close these live failures.

## Cleanup and original-data verification

Cleanup removed **5 test users, 18 test orders, 17 test products, 1 conversation and its messages/quotes, 1 batch, 1 strain, and 5 Blob objects**, along with dependent notifications and status history. Provider listings confirmed all test upload prefixes were empty.

All **51 pre-existing records across 19 audited tables** matched their pre-test row counts and SHA-256 hashes exactly after cleanup. Authentication rate-limit counters were intentionally excluded and retained as security state; migration history was outside this comparison. No original business records changed.

A pre-audit Neon recovery branch, `pre-live-qa-20260923` (`br-lively-rice-aig3nllj`), was retained without a compute endpoint. Test credentials, browser session files, and the temporary production environment copy were removed after verification. Saved report artifacts contain fixture information and sanitized evidence only.
