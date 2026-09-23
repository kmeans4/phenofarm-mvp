# Public and admin UI remediation

Owner: public/admin. Current entries: 38.

Evidence is under `docs/reviews/ui-2026-09-17/remediation/public-admin/`.

Five admin follow-ups remain before closure: A01 heading size, A05 singular count grammar, A07 alert icon alignment, A21 mobile badge width, and A23 setup priority/collapsed policy reference. A06/A09 include root-owned shared component dependencies.

## PUB-003 — Mobile hero repeats settlement promise

**Status:** completed

Shortened the hero support paragraph while retaining verification, tracking, and direct-settlement meaning.

**Files:** app/landing/hero.tsx

**Evidence:** remediation/public-admin/public-home-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-004 — Help intro repeats page purpose

**Status:** completed

Removed the duplicate help eyebrow and kept one Marketplace help heading with a concise topic summary.

**Files:** app/help/page.tsx

**Evidence:** remediation/public-admin/public-help-desktop.png, remediation/public-admin/public-help-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-005 — Mobile contact form starts below long preamble

**Status:** completed

Shortened the contact heading and tightened the lead information card spacing so the form begins sooner.

**Files:** app/contact/page.tsx

**Evidence:** remediation/public-admin/public-contact-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-006 — Contact helper copy is longer than needed

**Status:** completed

Shortened the form helper copy without changing fields or the email-draft action.

**Files:** app/contact/page.tsx

**Evidence:** remediation/public-admin/public-contact-desktop.png, remediation/public-admin/public-contact-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-007 — Privacy draft status is duplicated

**Status:** completed

Removed the duplicate body draft-status card; the concise hero warning remains.

**Files:** app/legal/privacy/page.tsx

**Evidence:** remediation/public-admin/public-privacy-desktop.png, remediation/public-admin/public-privacy-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-008 — Terms draft status is duplicated

**Status:** completed

Removed the duplicate body draft-status card; substantive terms begin after Contents.

**Files:** app/legal/terms/page.tsx

**Evidence:** remediation/public-admin/public-terms-desktop.png, remediation/public-admin/public-terms-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-009 — Cookie draft status is duplicated

**Status:** completed

Removed the duplicate body draft-status card and preserved the hero counsel-review warning.

**Files:** app/legal/cookies/page.tsx

**Evidence:** remediation/public-admin/public-cookies-desktop.png, remediation/public-admin/public-cookies-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-010 — Cookie section heading is wordy

**Status:** completed

Renamed the section to Cookies and storage.

**Files:** app/legal/cookies/page.tsx

**Evidence:** remediation/public-admin/public-cookies-desktop.png, remediation/public-admin/public-cookies-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-011 — Sign-in marketing panel is overlong

**Status:** completed

Shortened the desktop marketing headline and support paragraph while keeping the mobile form layout.

**Files:** app/auth/sign_in/page.tsx

**Evidence:** remediation/public-admin/public-sign-in-desktop.png, remediation/public-admin/public-sign-in-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-012 — Sign-up marketing panel repeats form promise

**Status:** completed

Shortened the desktop marketing headline and focused the supporting sentence on grower and dispensary workflows.

**Files:** app/auth/sign_up/page.tsx

**Evidence:** remediation/public-admin/public-sign-up-desktop.png, remediation/public-admin/public-sign-up-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-013 — Mobile sign-up disclosure wraps awkwardly

**Status:** completed

Shortened the legal disclosure and retained both Terms and Privacy Policy links inline.

**Files:** app/auth/sign_up/page.tsx

**Evidence:** remediation/public-admin/public-sign-up-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-014 — Configuration error repeats marketing copy

**Status:** completed

Replaced the shared desktop error marketing panel with concise access-recovery copy.

**Files:** app/auth/error/page.tsx

**Evidence:** remediation/public-admin/public-error-configuration-desktop.png, remediation/public-admin/public-error-configuration-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-015 — Credentials error repeats marketing copy

**Status:** completed

Applied the same concise shared access-recovery panel while preserving the credential-specific error card.

**Files:** app/auth/error/page.tsx

**Evidence:** remediation/public-admin/public-error-credentials-desktop.png, remediation/public-admin/public-error-credentials-mobile.png

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-016 — Testimonial-to-pricing transition has excess vertical space

