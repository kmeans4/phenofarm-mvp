# Shared UI, navigation, account access, messaging, and admin

Implementation record for the September 29, 2026 UX audit. This file accounts for all **96 findings** in these areas: X1–X25, N1–N8, A1–A34, M1–M9, and AD1–AD20. Paths are relative to the repository root.

This is a source and local-validation ledger, not a production-release statement. The companion [products](products.md), [grower/orders](grower-orders.md), and [buyer](buyer.md) ledgers contain the domain-specific changes and checks. The integration agent owns migrations, aggregate verification, Git publication, and any deployment.

## Shared controls and resilience

| ID | Implementation and evidence |
| --- | --- |
| X1 | Strain, batch, stock, customer, and manual-order submission now runs validation rather than silently disabling incomplete forms. Errors identify the field and focus the first problem. Submitting/saving remains disabled to prevent duplicate writes. See `app/grower/components/StrainForm.tsx`, `BatchForm.tsx`, product inline editors, customer forms, and manual order form; domain ledgers record workflow checks. |
| X2 | `app/globals.css` separates the dim placeholder token from body text. Product forms/quick add no longer display fake names, prices, quantities, or SKUs as apparently completed fields. Sign-in/sign-up omit placeholders that duplicate their labels. |
| X3 | Shared type tokens make `text-xs` 14px; portal labels, table headings, helper text, and dialog text use the readable minimum. Shared stat titles, timeline labels, brand/account labels, navigation, and public controls were reviewed. Small 13px mobile badge metadata is retained. Portal label/table uppercase styling is removed. Sources: `app/globals.css`, `StatCard`, `OrderTimeline`, `PortalBrand`, `MobileNav`, `MobileTabs`, and domain forms. |
| X4 | Strong control borders use `#6b8577`; native inputs/selects/textareas use the raised surface. Header search and notification controls explicitly use the strong border. Divider-only borders remain subdued. The native input rule's specificity was corrected so the raised background applies. Sources: `app/globals.css`, `Button`, `SearchDialog`, `PortalDesktopHeader`, `NotificationBell`. |
| X5 | Shared buttons, icon controls, summaries, and checkbox/radio label hit areas have a 44px minimum. `Button` includes `size="touch"`; small buttons also meet 44px. Modal, navigation, notification, search, chat, product, and public/auth controls follow this baseline. Footer and auth-brand links were explicitly raised to 44px. |
| X6 | `app/components/ui/Button.tsx` defaults to emerald primary, gives secondary/outline actions a strong border, and uses white on red-600 for destructive actions. Shared CSS and migrated page actions apply the same size/border/type standards to the remaining native controls; native buttons are retained where a wrapper provides no behavioral benefit. |
| X7 | Portal navigation, order titles/actions, and order timelines use **Order** and the role names **Grower**, **Dispensary**, and **Admin**. Shared terminology lives in `lib/order-workflow.ts`; domain ledgers cover cart/order row/detail changes. Internal database/API names are compatibility details, not user labels. |
| X8 | Order status labels are centralized as New, Accepted, Preparing, On the way, Delivered, and Cancelled. Product states use Live, Hidden, Sold out, and Draft, with Price on request for hidden pricing. Sources: `lib/order-workflow.ts`, `lib/product-display.ts`, grower product list/preview, and buyer catalog/order components. |
| X9 | `lib/format.ts` supplies currency with separators/two decimals, consistent dates in America/New_York, and quantity display. Product display and the order-number helper are reused across the updated lists, details, cart, and reports. Calendar-only license/batch dates preserve their intended calendar date. |
| X10 | `app/global-error.tsx` and grower/dispensary/admin `error.tsx` provide a plain failure message, retry, and a route back to the relevant overview. Portal errors use the shared `ErrorState`. |
| X11 | Each portal has a `loading.tsx` skeleton with an accessible loading status. Navigation no longer relies only on the old grower-dashboard loading file. |
| X12 | Each portal has a `not-found.tsx` using shared empty-state styling and an overview destination. Root not-found styling/destinations were aligned with the public site. |
| X13 | `EmptyState` supports an `actionButton` slot in addition to a link. Admin business/user lists use the shared empty state and pagination. Updated product/strain/batch and buyer lists use shared loading/error/empty primitives; operation-level indicators remain local to their action. |
| X14 | Admin database exceptions reach the portal error boundary instead of rendering success/empty copy. Strain and batch lists show an error with Retry without also claiming there are no records. Buyer catalog load failures use plain recovery text. Sources: admin pages, `BusinessDirectory`, strain/batch pages, `CatalogContent`, and `FetchState`. |
| X15 | Product delete is reversible and Recently deleted allows restoration. Customer, strain, batch, favorite, alert, and cart removal offer Undo where reversible; expensive/irreversible transitions retain confirmation. Strain/batch restoration recreates an unused deleted record; product restoration preserves the existing record. See the domain ledgers for those contracts. |
| X16 | Updated forms associate labels, inputs, errors, fieldsets, and legends. Product subtype/photos, price mode, availability, inline strain fields, customers, and contact are covered. `StrainForm` uses instance-specific IDs so retained page instances cannot duplicate label targets, and first-error focus is scoped to its own form. |
| X17 | Edited number fields keep a string during entry, use decimal/numeric input modes, accept common currency/percent separators, and parse on validation/blur. Empty values remain editable. Product stock remains whole units with explicit smaller-unit guidance rather than silently rounding fractional stock. See products and order/buyer ledgers. |
| X18 | `useKeyboardShortcuts` no longer navigates away on Escape. `useUnsavedChanges` and `UnsavedChangesDialog` provide a shared asynchronous leave/discard flow. Explicit Cancel handlers await the result; Escape remains appropriate for dismissible dialogs. |
| X19 | `app/providers.tsx` sets 8-second toasts with close controls and top-center placement on phones. `StickyMobileActionBar`, `MobileTabs`, and portal offset CSS reserve bottom-navigation and safe-area space. The 390px product form check measured the save bar above the tabs. |
| X20 | Recent activity is no longer mounted as a floating action. Messages is available from the desktop header host and mobile tab bar; the chat drawer remains mounted to receive open/prefill events. `PortalFloatingActions` no longer overlays the recent-activity control on content. |
| X21 | `DraftAutosaveStatus` renders nothing. Draft persistence remains silent; affected forms offer restoration before applying a saved draft. Persistent save timestamps/device/not-submitted banners were removed. |
| X22 | `app/globals.css` establishes one 2px `#34d9a2` focus-visible outline with offset and suppresses conflicting focus shadows. `Button` no longer adds a competing focus ring. |
| X23 | Auth cards have a visible h1 at all widths; portal pages use one page heading, with h2 for empty/error sections. Portal headers sit outside main, and skip links target `#main-content`. Duplicate order/history page headings were removed. |
| X24 | Reduced-motion CSS resets smooth scrolling; the order-nav scroll helper respects the preference. The landing tour pauses for hover/focus/reduced motion and stays paused after touch. `app/landing/motion.tsx` reads the browser preference with a stable server snapshot, avoiding reduced-motion hydration mismatches while respecting the preference after hydration. |
| X25 | Removed the unused `GuidedFixPanel`, `SetupChecklist`, `RolePrimaryAction`, `app/admin/components/ClientNav.tsx`, `styles/globals.css`, old `OrderStatusTimeline`, and buyer `FilterSidebar`. Shared grower `ClientNav` remains in active use across portals. The obsolete z-index override block was removed. |

