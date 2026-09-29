# Grower UX audit implementation — September 29, 2026

Scope: GO1–GO11, GR1–GR20, GM1–GM12, GC1–GC11, GRp1–GRp4, GB1–GB14 (72 items), plus shared-pattern adoption and the applicable section 4 removals. Source audit: `ux-audit-2026-09-29.md` supplied by the user.

## Verification boundary

Implementation and verification use the isolated local app at `127.0.0.1:3187` and database `phenofarm_auth_ux_20260929`. Tests create uniquely named synthetic accounts and remove only their own fixtures. No production data, provider configuration, charges, Git publication, or deployment is part of this agent's verification.

The grower regression suite is `tests/ux-grower-20260929.spec.ts`. It includes real browser/API/database readbacks. Subscription error/activation scenarios use intercepted local API responses; these establish UI behavior, not a live Stripe checkout or webhook result. Schema migration and production integration remain the coordinating agent's responsibility.

## Evidence index

`R` means the relevant implementation and data contract were reviewed. The named tests exercise combined workflows; they are not a claim that every conditional branch of every individual finding has a separate automated test.

- **T1:** Manual orders start Accepted; status Undo is single-use, restores/reserves stock correctly, persists reasons, and displays the actor; off-platform contacts have no Message action.
- **T2:** Explicit stock correction is audited; concurrent ordinary orders against one remaining unit yield one success and one conflict, with zero stock remaining.
- **T3–T4:** At 1440px and 390px, validate blank form, add a phone-only customer inline, pick a product, clear and enter a formatted custom price, save delivery/terms, read back the stored amount, edit quantities/prices, add an item, and repeat the saved order.
- **T5:** ZIP persists; cross-grower contact access/edit is denied; twelve older orders delivered today appear in the selected-range CSV and downloaded PDF with recorded notes. The 90-day chip changes the actual range.
- **T6:** Fifty-two pending records prove counts are independent of the 50-row page; needs-review filtering, bulk update/Undo, cancellation reasons, and debounced URL search work.
- **T7–T8:** At 1440px and 390px, render overview, active orders, history, customers, customer overview, statement, reports, pricing and settings without document overflow. Save profile plus terms with an unchanged expired license; change license and observe warning and persisted review state.
- **T9:** The server uses the accepted quote's scoped price, consumes it once, rejects price changes and aggregate quantity increases across split lines, and rejects Undo after an intervening order edit.
- **T11:** Two orders edit the same products in opposite client line order through five concurrent rounds. Both reservations and final quantities persist, without deadlocks or overselling.
- **T10:** A failed plan lookup shows Retry without inventing Free; successful retry displays the actual plan; checkout return waits for active/trial status and shows the trial end date. API responses are mocked for this billing-state test.

Screenshots and the full downloaded PDF are at `/tmp/phenoshop-ux-20260929/grower-screenshots/`. Rendered review found and corrected a squeezed mobile detail heading and stale inline validation messages. A subsequent screenshot pass checks the corrected state. The full-page screenshot helper scrolls to the top before capture so sticky headers are positioned consistently.

## Item-by-item implementation