**Status:** completed

Reduced pricing section top padding to shorten the settled testimonial-to-pricing transition.

**Files:** app/landing/pricing.tsx

**Evidence:** remediation/public-admin/public-home-settled-desktop-y04200.png, remediation/public-admin/public-home-settled-mobile-y05664.png

**Checks:** Fresh settled scroll captures at 1440x1000 and 390x844 inspected; all reveal-on-scroll content rendered.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## PUB-017 — Mobile footer repeats Privacy and Terms links

**Status:** completed

Removed duplicate policy links from the Company group and kept one compact bottom legal row.

**Files:** app/landing/footer.tsx

**Evidence:** remediation/public-admin/public-home-settled-mobile-footer.png, remediation/public-admin/public-home-settled-desktop-y06720.png

**Checks:** Fresh settled footer capture inspected at 390x844; footer text has one Privacy/Terms/Cookies row.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A01 — Shorten admin headings and introductions

**Status:** follow-up

Page titles and descriptions are concise; mobile heading size remains the unresolved visual follow-up.

**Files:** app/admin/users/page.tsx, app/admin/growers/page.tsx, app/admin/dispensaries/page.tsx, app/admin/settings/page.tsx, app/admin/dashboard/page.tsx

**Evidence:** remediation/public-admin/admin-users-desktop.png, remediation/public-admin/admin-users-mobile.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Follow-up: reduce the admin mobile heading to the requested 26–28px range and recapture.

## A02 — Standardize business-role names

**Status:** completed

Admin navigation, headings, actions, and seed results consistently use Growers and Dispensaries.

**Files:** app/admin/layout.tsx, app/admin/dashboard/page.tsx, app/admin/components/SeedDataButton.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A03 — Search placeholders clip on desktop

**Status:** completed

Directory placeholders now use concise Email or business / Business or license copy.

**Files:** app/admin/users/page.tsx, app/admin/components/AdminVerificationFilters.tsx

**Evidence:** remediation/public-admin/admin-users-desktop.png, remediation/public-admin/admin-growers-desktop.png, remediation/public-admin/admin-dispensaries-desktop.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A04 — Mobile directory controls consume too many rows

**Status:** completed

Directory search and Search stay together, with status and Clear grouped on the compact second row.

**Files:** app/admin/components/AdminVerificationFilters.tsx

**Evidence:** remediation/public-admin/admin-growers-mobile.png, remediation/public-admin/admin-dispensaries-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A05 — Simplify directory result counts

**Status:** follow-up

Unfiltered counts are concise, but singular grammar needs correction for one record (1 growers / equivalent).

**Files:** app/admin/users/page.tsx, app/admin/growers/page.tsx, app/admin/dispensaries/page.tsx

**Evidence:** remediation/public-admin/admin-growers-desktop.png, remediation/public-admin/admin-dispensaries-desktop.png, remediation/public-admin/admin-users-desktop.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Follow-up: pluralize result labels conditionally for one record.

## A06 — Reduce navigation grouping and empty notification controls

**Status:** completed-with-dependency

Admin nav call site is preserved for root’s simplified five-item navigation and empty notification-control treatment.

**Files:** app/admin/layout.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Root shared ClientNav and NotificationBell changes are the dependency.

## A07 — Make confirmation wording specific

**Status:** follow-up

Unverify dialog title and button are specific; the alert icon alignment still needs correction when text wraps.

**Files:** app/admin/components/ConfirmActionButton.tsx, app/admin/dispensaries/page.tsx

**Evidence:** remediation/public-admin/admin-unverify-dialog-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Follow-up: keep alert icon square/top-aligned in ConfirmDialog and recapture.

## A08 — Compact mobile metric cards

**Status:** completed

Dashboard metric cards use compact padding, counts, and short verified/pending helpers.

**Files:** app/admin/dashboard/page.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A09 — Collapse completed checklist items

**Status:** completed-with-dependency

Dashboard shows pending checklist work and collapses completed checks behind a single summary disclosure.

**Files:** app/admin/dashboard/page.tsx, app/components/ux/SetupChecklist.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Shared SetupChecklist treatment remains root-owned.

## A10 — Shrink the clear verification queue

**Status:** completed

An empty queue is rendered as one concise status row with destination links; work expands only when pending records exist.