## Navigation

| ID | Implementation and evidence |
| --- | --- |
| N1 | `MobileTabs` exposes Overview/Orders/Products/Messages for growers and Catalog/Cart/Orders/Messages for dispensaries, plus labeled More. `MobileNav` supplies the remaining destinations and a labeled Menu control for admin. Cart is a primary buyer tab. |
| N2 | Grower navigation groups Sell (Overview, Orders, Customers, Reports), Products (Products, Strains, Batches), and Account. Catalog/inventory entry points redirect to the combined Products workflow. Sources: `app/grower/layout.tsx`, catalog/inventory routes. |
| N3 | `SearchDialog` names actual role scopes, removes fake actions and duplicate Escape hints, supports keyboard selection, and offers See all products/businesses. `/api/search` adds grower/admin business scopes. On the buyer catalog, header search focuses the actual catalog field rather than opening a second competing search UI. |
| N4 | `NotificationBell` starts mark-read in the background and navigates without waiting for it. The trigger announces unread count; opening moves focus to the panel; Escape closes and restores trigger focus. Load/mark-read failures remain distinct from an empty list. |
| N5 | Grower Orders badges use `pendingRequests`, excluding historical cancellations. Cart badges count lines. Notifications and messages retain their own unread semantics rather than treating unlike counts as interchangeable. Sources: grower layout/attention helper and buyer `CartBadge`. |
| N6 | `PortalBrand` is an overview link and visibly identifies Grower, Dispensary, or Admin. |
| N7 | Search displays Ctrl K off Mac and ⌘ K on Mac. `SaveShortcutHint` appears beside product Save and uses Ctrl+S/⌘S; `useKeyboardShortcuts` performs the shortcut only when appropriate and ignores an open modal. |
| N8 | Grower/buyer sidebars fill the viewport using fixed inset positioning; admin uses a full-height sticky sidebar. Their navigation region scrolls independently and the account section remains at the bottom. |