| Audit item | Implemented behavior | Main source | Evidence |
| --- | --- | --- | --- |
| GO1 | Expanded top setup checklist for profile, reviewed license, saved terms, first product and logo; hidden when complete. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO2 | Setup links target profile/license/terms/branding sections; initial hash focuses first empty field. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO3 | Subscription and buyer-order pseudo-completion removed; terms require explicit saved values. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO4 | Needs-review query resolves to server-side PENDING filter. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO5 | New orders make Review N new orders the primary dashboard action. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO6 | One expanded attention panel replaces the three overlapping dashboard feeds. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO7 | Attention status/cancellation reads require buyer-authored events; action badge excludes cancellations. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO8 | Dashboard and report delivered values share New York day boundaries and deliveredAt/legacy updatedAt basis. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO9 | Low-stock dashboard requires published, live, priced products with per-unit thresholds. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO10 | Dashboard skeleton mirrors three statistics, attention list and chart/inventory columns. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GO11 | Hidden-listings banner links directly to license section. | `app/grower/dashboard/page.tsx; lib/grower-attention.ts` | R; T6–T8 |
| GR1 | Forward status buttons execute once, with 8-second Undo; new-order destructive action says Decline. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR2 | Each list row has the next valid status action. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR3 | Bulk transitions provide Undo; bulk cancellation requires reason and confirmation. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR4 | Cancellation reasons are persisted on status events and included in buyer notifications. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR5 | Orders search customer, order number or product; query persists in URL. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR6 | Status counts use scoped server groupBy independently of pagination. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR7 | Call, Email and platform Message actions sit near status controls; contact values are tappable. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR8 | Edit/Print/Export are visible; Edit hidden after shipment/delivery/cancellation. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR9 | Order customer name opens customer overview. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR10 | Expected-status conflicts name current stage and ask for refresh; cross-account orders remain concealed. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR11 | Editable raw quantity input plus steppers. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR12 | Edit uses create product picker and price fields; accepted quote prices stay protected. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR13 | Structured fulfillment, address, date and payment terms parsed into fields; free text preserved. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR14 | Status controls removed from edit form. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR15 | History now has URL search, date/status filters, full export and Repeat. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR16 | Detail title contains full order number and customer. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR17 | One expanded History section replaces nested progress and history disclosures. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR18 | History uses actor name/email and includes reason/undo notes. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR19 | One order link per mobile row; checkbox labels provide 44px hit areas. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GR20 | Mobile item cards show accepted quote pricing. | `app/grower/orders; app/api/orders/[id]; lib/order-undo.ts` | R; T1, T3–T4, T6–T9 |
| GM1 | Inline minimal customer creation preserves current order. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM2 | Grower-recorded orders start Accepted with operational history; no fabricated buyer acknowledgment. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM3 | Price remains raw while edited; optional override note defaults to Phone price. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM4 | Add item opens searchable product picker with strain, stock and price. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM5 | Save opens the created order detail with success toast. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM6 | customer/from URL prefill, customer New order, history Repeat, accepted quote prefill. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM7 | Fulfillment/date/payment pickers prefill saved terms. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM8 | Explicit received-stock correction checkbox; product locking, audited adjustment and reservation in one transaction. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM9 | Owned/recent customers first, then alphabetical; picker supports arrows and Enter. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM10 | Shared unsaved guard protects order, customer and unified settings/terms forms. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM11 | Form renders while picker data loads; independent errors and retry. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GM12 | Customer vocabulary consistent; selection hint shown only after submission. | `app/grower/orders/components/OrderForm.tsx; app/api/orders/route.ts` | R; T2–T4, T9 |
| GC1 | Customer overview includes tappable contacts, recent open/past orders, statement, New order and scoped Edit. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC2 | zipCode sent consistently and stored as zip. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC3 | Business name plus email or phone, inline errors, submit remains enabled. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC4 | Off-platform contacts show Call/Email; no dead-end Message action. Conversation API enforcement owned by root. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC5 | Customer search debounces into URL without submit step. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC6 | Customer overview includes open and past orders with separate View all links. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC7 | Statement range presets, status filter (Delivered default), CSV/PDF/Print with actual recorded notes. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC8 | Shared full US state/territory selector in Add and Edit. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC9 | Customer save returns to overview; inline save remains in originating order form. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC10 | Statement back link returns to overview. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GC11 | Customers empty state has Add customer action. | `app/grower/customers; app/api/customers; lib/us-states.ts` | R; T3–T5, T7–T8 |
| GRp1 | Streaming export includes summary and every matching order line; PDF uses the complete export too. | `app/grower/reports; app/api/orders/export/route.ts; lib/report-range.ts` | R; T5, T7–T8 |
| GRp2 | Readable date-range labels plus custom from/to dates. | `app/grower/reports; app/api/orders/export/route.ts; lib/report-range.ts` | R; T5, T7–T8 |
| GRp3 | Desktop report IDs link to order details. | `app/grower/reports; app/api/orders/export/route.ts; lib/report-range.ts` | R; T5, T7–T8 |
| GRp4 | Full order IDs; top-five rankings expand to Show all; full-size Export CSV/PDF buttons. | `app/grower/reports; app/api/orders/export/route.ts; lib/report-range.ts` | R; T5, T7–T8 |
| GB1 | License edits immediately warn of listing pause; saved review status persists. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB2 | Unchanged expired license allows profile and terms saves; changed expiry validates (shared API root). | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB3 | Checkout result states distinguish cancelled, activating, active and delayed; bounded polling refreshes actual provider-backed state. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB4 | Trial end, past-due payment-card action, scheduled end and renewal date are distinct. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB5 | Failed plan fetch shows error/Retry and never invents Free plan. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB6 | Profile, logo reference and terms share one sticky Save changes and one atomic profile PUT. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB7 | Minimum amount, fulfillment checkboxes, payment terms and response-time pickers; unset values remain blank. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB8 | Destructive instant Reset defaults removed; save action stays reachable at bottom. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB9 | Address, city, state and ZIP always visible/editable. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB10 | Account email is plain text with Change email link. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB11 | Subscription exposes Change plan, Cancel subscription/billing portal and renewal date. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB12 | Both billing pages read one lib/plans presentation source; unsupported annual/integration claims removed. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB13 | Free card does not offer meaningless current-plan billing; contact sales opens site contact form. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |
| GB14 | Customer/settings labels use sentence case, without required asterisks; optional fields marked. | `app/grower/settings; app/components/settings; app/grower/pricing; lib/plans.ts` | R; T7–T8, T10 |

