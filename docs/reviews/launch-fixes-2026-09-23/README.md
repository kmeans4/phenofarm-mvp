# Launch workflow fixes — September 23, 2026

Scope: the six defects confirmed by the production workflow audit in the adjacent `production-workflows-2026-09-23` folder.

## Implementation and local verification

1. **Account email availability:** installed Resend on its free plan, verified `phenoshop.app` with DKIM and SPF/MX records at Porkbun, configured `PhenoFarm <accounts@phenoshop.app>`, and received both provider delivery confirmation and the user's explicit Yahoo inbox confirmation. The existing account flow passed all 17 recovery tests, including fresh signup, ownership verification, expired/replayed links, concurrent resets, session revocation, and 360/1440px UI journeys. Production activation and live account checks are recorded below when completed. Website routing remains on the existing production Vercel domain.
2. **Grower profile save:** include the protected login email in the save payload, outside the editable draft. Real sign-in, save, reload, and rejected email substitution passed at 390/1440px. Approval remained intact.
3. **Duplicate request retries:** persist a buyer-scoped request key and original payload before sending. A database receipt commits with each grower's order, inventory, quote consumption, history, and notification. Repeated and concurrent requests return that receipt. The browser offers a compact recovery screen after a lost response, including after reload and sellout. Partial successes and injected storage failures recover without repeating successful orders. Altered payloads cannot reuse a key; separate buyers and deliberate new requests remain independent. Existing quote-price and partial-checkout regressions passed.
4. **Missing settlement notes:** preserve every free-text line after the structured request header and show the complete text to both parties. Actual edit/save/reload checks passed for delivered orders at 390/1440px, preserving terms, status, and totals.
5. **Misleading/incomplete CSV:** export fulfillment, requested window, payment terms, and full notes. Settlement wording explicitly states that payment status is not tracked. Downloaded files for both roles passed at 390/1440px, including commas, quotes, multiline text, pending status, and spreadsheet formula protection.
6. **Approval toggling:** use explicit approve/remove decisions with profile timestamps and a transaction lock. Replays are no-ops; stale decisions fail instead of approving changed licenses. Buyer license gates stay synchronized, expired licenses cannot be approved, and only admins can act. Both roles passed lost-response and repeated-action checks at 390/1440px, including deliberate removal and stale reapproval. Approval confirmations use the normal green action; removal retains destructive styling.

`npm run verify` passed (environment documentation, lint, Prisma generation, optimized production build). Focused tests are in `tests/launch-workflow-fixes.spec.ts`; existing recovery, checkout/quote, and admin regression coverage was also used. Tests ran against localhost:3150 and the isolated local `phenofarm_auth_launch_20260923` database, never the ordinary development database or production.

Screenshots in this folder cover saved profiles, request recovery, complete notes, export menus, and approval dialogs/results. The initial audit folder documents the defects before these fixes.

## Database and release

- Production project: `phenofarm-mvp` / `prj_9pLewagwNf3uOA2sle3r0O3RlQkv`.
- Production URL: https://phenofarm-mvp.vercel.app
- Recovery branch: `br-spring-salad-aij8mwv0`, `pre-workflow-fixes-20260923`, from production `br-wandering-snow-aig9frhe`. Ready, without a compute endpoint.
- All 22 previously applied migrations matched checked-in checksums. The only pending migration was `20260923020000_order_request_submissions`.
- That additive migration was tested locally and applied successfully to production. It creates one receipt table and its buyer ownership constraint; existing data is unchanged. Previous application code can run with the extra table if rollback is necessary. Preserve receipt data when rolling back.
- Production mail settings are configured for the next release. `AUTH_REQUIRE_EMAIL_VERIFICATION=true` deliberately requires existing unverified users to confirm their email before signing in; no account is marked verified without proof. Verification and password reset remain available to those users.
- Initial production release: `dpl_6jEXQVdWfwGYkQyZf7FNLJEGvUN2`, Ready and aliased to the production URL. Live signup, verification, reset, profile saves, approval replay, quote creation/acceptance, response-loss recovery, concurrent receipt replay, fulfillment, settlement notes, and both CSV exports passed.
- Live boundary checks passed: a second buyer cannot access the original order or its receipt; two concurrent requests against three available units yielded one success and one conflict; repeated cancellation restored stock once; stale approval could not undo an intentional revocation.
- Real-user verification and reset emails were accepted by the live app. The user's initial sender test was confirmed in the Yahoo inbox. The user's own password is never changed by this audit. Synthetic signup/reset messages use Resend's documented labeled test recipients, with links retrieved privately from the sending provider; these checks are distinct from real inbox placement.
- A live mobile visual check found an existing grid sizing issue with long grower names that could clip the request date. Explicit responsive grid columns and wrapping fix it. The added 390/1440px regression checks passed and the full verification command passed again after that change.
- Final release and fixture cleanup: pending at this checkpoint.

No secrets, passwords, reset links, or session cookies are included in the evidence. All synthetic production accounts must be removed after final checks; the real user's account/password must remain unchanged except for an ownership verification they choose to perform.