## Public pages and account access

| ID | Implementation and evidence |
| --- | --- |
| A1 | Sign-up begins with two large unselected role cards. `?type=grower|dispensary` is honored only when valid. Persona/footer signup links carry the role. Generic signup still requires an explicit choice. Sources: sign-up page and landing personas/footer. |
| A2 | A successful verification signs the user in and redirects to the dashboard. **Security adaptation:** a link opened in the original signup browser needs no password; a different browser must choose a new password, replacing the originally chosen one. Mailbox ownership must not activate a password that a third party set while pre-creating the account. Sources: `lib/account-security.ts`, `account-security-api.ts`, `AccountAccessForm`, and link-status API. |
| A3 | Password reset consumes the token atomically, changes the password, revokes prior sessions, and issues the current browser a session before redirecting to the dashboard. Sources: the same account-security helpers. |
| A4 | The old-password verification prompt has been removed. Same-browser verification has no password comparison; cross-browser verification asks for a new password with its own validation. Invalid/expired/used link status is checked separately before entry. The old wrong-password-as-broken-link loop is eliminated by this changed flow. |
| A5 | Credentials authentication distinguishes rate limits from incorrect credentials. Sign-in explains the 15-minute wait and provides recovery navigation. Suspended-account errors are also explicit. Sources: `lib/auth.ts`, sign-in page. |
| A6 | Existing-email signup keeps the generic public response and sends account-access guidance with sign-in/reset links without overwriting the existing account. Check-email includes Sign in and Reset password destinations. Sources: register API and `AccountAccessForm`. |
| A7 | Sign-up validates all missing/invalid fields together, renders field errors, focuses the first problem, and validates ordinary text/email fields on blur. It uses noValidate to avoid disappearing native bubbles. Password and policy errors are associated with their controls. |
| A8 | Landing navigation keeps Sign in visible on phones. Signed-in navigation displays a dashboard destination. |
| A9 | Contact submits to `/api/contact`; the server sends through the configured account-mail provider with the user's address as Reply-To. Only a successful server response shows Message sent. It includes input/body limits, rate limits, and a honeypot. |
| A10 | Protected-route redirects preserve the destination through `signInDestination`/`requestedPage` and terms acceptance. Sign-in permits only a safe same-origin path, blocks auth-screen loops, and explicitly allows the protected `/auth/change-email` destination. Proxy matching preserves that route too. |
| A11 | The landing page passes session state to nav, hero, personas, Getting started, CTA, and footer. Account-action links become dashboard links throughout; auth sign-in/signup layouts redirect active sessions; Help offers the dashboard. Static feature explanations are retained. |
| A12 | Sign-in carries the typed email to Forgot password and reads an incoming email parameter. The unverified-credentials state offers an inline Send a new link action, successful-send cooldown, a clear hour wait on 429, and retryable connection/delivery errors. AccountAccessForm carries the address between verification, reset-request, and sign-in links. |
| A13 | The link-status API checks token shape, purpose, expiry, use, account/email/session version, and suspension before the form asks for entry. Invalid links offer Request a new link. A failed status request offers retry while preserving the token in memory after removing it from the URL fragment. |
| A14 | Verification links last 24 hours; reset links last 2 hours; email-change links remain 30 minutes. Public request caps return an explicit 429 rather than an apparent send. Request forms and inline resend use cooldown feedback. Sources: account-security helpers and account-access pages. |
| A15 | Verification, password-reset, and email-change action emails include branded HTML with a large action link and a copyable fallback, plus a plain-text alternative. `sendAccountMail` supports HTML and preserves provider boundary checks. |
| A16 | Signup/reset no longer require duplicate confirm-password fields. Shared `PasswordField` provides show/hide, remaining-character/minimum-met feedback, and an overlength warning; reset and cross-browser verification reuse it. |
| A17 | Signup explicitly says to add a license after email verification; grower/buyer first-run setup links lead to the license section. The optional-license-at-signup alternative was not added. **User requirement retained:** the product supports multiple states; Vermont recruitment is not a hardcoded eligibility restriction. |
| A18 | Post-signup Check your email displays the saved address, starts a 60-second resend cooldown, and provides Wrong email? Sign up again. The old pointless Use a different email control is removed. |
| A19 | Signed-in change-email returns to the user's role-specific Settings. The protected deep link also survives signing in. |
| A20 | Configuration errors explain that account setup is unfinished, offer support, and provide Sign out to escape a signed-in redirect loop. Source: `app/auth/error/page.tsx`. |
| A21 | Terms acceptance catches a non-JSON response and presents a plain save error with retry, preserving the intended safe destination after success. Source: `app/account/terms/AcceptanceForm.tsx`. |
| A22 | Public landing/footer/contact reading text uses gray-400 or the shared muted/secondary colors in place of low-contrast gray-500/600. Strong borders identify public secondary controls. |
| A23 | The hero's former fake Record Request button is a muted Sample order display, not an apparent action. |
| A24 | Hero markup supplies the complete headline to assistive technology while animated words are hidden from it. The animation helper also has a complete text label. |
| A25 | Sign-in, sign-up, and contact have route-specific metadata/titles. |
| A26 | Landing feature/persona selectors use native buttons grouped and announced with `aria-pressed`, rather than an incomplete ARIA tabs pattern. Native keyboard activation works. The feature grid has explicit shrinking columns; its license/COA samples wrap and its timeline stacks on small phones, preventing the discovered 320px overflow. |
| A27 | Footer Contact opens the contact page; both role columns include Sign in for signed-out visitors; Help is in landing navigation. Signed-in footer action links become dashboard links. |
| A28 | Verification/reset now sign the current browser in automatically, avoiding the old inaccurate signed-out completion message. Email-change completion accurately asks the user to sign in with the new email. |
| A29 | Contact name/email use session prefill and autocomplete. The unnecessary business-type question is removed. |
| A30 | Contact's contradictory Vermont location card is removed. Published legal mailing details are retained. |
| A31 | Help links to actual role-appropriate settings/orders/catalog routes, with sign-in callbacks for signed-out visitors. The support card no longer repeats basic instructions. |
| A32 | `LegalContents` uses an initially collapsed details control below the desktop breakpoint and expands on large screens. The legal text remains accessible after the contents. |
| A33 | Sign-in secondary links and the conditional inline verification resend appear below the primary Sign in button. The permanent Resend verification link is removed. |
| A34 | Auth fields, buttons, show/hide toggles, recovery links, auth brand link, public navigation controls, and footer links have 44px target areas. Focused browser measurement covers visible navigation controls and every rendered footer link at 320px, 390px, 768px, and 1280px. Signed-in navigation has one dashboard action; desktop links wait for the wider breakpoint. |