## Shared patterns and section 4 cleanup

- X1/X16/X17: Submit remains enabled for validation; customer fields have associated labels and inline errors; order prices/quantities preserve raw input while editing. Correcting a field clears its stale error. Price input accepts currency symbols and thousands separators.
- X3–X9: Shared Button, formatting and status vocabulary; no density/display switchers; one Order noun, full order identifiers, 44px row checkboxes/contact actions, sentence-case report headings, and 14px operational text. Chart axis abbreviations remain appropriate to chart space.
- X10/X14: Database failures are not represented as missing or empty order data. Shared portal error/loading boundaries are supplied by the coordinating agent.
- X15/X18: Reversible line removal and status changes offer Undo. Customer deletion is deferred eight seconds with Undo; the API still blocks deleting retained business history. Shared unsaved-changes guard covers customer, order and unified settings forms. Full-page forms do not use Escape as navigation.
- X19–X23: Mobile save actions sit above bottom navigation; shared toasts/skip navigation come from root. No noisy autosave banner or duplicate visible heading. Order print headings are hidden during normal screen use.
- X25 and section 4: Removed unreferenced `ActivityFeed.tsx`, `OverviewRequests.tsx`, and `OrderStatusTimeline.tsx`; removed edit-status radios, extra View links, row layout switches, nested History disclosures, redundant save controls, repeated settings save explanations, instant Reset defaults, collapsed order term fields, tax helper paragraph, and verbose report empty-state explanation.

## Safety and final code review

GM8 uses an explicit confirmation that missing stock was received. The database locks products, records the correction, and reserves stock in the same transaction. It does not silently permit overselling. Existing whole-unit stock semantics remain, consistent with the product agent's smaller-unit alternative for GP14.

Status Undo uses a signed token containing event identity, exact order version and expiry; it requires the same actor's latest event, fails after intervening edits, records a unique undo relationship, and re-reserves cancelled inventory conditionally. Quote creation is scoped to grower, buyer and product; prices come from the server. Quote use and inventory reservation commit together. A final review found and closed the edit quantity-cap gap, including the split-line case. Order editing now pre-locks the union of affected product rows in sorted order, matching create/cancel paths and preventing opposing line-order edits from deadlocking.

## Final check results

- Full grower suite: **10/10 passed**, including the split-line quote cap regression (`/tmp/grower-ux-tests.log`).
- After final mobile action-row and spacing cleanup: **4/4 affected desktop/mobile workflows passed** (`/tmp/grower-ux-visual.log`).
- After adding consistent edit stock locks: **2/2 quote/concurrency checks passed**, including the new T11 (`/tmp/grower-ux-concurrency.log`).
- Billing state confirmation: **1/1 passed** (`/tmp/grower-ux-billing.log`).
- Standalone TypeScript check: **passed** (`/tmp/grower-ux-tsc.log`).
- Focused ESLint on owned sources: **passed with no errors or warnings** (`/tmp/grower-lint.log`).
- Corrected screenshots visually reviewed at 390px (manual form, order detail, settings, reports) and 1440px (overview, settings, reports). Order actions now share one mobile row; corrected fields no longer retain old validation errors; forms and tables have no document overflow in the checked layouts.
- No outstanding implementation blocker in this assigned scope. Full-app aggregate verification, migrations, publication and live deployment are owned by the coordinating agent; none are inferred from these local results.

Reproduce using the isolated-environment wrapper:

```sh
node /tmp/phenoshop-ux-20260929/run.cjs npx playwright test tests/ux-grower-20260929.spec.ts --reporter=line --output=/tmp/phenoshop-ux-20260929/grower-results
```

The suite now contains 11 tests; the new eleventh concurrency case was run with the related quote regression after the ten-test full pass. This avoids implying a separate full 11-test run.
