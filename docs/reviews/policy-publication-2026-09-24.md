# Policy publication — September 24, 2026

## Scope

Replace the three pre-launch policy pages with the prepared launch package, using the owner's confirmed operator name, PhenoShop, and authorized mailing address. PhenoFarm remains the app name. Vermont is the initial recruiting focus, not an exclusive eligibility rule. No state gate, authentication, billing, database, or marketplace behavior changed.

The Terms cover licensed adult business users, lab-report responsibility, prohibited interstate transfers, direct wholesale settlement, optional software subscriptions, account closure, and liability. Privacy disclosures describe actual providers, public file URLs, manual rights requests, retention limits, and account security. The Cookie Notice describes essential cookies and persistent browser drafts. Public copy does not promise automatic deletion, private Blob objects, payment-provider approval, or nationwide regulatory authorization.

## Verification

- `npm run verify`: environment documentation, ESLint, TypeScript, and production build passed.
- Local production build at `http://127.0.0.1:3152`: all three policies returned 200 at 1440, 390, and 320 pixels (nine checks).
- Correct effective date and operator contact details; no draft banners, unresolved placeholders, broken section anchors, horizontal overflow, or browser runtime errors.
- Policy navigation worked by actual clicks. Signup retained working Terms and Privacy links.
- Inspected desktop/mobile screenshots, including narrow contact text. Header typography scales for mobile; full body copy remains readable.
- React review: static server components, no added dependencies, client state, effects, database queries, or secrets; semantic headings, address, focus styles, and current-page navigation retained.
- Evidence: `/tmp/phenoshop-policies-20260924/` (local checks and screenshots).

## Operational boundaries

Publication is not attorney approval. State-specific cannabis requirements and payment-provider eligibility remain separate. The manual privacy-request procedure is retained in `docs/legal/launch-policies-2026-09-24.md`; it must be followed when requests arrive. Dedicated versioned policy-acceptance records are not implemented by this publication.

The pre-existing untracked `docs/reviews/final-production-2026-09-24/` directory is unrelated and excluded from this commit and release.

## Production result

- Application source commit `161939195c4c5850645200ec8400f5bd16057294` was pushed to `origin/main`.
- Deployed from an archive of that commit (no local env files or untracked review files) to Vercel deployment `dpl_4pxwjwN1Y92Jh9ifwPkoqd1LX7fM`, `phenofarm-lk9j6vdxt-kevin-means-projects.vercel.app`.
- Canonical `https://phenoshop.app` resolved to that Ready deployment.
- Repeated all nine browser page/viewport checks on the canonical production site: all passed, no overflow, broken anchors, or runtime errors. Actual cross-policy clicks and signup Terms/Privacy links passed. Live mobile screenshot was also inspected.
- No migrations, database writes, auth setting changes, provider purchases, or transactional messages were performed.