## Messaging and offers

| ID | Implementation and evidence |
| --- | --- |
| M1 | The quote composer includes a searchable product picker, scoped to the authorized grower/conversation. Opening from an order can pass a product default. Restored quote drafts preserve the selected product identity together with price/quantity, and the send API returns the actual quoted product metadata for immediate rendering. Sources: `ChatDrawer`, `MessagePickers`, `MessageBuyerButton`, message products/send APIs. |
| M2 | Growers can open Send quote directly. Buyer actions are Ask for a price/Make an offer. The nested Create quote step and grower-facing Request pricing action were removed. |
| M3 | Quote/counter controls use readable text, 44px buttons, string entry, and decimal input modes. `ChatDrawer` parses values when the action is submitted. |
| M4 | Buyer Accept & add to cart performs the combined flow. Adding a negotiated quote asks before replacing a conflicting existing cart line rather than silently overwriting its quantity/quote. The accepted quote remains available for later Add to cart if needed. |
| M5 | Decline offers an 8-second Undo window before sending the decline mutation. The UI says it will be declined in 8 seconds; Undo cancels that scheduled mutation. This is a delayed commit within the active app session, not durable server-side restoration of a completed decline. |
| M6 | Accepted grower quotes offer Create order from quote. The manual order route validates and loads the accepted quote and its parties/product before prefilling. See the grower/orders ledger. |
| M7 | Message buyer/Ask to cancel open the chat drawer with the actual draft and focus the composer. They no longer rely on a toast that could imply a cancellation was completed. Sending remains an explicit user action. |
| M8 | The drawer provides New message, a role-scoped contacts picker, conversation search, and header context links to the shop/customer/product. Empty copy names the action available to that role. Contacts and products APIs enforce account ownership/relationship checks. |
| M9 | Opening without an active conversation selects an unread thread first, otherwise the latest. The drawer has one Messages heading with the thread counterpart below it. Polling/draft persistence callbacks are stable while typing. |

