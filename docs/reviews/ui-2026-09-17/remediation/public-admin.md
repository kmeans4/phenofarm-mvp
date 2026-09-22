# Public and admin UI fixes

All 38 findings are fixed and reviewed locally. METRC work was excluded.

## PUB-003 — Mobile hero repeats settlement promise

Shortened the hero support paragraph while retaining verification, tracking, and direct-settlement meaning.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Landing hydration rechecked with both reduced and normal motion at 1440/390px; all four checks passed.

**Evidence:** [View 1](public-admin/public-home-mobile.png) · [View 2](root/home-final-reduce-390.png) · [View 3](root/home-final-no-preference-1440.png)

## PUB-004 — Help intro repeats page purpose

Removed the duplicate help eyebrow and kept one Marketplace help heading with a concise topic summary.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-help-desktop.png) · [View 2](public-admin/public-help-mobile.png)

## PUB-005 — Mobile contact form starts below long preamble

Shortened the contact heading and tightened the lead information card spacing so the form begins sooner.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-contact-mobile.png)

## PUB-006 — Contact helper copy is longer than needed

Shortened the form helper copy without changing fields or the email-draft action.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-contact-desktop.png) · [View 2](public-admin/public-contact-mobile.png)

## PUB-007 — Privacy draft status is duplicated

Removed the duplicate body draft-status card; the concise hero warning remains.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-privacy-desktop.png) · [View 2](public-admin/public-privacy-mobile.png)

## PUB-008 — Terms draft status is duplicated

Removed the duplicate body draft-status card; substantive terms begin after Contents.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-terms-desktop.png) · [View 2](public-admin/public-terms-mobile.png)

## PUB-009 — Cookie draft status is duplicated

Removed the duplicate body draft-status card and preserved the hero counsel-review warning.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-cookies-desktop.png) · [View 2](public-admin/public-cookies-mobile.png)

## PUB-010 — Cookie section heading is wordy

Renamed the section to Cookies and storage.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-cookies-desktop.png) · [View 2](public-admin/public-cookies-mobile.png)

## PUB-011 — Sign-in marketing panel is overlong

Shortened the desktop marketing headline and support paragraph while keeping the mobile form layout.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-sign-in-desktop.png) · [View 2](public-admin/public-sign-in-mobile.png)

## PUB-012 — Sign-up marketing panel repeats form promise

Shortened the desktop marketing headline and focused the supporting sentence on grower and dispensary workflows.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-sign-up-desktop.png) · [View 2](public-admin/public-sign-up-mobile.png)

## PUB-013 — Mobile sign-up disclosure wraps awkwardly

Shortened the legal disclosure and retained both Terms and Privacy Policy links inline.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-sign-up-mobile.png)

## PUB-014 — Configuration error repeats marketing copy

Replaced the shared desktop error marketing panel with concise access-recovery copy.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-error-configuration-desktop.png) · [View 2](public-admin/public-error-configuration-mobile.png)

## PUB-015 — Credentials error repeats marketing copy

Applied the same concise shared access-recovery panel while preserving the credential-specific error card.

**Status:** Fixed and verified.

**Checks:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-error-credentials-desktop.png) · [View 2](public-admin/public-error-credentials-mobile.png)

## PUB-016 — Testimonial-to-pricing transition has excess vertical space

Reduced pricing section top padding to shorten the settled testimonial-to-pricing transition.

**Status:** Fixed and verified.

**Checks:** Fresh settled scroll captures at 1440x1000 and 390x844 inspected; all reveal-on-scroll content rendered.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-home-settled-desktop-y04200.png) · [View 2](public-admin/public-home-settled-mobile-y05664.png)

## PUB-017 — Mobile footer repeats Privacy and Terms links

Removed duplicate policy links from the Company group and kept one compact bottom legal row.

**Status:** Fixed and verified.

**Checks:** Fresh settled footer capture inspected at 390x844; footer text has one Privacy/Terms/Cookies row.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/public-home-settled-mobile-footer.png) · [View 2](public-admin/public-home-settled-desktop-y06720.png)

## A01 — Shorten admin headings and introductions

Concise admin titles use 28px mobile headings and 36px desktop headings.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/_admin_users-390.png) · [View 2](root/_admin_growers-390.png) · [View 3](root/_admin_settings-390.png)

## A02 — Standardize business-role names

Admin navigation, headings, actions, and seed results consistently use Growers and Dispensaries.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-dashboard-desktop.png) · [View 2](public-admin/admin-dashboard-mobile.png)

## A03 — Search placeholders clip on desktop

Directory placeholders now use concise Email or business / Business or license copy.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-users-desktop.png) · [View 2](public-admin/admin-growers-desktop.png) · [View 3](public-admin/admin-dispensaries-desktop.png)

## A04 — Mobile directory controls consume too many rows

Directory search and Search share one row; status/counts sit together below, with full usable controls.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/_admin_growers-390.png) · [View 2](root/_admin_users-390.png)

## A05 — Simplify directory result counts

Unfiltered counts use correct singular/plural; filtered counts keep the true matching total across pages.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/_admin_growers-390.png) · [View 2](root/_admin_users-390.png)