**Files:** app/admin/dashboard/page.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A11 — Move standing business-model explanation

**Status:** completed

Dashboard keeps a compact settlement policy sentence and help link.

**Files:** app/admin/dashboard/page.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A12 — Simplify development-only seeding panel

**Status:** completed

Dev-only seed tools are behind one collapsed Developer tools row with one action; production guard remains.

**Files:** app/admin/dashboard/page.tsx, app/admin/components/SeedDataButton.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A13 — Make dashboard counts match destinations

**Status:** completed

Dashboard dispensary counts and pending counts use the same platform-account scope as the directory; grower query remains schema-valid.

**Files:** app/admin/dashboard/page.tsx

**Evidence:** remediation/public-admin/admin-dashboard-desktop.png, remediation/public-admin/admin-dashboard-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A14 — Tighten sparse mobile account rows

**Status:** completed

Mobile user rows are compact and omit inapplicable business and verification fields for administrators.

**Files:** app/admin/users/page.tsx

**Evidence:** remediation/public-admin/admin-users-mobile.png, remediation/public-admin/admin-users-desktop.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A15 — Use compact verification metadata

**Status:** completed

Grower mobile cards place plan beside verification and tighten metadata while retaining license exceptions.

**Files:** app/admin/growers/page.tsx

**Evidence:** remediation/public-admin/admin-growers-mobile.png, remediation/public-admin/admin-growers-desktop.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A16 — Remove repeated ordering-policy copy

**Status:** completed

Dispensary rows use compact Can order / License review states and keep settlement guidance outside each row.

**Files:** app/admin/dispensaries/page.tsx

**Evidence:** remediation/public-admin/admin-dispensaries-mobile.png, remediation/public-admin/admin-dispensaries-desktop.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A17 — Give business and license identifiers enough room

**Status:** completed

Normal expiry dates are plain dates, identifier cells are nowrap, and exception dates retain badges.

**Files:** app/admin/components/LicenseExpiryBadge.tsx, app/admin/dispensaries/page.tsx

**Evidence:** remediation/public-admin/admin-dispensaries-desktop.png, remediation/public-admin/admin-dispensaries-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A18 — Delay wide table/header layout at tablet widths

**Status:** completed

Admin directory header stacks from tablet widths and the horizontally scrollable table has a visible action hint.

**Files:** app/admin/growers/page.tsx, app/admin/dispensaries/page.tsx

**Evidence:** remediation/public-admin/admin-dispensaries-tablet.png

**Checks:** Fresh authenticated 1024x1000 render inspected; header is stacked and scroll hint is visible.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A19 — Remove implementation commentary and obvious labels

**Status:** completed

Settings copy now focuses on billing, support, and policy state without implementation history or platform identity.

**Files:** app/admin/settings/page.tsx

**Evidence:** remediation/public-admin/admin-settings-desktop.png, remediation/public-admin/admin-settings-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A20 — Stop stretching the short support card

**Status:** completed

Settings grid aligns cards to content height so Support does not stretch to billing height.

**Files:** app/admin/settings/page.tsx

**Evidence:** remediation/public-admin/admin-settings-desktop.png, remediation/public-admin/admin-settings-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A21 — Use one compact status per billing item

**Status:** follow-up

Billing rows use one status badge and no duplicate value, but mobile badge width still needs visual confirmation/fix.

**Files:** app/admin/settings/page.tsx

**Evidence:** remediation/public-admin/admin-settings-mobile.png, remediation/public-admin/admin-settings-desktop.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Follow-up: make badges fit content on mobile and recapture after the pending correction.

## A22 — Consolidate setup and settlement guidance

**Status:** completed

Settings retains one setup instruction and one settlement policy; repeated bottom guidance was removed.

**Files:** app/admin/settings/page.tsx

**Evidence:** remediation/public-admin/admin-settings-desktop.png, remediation/public-admin/admin-settings-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

## A23 — Prioritize setup issues and flatten policy cards

**Status:** follow-up

Billing is first and policy cards are flattened into rows, but missing configuration is not yet visually prioritized/collapsed as requested.

**Files:** app/admin/settings/page.tsx

**Evidence:** remediation/public-admin/admin-settings-desktop.png, remediation/public-admin/admin-settings-mobile.png

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Follow-up: move missing setup state to the top and collapse reference policies.