## Admin review and account management

| ID | Implementation and evidence |
| --- | --- |
| AD1 | The broken dashboard form-submit branch was removed. Overview links to the functioning unified review queue; `VerificationQueue` submits the structured decision body and uses positive Verify styling. This adapts the suggested inline dashboard fix into a single review workflow. |
| AD2 | Dashboard counts, combined directory SQL, and review detail exclude `isOffPlatform` dispensaries. Grower-managed phone customers do not enter the license review queue. |
| AD3 | Request changes collects a reason and optional note, saves rejected/notes for either role, and notifies the account owner. Revised notes on an already-declined record are saved. Opening a different business resets the note/reason appropriately. |
| AD4 | `/admin/review/[kind]/[id]` displays license number/state/expiry, business/contact/address, email ownership, telephone, submission date, and prior review notes. It links directly to supported state registries (VT/NJ); other states retain an instruction to check the issuing regulator, without blocking those accounts. Verify/Request changes are available in the same view. |
| AD5 | User cards show email verification/account pause state and provide password reset, resend verification, pause/resume, and sign out everywhere. The API requires admin auth, validates origin/body/action, rate-limits requests, protects admin/self suspension/signout, and increments session version for revocation. Email actions request delivery through the existing mail service. |
| AD6 | One combined Review queue defaults to Pending and sorts oldest submissions first. Eligible records have one-click Verify and Undo; selected eligible rows can be approved together. Partial bulk failures report the saved count. Navigation shows the pending queue count. |
| AD7 | Business review and users use responsive cards/wrapping actions instead of a wide table with actions off-screen. The duplicate Ordering column is gone; admin and other portals use the shared tablet/mobile breakpoint. |
| AD8 | `DirectoryFilters` provides immediate status chips and debounced search, updates URL state, and resets pagination by creating the new filtered URL. No extra Search click is required for status changes. |
| AD9 | Verify is offered only with a license number, state, future/current expiry, and an unapproved account. Expired and missing-license text is visible. Request changes defaults to Expired license for expired records. The server independently rechecks eligibility. |
| AD10 | Profile license changes retain `previousLicenseNumber`, record `licenseSubmittedAt`, return to pending review, and notify admins. Queue/detail display License changed: old → new when the number changed; submission time distinguishes a re-review. |
| AD11 | `notifyAdmins` creates notifications for new signup and changed licenses. `/api/search` supports admin business, email, contact, and license searches, exposed through the shared header search. |
| AD12 | Business status is derived once: Approved — can order/listings live, Waiting for review, Changes needed, or Expired. There is no separate conflicting Ordering column. |
| AD13 | Directory copy matches business/contact/email/license search. Users searches person name, email, and linked business name; the input describes those scopes. |
| AD14 | Empty directory states use Copy sign-up link, including a role parameter for a role-specific list. They no longer send a signed-in admin into their own signup flow. |
| AD15 | Seed UI is removed from admin pages. The retained seed API requires `ENABLE_DEMO_SEED=true`, a localhost database host, and a non-production runtime/Vercel environment; preview detection alone cannot enable it. |
| AD16 | Verification uses a concurrency key over license fields **and current review decision/notes**, so unrelated profile edits do not cause an approval conflict while stale decisions cannot overwrite newer reviews. Undo additionally checks the saved update timestamp. Database row locks serialize decisions. |
| AD17 | The combined grower/dispensary queue orders by license submission (created date fallback), then ID, **before** database pagination. Sorting is not restricted to each loaded page. |
| AD18 | Directory status/filter checks use `startOfLicenseDay`/`isLicenseExpired` from `lib/license.ts`, the same calendar-day cutoff used by the expiry badge helper. Date-only expiry presentation preserves the license date. |
| AD19 | Linked `StatCard` entries retain supplied icons. Admin's header settings control is labeled System settings. The dead developer-tools destination was removed from Overview. |
| AD20 | System settings uses a positive ready state when configured and warning styling only when a service needs setup. It shows simple configured/setup statuses and a support link instead of environment-variable/deployment instructions. This is configuration presence, not a live provider health assertion. |