## A06 — Reduce navigation grouping and empty notification controls

The five-item admin menu omits category labels, and empty notifications omit unread/actions.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/_admin_settings-1440.png)

## A07 — Make confirmation wording specific

Verification confirmations name the action and preserve a square, top-aligned icon. Dialogs portal above navigation, focus Cancel initially and close with Escape.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/admin-confirm-1440.png) · [View 2](root/admin-confirm-390.png) · [View 3](root/admin-confirm-360.png)

## A08 — Compact mobile metric cards

Three compact mobile count cards share one row. Nonessential arrows hide on mobile; 12px labels and full-card links remain readable.

**Status:** Fixed and verified.

**Checks:** Final 1440/390/360px screenshots inspected; three metric cards stay on one row.; Shared compact card uses mutually exclusive display/padding classes.; Lint/build passed.

**Evidence:** [View 1](root/_admin_dashboard-1440.png) · [View 2](root/_admin_dashboard-390.png) · [View 3](root/_admin_dashboard-360.png)

## A09 — Collapse completed checklist items

Dashboard shows pending checklist work and collapses completed checks behind a single summary disclosure.

**Status:** Fixed and verified.

**Checks:** Final dashboard screenshot inspected; pending work is visible and three completed checks are collapsed.; Lint/build passed.

**Evidence:** [View 1](final-pages/_admin_dashboard-1440.png) · [View 2](final-pages/_admin_dashboard-390.png)

## A10 — Shrink the clear verification queue

The clear verification queue uses one short status and directory links, without the repeated queue heading.

**Status:** Fixed and verified.

**Checks:** Final 1440/390/360px screenshots inspected; three metric cards stay on one row.; Shared compact card uses mutually exclusive display/padding classes.; Lint/build passed.

**Evidence:** [View 1](root/_admin_dashboard-1440.png) · [View 2](root/_admin_dashboard-390.png) · [View 3](root/_admin_dashboard-360.png)

## A11 — Move standing business-model explanation

The standing settlement explanation is replaced by one Settlement & billing policy link.

**Status:** Fixed and verified.

**Checks:** Final 1440/390/360px screenshots inspected; three metric cards stay on one row.; Shared compact card uses mutually exclusive display/padding classes.; Lint/build passed.

**Evidence:** [View 1](root/_admin_dashboard-1440.png) · [View 2](root/_admin_dashboard-390.png) · [View 3](root/_admin_dashboard-360.png)

## A12 — Simplify development-only seeding panel

Dev-only seed tools are behind one collapsed Developer tools row with one action; production guard remains.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-dashboard-desktop.png) · [View 2](public-admin/admin-dashboard-mobile.png)

## A13 — Make dashboard counts match destinations

Dashboard dispensary counts and pending counts use the same platform-account scope as the directory; grower query remains schema-valid.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-dashboard-desktop.png) · [View 2](public-admin/admin-dashboard-mobile.png)

## A14 — Tighten sparse mobile account rows

Mobile user rows are compact and omit inapplicable business and verification fields for administrators.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-users-mobile.png) · [View 2](public-admin/admin-users-desktop.png)

## A15 — Use compact verification metadata

Grower mobile cards place plan beside verification and tighten metadata while retaining license exceptions.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-growers-mobile.png) · [View 2](public-admin/admin-growers-desktop.png)

## A16 — Remove repeated ordering-policy copy

Dispensary rows use compact Can order / License review states and keep settlement guidance outside each row.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-dispensaries-mobile.png) · [View 2](public-admin/admin-dispensaries-desktop.png)

## A17 — Give business and license identifiers enough room

Normal expiry dates are plain dates, identifier cells are nowrap, and exception dates retain badges.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-dispensaries-desktop.png) · [View 2](public-admin/admin-dispensaries-mobile.png)

## A18 — Delay wide table/header layout at tablet widths

Business directories switch to cards below 1280px; tablet controls stack without clipping.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/_admin_growers-390.png) · [View 2](root/_admin_growers-1440.png)

## A19 — Remove implementation commentary and obvious labels

Settings copy now focuses on billing, support, and policy state without implementation history or platform identity.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-settings-desktop.png) · [View 2](public-admin/admin-settings-mobile.png)

## A20 — Stop stretching the short support card

Settings grid aligns cards to content height so Support does not stretch to billing height.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-settings-desktop.png) · [View 2](public-admin/admin-settings-mobile.png)

## A21 — Use one compact status per billing item

One fit-content billing status sits beside each label at all widths.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/_admin_settings-390.png) · [View 2](root/_admin_settings-1440.png)

## A22 — Consolidate setup and settlement guidance

Settings retains one setup instruction and one settlement policy; repeated bottom guidance was removed.

**Status:** Fixed and verified.

**Checks:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [View 1](public-admin/admin-settings-desktop.png) · [View 2](public-admin/admin-settings-mobile.png)

## A23 — Prioritize setup issues and flatten policy cards

Missing provider configuration appears first. Configured checks collapse into a summary; policy rows reveal detailed reference copy on demand.

**Status:** Fixed and verified.

**Checks:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [View 1](root/_admin_settings-390.png) · [View 2](root/_admin_settings-1440.png)