## Section 4 cleanup accounting

| Audit cleanup group | Result in this scope |
| --- | --- |
| Repeated settlement disclaimers | Removed repetitive direct-payment text from chat, Help, and admin settings. The buyer review and grower order detail retain the appropriate single explanation; order/statement/export/billing cleanup is recorded in the domain ledgers. |
| Repeated landing review/sample notes | Removed redundant hero/feature-tour eligibility disclaimers; Getting started/FAQ explain review. The hero has one Sample data tag, and its non-actionable Sample order label makes the demo clear without a fake button. Example business names remain illustrative data rather than repeated disclaimer paragraphs. |
| Admin confirm dialogs | Verify is one click with Undo; Request changes collects actionable feedback. High-impact account suspension still requires confirmation because it ends access. |
| Native unsaved confirms | Shared asynchronous unsaved-changes dialog replaces native confirmation; full-page Escape navigation is removed. |
| Floating recent activity | The floating button/drawer is no longer mounted. It cannot cover page controls. The unused legacy component file is not imported by any app surface. |
| Redundant auth steps | Removed duplicate confirm-password inputs, desktop marketing side panels, duplicate sign-in prompts, field asterisks, Use a different email, the permanent verification-resend link, old-password verification instructions, and hedged email-delivery copy. |
| Admin dashboard/settings clutter | Removed the Operations checklist, repeated support-email card/static policy blocks, developer seed section/link, duplicate Ordering column, and repeating page subtitles. Overview provides the review queue; settings describes configured services in plain language. |
| Search dialog clutter | Fake Saved/Message/Follow up actions and duplicate Escape hints are removed. Search results open their real destination; See all retains the query. |
| Chat helper clutter | Removed purpose chips, obsolete Message ready toast, and verbose accepted-quote explanation. Empty messaging state retains only useful role-specific guidance. Accepted quotes have a clear next action. |
| Loading/empty/save noise | Shared loading text defaults to Loading with no Please wait paragraph. Draft saving is silent. Shared empty/error states use short headings and actions. Product/catalog/report-specific removals are in their ledgers. |
| Public/contact/help clutter | Removed contact introduction/routing note/location card and repetitive Help support instructions. Help links to the relevant screen. Existing policy content and published address are preserved. |
| Dead shared/UI files | All seven files enumerated by X25 and the obsolete z-index block are removed; active shared `ClientNav` and the adopted setup implementation remain. |
| Product/order/buyer-only cleanup | Catalog/update-stock hubs, duplicate dashboard lists/stats, status radios, quick-add/display/selection bars, cart fake tabs/templates, redundant View links, and their helpers are accounted for in [products](products.md), [grower/orders](grower-orders.md), and [buyer](buyer.md). |

## Validation and boundaries

- Source mapping covers every assigned ID. The table describes actual implementation or calls out an adaptation; it does not imply that each row has a separate automated test.
- The integration agent reported the expanded shared account/admin/messaging suite passed **11/11** on the clean server in 54.1 seconds, and aggregate `npm run verify` passed lint/build. Its final release results belong in the integration summary.
- `tests/ux-public-followup-20260929.spec.ts` covers inline resend/offline/delivery/throttle recovery, email handoff, shared live password feedback, signed-in landing actions, 44px navigation/footer targets at 320px/390px/768px/1280px, reduced-motion hydration, each actual feature vignette, and safe callback destinations. Four checks passed on the clean server; the landing check passed after the discovered 320px layout correction.
- Focused lint passed on the public/account follow-up files and test. Local screenshots are under `/tmp/phenoshop-ux-20260929/public-followup-screens`.
- These checks use the isolated local `phenofarm_auth_ux_20260929` database, app port 3187, and local mail sink on 3188. They do not deliver real external email or establish production configuration behavior.
- No production migration, deployment, alias update, commit, or push is claimed by this ledger.

The earlier inline-resend/admin-action 400 responses occurred in the previous development-server session and did not reproduce after a clean restart. The clean server passed the real browser resend with the existing origin/body protection intact; no CSRF rule was loosened. All five public follow-up checks passed across the clean run and the affected landing rerun. The final landing check passed in 48.4 seconds after requiring each selected vignette to mount and finish its incoming animation before measuring. The final product rerun passed 10/10 in 13.9 seconds after instance-specific strain field IDs and visible-role test selectors.
