# PhenoFarm UI fixes — September 17, 2026

All 216 findings from the two-pass UI review are fixed, including all 9 high-priority findings. Every item below links its implementation and rendered evidence.

Shorter copy and simpler navigation; tighter mobile forms, cards and tables; responsive dialogs and controls; accurate batch values, calendar dates and report months; quieter, more specific messaging and notifications.

Verified locally against the isolated phenofarm_ui_fixes_20260917 database. METRC work was excluded. No production deployment, Git commit, or push was performed.

## Verification

- All 216 original finding IDs are covered exactly once, including all 9 high-priority findings.
- 48 pages checked at 1440px desktop and 390px mobile: 96 views, no page errors or horizontal overflow. All five redirects passed.
- 81 distinct workflow and regression tests passed across targeted local runs. Real upload/storage and development-only seed checks ran against the development server; all tests used the isolated database.
- Critical buyer dialogs and list controls also passed at 360px. Admin responsive layouts, heading sizes, badges and confirmations passed at 1440, 1024, 768, 390 and 360px.
- Landing page checked with normal and reduced motion at 1440/390px: four clean hydration and overflow checks.
- Final npm run verify passed: environment validation, lint, Prisma generation and production build.

## Complete item list


### public

#### PUB-003 — Mobile hero repeats settlement promise

Shortened the hero support paragraph while retaining verification, tracking, and direct-settlement meaning.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.; Landing hydration rechecked with both reduced and normal motion at 1440/390px; all four checks passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-home-mobile.png) · [Evidence 2](../remediation/root/home-final-reduce-390.png) · [Evidence 3](../remediation/root/home-final-no-preference-1440.png)

**Files:** [app/landing/hero.tsx](/Users/sam/dev/phenofarm-mvp/app/landing/hero.tsx), [app/landing/money-flow.tsx](/Users/sam/dev/phenofarm-mvp/app/landing/money-flow.tsx), [app/landing/feature-tour.tsx](/Users/sam/dev/phenofarm-mvp/app/landing/feature-tour.tsx), [app/landing/motion.tsx](/Users/sam/dev/phenofarm-mvp/app/landing/motion.tsx)

#### PUB-016 — Testimonial-to-pricing transition has excess vertical space

Reduced pricing section top padding to shorten the settled testimonial-to-pricing transition.

**Verified:** Fresh settled scroll captures at 1440x1000 and 390x844 inspected; all reveal-on-scroll content rendered.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-home-settled-desktop-y04200.png) · [Evidence 2](../remediation/public-admin/public-home-settled-mobile-y05664.png)

**Files:** [app/landing/pricing.tsx](/Users/sam/dev/phenofarm-mvp/app/landing/pricing.tsx)

#### PUB-017 — Mobile footer repeats Privacy and Terms links

Removed duplicate policy links from the Company group and kept one compact bottom legal row.

**Verified:** Fresh settled footer capture inspected at 390x844; footer text has one Privacy/Terms/Cookies row.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-home-settled-mobile-footer.png) · [Evidence 2](../remediation/public-admin/public-home-settled-desktop-y06720.png)

**Files:** [app/landing/footer.tsx](/Users/sam/dev/phenofarm-mvp/app/landing/footer.tsx)

#### PUB-014 — Configuration error repeats marketing copy

Replaced the shared desktop error marketing panel with concise access-recovery copy.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-error-configuration-desktop.png) · [Evidence 2](../remediation/public-admin/public-error-configuration-mobile.png)

**Files:** [app/auth/error/page.tsx](/Users/sam/dev/phenofarm-mvp/app/auth/error/page.tsx)

#### PUB-015 — Credentials error repeats marketing copy

Applied the same concise shared access-recovery panel while preserving the credential-specific error card.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-error-credentials-desktop.png) · [Evidence 2](../remediation/public-admin/public-error-credentials-mobile.png)

**Files:** [app/auth/error/page.tsx](/Users/sam/dev/phenofarm-mvp/app/auth/error/page.tsx)

#### PUB-011 — Sign-in marketing panel is overlong

Shortened the desktop marketing headline and support paragraph while keeping the mobile form layout.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-sign-in-desktop.png) · [Evidence 2](../remediation/public-admin/public-sign-in-mobile.png)

**Files:** [app/auth/sign_in/page.tsx](/Users/sam/dev/phenofarm-mvp/app/auth/sign_in/page.tsx)

#### PUB-012 — Sign-up marketing panel repeats form promise

Shortened the desktop marketing headline and focused the supporting sentence on grower and dispensary workflows.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-sign-up-desktop.png) · [Evidence 2](../remediation/public-admin/public-sign-up-mobile.png)

**Files:** [app/auth/sign_up/page.tsx](/Users/sam/dev/phenofarm-mvp/app/auth/sign_up/page.tsx)

#### PUB-013 — Mobile sign-up disclosure wraps awkwardly

Shortened the legal disclosure and retained both Terms and Privacy Policy links inline.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-sign-up-mobile.png)

**Files:** [app/auth/sign_up/page.tsx](/Users/sam/dev/phenofarm-mvp/app/auth/sign_up/page.tsx)

#### PUB-005 — Mobile contact form starts below long preamble

Shortened the contact heading and tightened the lead information card spacing so the form begins sooner.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-contact-mobile.png)

**Files:** [app/contact/page.tsx](/Users/sam/dev/phenofarm-mvp/app/contact/page.tsx)

#### PUB-006 — Contact helper copy is longer than needed

Shortened the form helper copy without changing fields or the email-draft action.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-contact-desktop.png) · [Evidence 2](../remediation/public-admin/public-contact-mobile.png)

**Files:** [app/contact/page.tsx](/Users/sam/dev/phenofarm-mvp/app/contact/page.tsx)

#### PUB-004 — Help intro repeats page purpose

Removed the duplicate help eyebrow and kept one Marketplace help heading with a concise topic summary.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-help-desktop.png) · [Evidence 2](../remediation/public-admin/public-help-mobile.png)

**Files:** [app/help/page.tsx](/Users/sam/dev/phenofarm-mvp/app/help/page.tsx)

#### PUB-009 — Cookie draft status is duplicated

Removed the duplicate body draft-status card and preserved the hero counsel-review warning.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-cookies-desktop.png) · [Evidence 2](../remediation/public-admin/public-cookies-mobile.png)

**Files:** [app/legal/cookies/page.tsx](/Users/sam/dev/phenofarm-mvp/app/legal/cookies/page.tsx)

#### PUB-010 — Cookie section heading is wordy

Renamed the section to Cookies and storage.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-cookies-desktop.png) · [Evidence 2](../remediation/public-admin/public-cookies-mobile.png)

**Files:** [app/legal/cookies/page.tsx](/Users/sam/dev/phenofarm-mvp/app/legal/cookies/page.tsx)

#### PUB-007 — Privacy draft status is duplicated

Removed the duplicate body draft-status card; the concise hero warning remains.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-privacy-desktop.png) · [Evidence 2](../remediation/public-admin/public-privacy-mobile.png)

**Files:** [app/legal/privacy/page.tsx](/Users/sam/dev/phenofarm-mvp/app/legal/privacy/page.tsx)

#### PUB-008 — Terms draft status is duplicated

Removed the duplicate body draft-status card; substantive terms begin after Contents.

**Verified:** Fresh desktop/mobile render captured and inspected after network-idle settle.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/public-terms-desktop.png) · [Evidence 2](../remediation/public-admin/public-terms-mobile.png)

**Files:** [app/legal/terms/page.tsx](/Users/sam/dev/phenofarm-mvp/app/legal/terms/page.tsx)


### grower

#### G28 — Repair the batch list render failure

Batch API lab values normalize before formatting; decimal strings and zeroes render, invalid or absent values show a dash.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Three meaningful data regressions cover decimal/zero/missing labs, harvest dates in Los Angeles and Tokyo at 1440/390/360px, and saving a legacy lowercase unit without altering stock, price, labs or harvest day; all passed in the root stable-build run.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batches-desktop.png) · [Evidence 2](../remediation/grower/batches-mobile.png) · [Evidence 3](../remediation/grower/batches-narrow.png)

**Files:** [app/grower/batches/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/page.tsx), [lib/batch-utils.ts](/Users/sam/dev/phenofarm-mvp/lib/batch-utils.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G29 — Keep harvest dates consistent

Harvest dates use the same UTC calendar day in list and edit views across time zones.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Three meaningful data regressions cover decimal/zero/missing labs, harvest dates in Los Angeles and Tokyo at 1440/390/360px, and saving a legacy lowercase unit without altering stock, price, labs or harvest day; all passed in the root stable-build run.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batches-desktop.png) · [Evidence 2](../remediation/grower/batches-mobile.png) · [Evidence 3](../remediation/grower/batches-narrow.png)

**Files:** [app/grower/batches/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/page.tsx), [lib/batch-utils.ts](/Users/sam/dev/phenofarm-mvp/lib/batch-utils.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G30 — Compact mobile batch actions

Batches use compact metrics and one Edit/Add product/More action row; destructive work is secondary.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Opened the batch More menu at both widths and dismissed it with Escape without submitting a delete.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batches-desktop.png) · [Evidence 2](../remediation/grower/batches-mobile.png) · [Evidence 3](../remediation/grower/batches-narrow.png) · [Evidence 4](../remediation/grower/batch-more-desktop.png) · [Evidence 5](../remediation/grower/batch-more-mobile.png)

**Files:** [app/grower/batches/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/page.tsx), [lib/batch-utils.ts](/Users/sam/dev/phenofarm-mvp/lib/batch-utils.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx), [app/grower/components/RecordActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/RecordActions.tsx)

#### G33 — Replace the raw JSON terpene editor

Batch terpenes use name/percentage rows with Add/remove controls, retaining existing data unless intentionally edited.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Added an unsaved terpene row; name, percent and remove control remain visible on mobile and desktop.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batch-edit-desktop.png) · [Evidence 2](../remediation/grower/batch-edit-mobile.png) · [Evidence 3](../remediation/grower/batch-terpenes-desktop.png) · [Evidence 4](../remediation/grower/batch-terpenes-mobile.png)

**Files:** [app/grower/batches/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/[id]/edit/page.tsx), [app/grower/components/BatchLabDocumentUploaders.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchLabDocumentUploaders.tsx)

#### G34 — Reduce repeated batch-edit content

Batch editing uses one heading, paired short lab fields and compact document upload rows.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batch-edit-desktop.png) · [Evidence 2](../remediation/grower/batch-edit-mobile.png)

**Files:** [app/grower/batches/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/[id]/edit/page.tsx), [app/grower/components/BatchLabDocumentUploaders.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchLabDocumentUploaders.tsx)

#### G35 — Clarify the batch-number example

Edit mode removes the misleading expected-format hint beside existing batch numbers.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batch-edit-desktop.png) · [Evidence 2](../remediation/grower/batch-edit-mobile.png)

**Files:** [app/grower/batches/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/[id]/edit/page.tsx), [app/grower/components/BatchLabDocumentUploaders.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchLabDocumentUploaders.tsx)

#### G31 — Use compact lab-document rows

Lab PDFs use three concise rows with one PDF/2MB limit note and no untouched Missing badges.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batch-add-desktop.png) · [Evidence 2](../remediation/grower/batch-add-mobile.png)

**Files:** [app/grower/batches/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/add/page.tsx), [app/grower/components/BatchLabDocumentUploaders.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchLabDocumentUploaders.tsx)

#### G32 — Pair short lab fields

Add batch has one title, one batch-ID example and a compact THC/CBD/Total numeric row.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/batch-add-desktop.png) · [Evidence 2](../remediation/grower/batch-add-mobile.png)

**Files:** [app/grower/batches/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/batches/add/page.tsx), [app/grower/components/BatchLabDocumentUploaders.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchLabDocumentUploaders.tsx)

#### G05 — Make the catalog overview concise

Catalog overview uses concise destinations and one actionable issue prompt instead of repeated explanations.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/catalog-desktop.png) · [Evidence 2](../remediation/grower/catalog-mobile.png)

**Files:** [app/grower/catalog/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/catalog/page.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G06 — Shorten multi-line status badges

Destination badges use short, unbroken counts such as 3 live and 1 quote-only.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/catalog-desktop.png) · [Evidence 2](../remediation/grower/catalog-mobile.png)

**Files:** [app/grower/catalog/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/catalog/page.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G07 — Compact catalog health checks

Health issues use compact linked rows; zero-count details sit under All checks.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/catalog-desktop.png) · [Evidence 2](../remediation/grower/catalog-mobile.png)

**Files:** [app/grower/catalog/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/catalog/page.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G51 — Expose supported customer-management actions

Customer directory exposes Add customer, Statement and eligible Edit contact links while platform records remain read-only.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/customers-desktop.png) · [Evidence 2](../remediation/grower/customers-mobile.png)

**Files:** [app/grower/customers/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/page.tsx), [app/grower/customers/components/CustomersList.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/components/CustomersList.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G52 — Compact customer summaries and metadata

Customer metrics are compact, duplicate business/contact names are omitted and request terminology is consistent.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/customers-desktop.png) · [Evidence 2](../remediation/grower/customers-mobile.png)

**Files:** [app/grower/customers/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/page.tsx), [app/grower/customers/components/CustomersList.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/components/CustomersList.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G54 — Combine the customer-edit header rows

Customer edit combines back and Statement links in one row above one title.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/customer-edit-desktop.png) · [Evidence 2](../remediation/grower/customer-edit-mobile.png)

**Files:** [app/grower/customers/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/[id]/edit/page.tsx), [app/grower/customers/[id]/edit/components/EditCustomerForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/[id]/edit/components/EditCustomerForm.tsx)

#### G55 — Tighten customer-edit form spacing

Customer edit uses tighter cards, paired State/ZIP and Cancel/Save; Delete is in a compact More control.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Opened More and dismissed it with Escape; the form remained unchanged.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/customer-edit-desktop.png) · [Evidence 2](../remediation/grower/customer-edit-mobile.png) · [Evidence 3](../remediation/grower/customer-more-desktop.png) · [Evidence 4](../remediation/grower/customer-more-mobile.png)

**Files:** [app/grower/customers/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/[id]/edit/page.tsx), [app/grower/customers/[id]/edit/components/EditCustomerForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/[id]/edit/components/EditCustomerForm.tsx), [app/grower/components/RecordActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/RecordActions.tsx)

#### G56 — Keep statement values visible on mobile

Mobile statements use rows with visible reference/date, item summary and value without horizontal scrolling.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/customer-statement-desktop.png) · [Evidence 2](../remediation/grower/customer-statement-mobile.png) · [Evidence 3](../remediation/grower/customer-statement-narrow.png)

**Files:** [app/grower/customers/[id]/statement/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/[id]/statement/page.tsx)

#### G57 — Shorten statement copy and fix singular counts

Statements have a short title with customer subtitle, Customer back link, singular-aware counts and one settlement note.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/customer-statement-desktop.png) · [Evidence 2](../remediation/grower/customer-statement-mobile.png) · [Evidence 3](../remediation/grower/customer-statement-narrow.png)

**Files:** [app/grower/customers/[id]/statement/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/[id]/statement/page.tsx)

#### G53 — Trim repeated customer-form context

Add customer has one heading, paired State/ZIP fields and paired footer actions.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/customer-add-desktop.png) · [Evidence 2](../remediation/grower/customer-add-mobile.png)

**Files:** [app/grower/customers/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/customers/add/page.tsx)

#### G01 — Put pending work before the setup checklist

Daily attention comes before a collapsed Setup count; completed setup items share one compact line.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/dashboard-desktop.png) · [Evidence 2](../remediation/grower/dashboard-mobile.png) · [Evidence 3](../remediation/grower/dashboard-setup-desktop.png) · [Evidence 4](../remediation/grower/dashboard-setup-mobile.png)

**Files:** [app/grower/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/page.tsx), [app/grower/dashboard/GrowerAttentionPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/GrowerAttentionPanel.tsx), [app/grower/dashboard/ActivityFeed.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/ActivityFeed.tsx), [app/grower/dashboard/DeliveredValueChartFrame.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/DeliveredValueChartFrame.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G02 — Remove repeated dashboard headings

Uses one Needs attention heading, one Recent activity heading and concise linked metrics.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/dashboard-desktop.png) · [Evidence 2](../remediation/grower/dashboard-mobile.png)

**Files:** [app/grower/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/page.tsx), [app/grower/dashboard/GrowerAttentionPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/GrowerAttentionPanel.tsx), [app/grower/dashboard/ActivityFeed.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/ActivityFeed.tsx), [app/grower/dashboard/DeliveredValueChartFrame.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/DeliveredValueChartFrame.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G03 — Show recent chart data first

Shorter chart defaults to recent days, preserves horizontal access to earlier days and shows its date range.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/dashboard-desktop.png) · [Evidence 2](../remediation/grower/dashboard-mobile.png)

**Files:** [app/grower/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/page.tsx), [app/grower/dashboard/GrowerAttentionPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/GrowerAttentionPanel.tsx), [app/grower/dashboard/ActivityFeed.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/ActivityFeed.tsx), [app/grower/dashboard/DeliveredValueChartFrame.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/DeliveredValueChartFrame.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G04 — Use plain subscription and terms copy

Subscription and commercial terms use plain business copy without exposing provider setup details.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/dashboard-desktop.png) · [Evidence 2](../remediation/grower/dashboard-mobile.png) · [Evidence 3](../remediation/grower/dashboard-setup-desktop.png) · [Evidence 4](../remediation/grower/dashboard-setup-mobile.png)

**Files:** [app/grower/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/page.tsx), [app/grower/dashboard/GrowerAttentionPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/GrowerAttentionPanel.tsx), [app/grower/dashboard/ActivityFeed.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/ActivityFeed.tsx), [app/grower/dashboard/DeliveredValueChartFrame.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/dashboard/DeliveredValueChartFrame.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G58 — Name the catalog destination clearly

Catalog destination uses its task name; Grower role label is consistent; short menus omit category headings and repeated mobile role subtitle.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/settings-desktop.png) · [Evidence 2](../remediation/root/settings-mobile.png)

**Files:** [app/grower/layout.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/layout.tsx), [app/grower/components/ClientNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/ClientNav.tsx), [app/components/ui/MobileNav.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/MobileNav.tsx)

#### G59 — Shorten mobile search guidance

Short search guidance, no empty result count, correct singular result, desktop-only keyboard hints and 40px secondary actions.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/search-desktop.png) · [Evidence 2](../remediation/root/search-mobile.png) · [Evidence 3](../remediation/root/search-one-mobile.png)

**Files:** [app/components/SearchDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/components/SearchDialog.tsx)

#### G60 — Use one conversation-selection prompt

One empty selection prompt, deferred composer, compact Templates and Quote controls; labeled product-specific quote form replaces message controls, preserves drafts and keeps payment guidance in quote context.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/chat-mobile.png) · [Evidence 2](../remediation/root/quote-1440.png) · [Evidence 3](../remediation/root/quote-390.png) · [Evidence 4](../remediation/root/quote-360.png)

**Files:** [app/components/messaging/ChatDrawer.tsx](/Users/sam/dev/phenofarm-mvp/app/components/messaging/ChatDrawer.tsx)

#### G61 — Reduce message-composer clutter

One empty selection prompt, deferred composer, compact Templates and Quote controls; labeled product-specific quote form replaces message controls, preserves drafts and keeps payment guidance in quote context.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/chat-mobile.png) · [Evidence 2](../remediation/root/quote-1440.png) · [Evidence 3](../remediation/root/quote-390.png) · [Evidence 4](../remediation/root/quote-360.png)

**Files:** [app/components/messaging/ChatDrawer.tsx](/Users/sam/dev/phenofarm-mvp/app/components/messaging/ChatDrawer.tsx), [app/components/ux/DraftAutosaveStatus.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ux/DraftAutosaveStatus.tsx)

#### G62 — Give quotes persistent labels and context

One empty selection prompt, deferred composer, compact Templates and Quote controls; labeled product-specific quote form replaces message controls, preserves drafts and keeps payment guidance in quote context.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/chat-mobile.png) · [Evidence 2](../remediation/root/quote-1440.png) · [Evidence 3](../remediation/root/quote-390.png) · [Evidence 4](../remediation/root/quote-360.png)

**Files:** [app/components/messaging/ChatDrawer.tsx](/Users/sam/dev/phenofarm-mvp/app/components/messaging/ChatDrawer.tsx)

#### G63 — Make notifications specific and concise

Notifications identify the buyer/seller and request or product, group duplicate history, omit empty counts, and anchor the desktop panel beside its trigger.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/notifications-desktop.png) · [Evidence 2](../remediation/root/notifications-mobile.png)

**Files:** [app/components/notifications/NotificationBell.tsx](/Users/sam/dev/phenofarm-mvp/app/components/notifications/NotificationBell.tsx), [app/api/notifications/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/notifications/route.ts), [lib/notifications.ts](/Users/sam/dev/phenofarm-mvp/lib/notifications.ts), [app/api/messages/conversations/[id]/messages/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/messages/conversations/[id]/messages/route.ts), [app/api/messages/messages/[id]/offer-action/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/messages/messages/[id]/offer-action/route.ts)

#### G19 — Compact inventory summaries

Inventory has one heading, compact metrics and inline actions; its first product is visible sooner on mobile.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/inventory-desktop.png) · [Evidence 2](../remediation/grower/inventory-mobile.png)

**Files:** [app/grower/inventory/InventoryClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/inventory/InventoryClient.tsx), [app/grower/inventory/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/inventory/page.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G20 — Format values and units consistently

Stock value uses grouped currency and familiar unit abbreviations such as g while package names remain explicit.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/inventory-desktop.png) · [Evidence 2](../remediation/grower/inventory-mobile.png)

**Files:** [app/grower/inventory/InventoryClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/inventory/InventoryClient.tsx), [app/grower/inventory/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/inventory/page.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G21 — Explain stock edits in plain language

Stock instructions explain entering the current total and automatic saving in ordinary language.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/inventory-desktop.png) · [Evidence 2](../remediation/grower/inventory-mobile.png)

**Files:** [app/grower/inventory/InventoryClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/inventory/InventoryClient.tsx), [app/grower/inventory/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/inventory/page.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G22 — Keep stock updates focused

Stock update has a bounded, full-width form, two core fields, paired actions and secondary Add a new product.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/stock-update-desktop.png) · [Evidence 2](../remediation/grower/stock-update-mobile.png)

**Files:** [app/grower/inventory/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/inventory/add/page.tsx)

#### G36 — Keep request status, value, and View visible

Mobile requests show buyer/reference, status, value and View request in cards without horizontal scrolling.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/orders-desktop.png) · [Evidence 2](../remediation/grower/orders-mobile.png) · [Evidence 3](../remediation/grower/orders-narrow.png)

**Files:** [app/grower/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/page.tsx), [app/grower/orders/components/OrdersList.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/components/OrdersList.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G37 — Move requests above summary clutter

Compact metrics and status filters bring active requests into the first mobile screen.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/orders-desktop.png) · [Evidence 2](../remediation/grower/orders-mobile.png) · [Evidence 3](../remediation/grower/orders-narrow.png)

**Files:** [app/grower/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/page.tsx), [app/grower/orders/components/OrdersList.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/components/OrdersList.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G38 — Replace request workflow jargon

Request headings and filters use plain language, with one relevant direct-payment note.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/orders-desktop.png) · [Evidence 2](../remediation/grower/orders-mobile.png)

**Files:** [app/grower/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/page.tsx), [app/grower/orders/components/OrdersList.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/components/OrdersList.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G45 — Prioritize the next request action

Request detail has one back link, a small reference, secondary Actions disclosure and the next status action above items.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-detail-desktop.png) · [Evidence 2](../remediation/grower/order-detail-mobile.png) · [Evidence 3](../remediation/grower/order-actions-desktop.png) · [Evidence 4](../remediation/grower/order-actions-mobile.png)

**Files:** [app/grower/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/page.tsx), [app/grower/orders/[id]/components/QuickStatusUpdate.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/components/QuickStatusUpdate.tsx)

#### G46 — Consolidate repeated request status

One current-status badge remains prominent; Progress and Request history are collapsed but accessible.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Depends on root-owned shared timeline simplification; local Progress/history disclosures retain access.; Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-detail-desktop.png) · [Evidence 2](../remediation/grower/order-detail-mobile.png) · [Evidence 3](../remediation/grower/order-progress-desktop.png) · [Evidence 4](../remediation/grower/order-progress-mobile.png)

**Files:** [app/grower/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/page.tsx), [app/grower/orders/[id]/components/QuickStatusUpdate.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/components/QuickStatusUpdate.tsx), [app/components/ui/OrderTimeline.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/OrderTimeline.tsx)

#### G47 — Shorten request totals copy

Request items and totals use Items, Subtotal and Est. total with one direct-payment note.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-detail-desktop.png) · [Evidence 2](../remediation/grower/order-detail-mobile.png)

**Files:** [app/grower/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/page.tsx), [app/grower/orders/[id]/components/QuickStatusUpdate.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/components/QuickStatusUpdate.tsx)

#### G48 — Separate street and city in addresses

Customer street and city keep a visible line break on mobile and desktop.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-detail-desktop.png) · [Evidence 2](../remediation/grower/order-detail-mobile.png)

**Files:** [app/grower/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/page.tsx), [app/grower/orders/[id]/components/QuickStatusUpdate.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/components/QuickStatusUpdate.tsx)

#### G49 — Use one request status panel

Edit request uses one compact current-status area and clear next-status choices.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-edit-desktop.png) · [Evidence 2](../remediation/grower/order-edit-mobile.png)

**Files:** [app/grower/orders/[id]/edit/components/EditOrderForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/edit/components/EditOrderForm.tsx)

#### G50 — Compact short request fields

Shipping/tax share a row, retain the invoice-only tax explanation and use concise Notes/Summary headings.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-edit-desktop.png) · [Evidence 2](../remediation/grower/order-edit-mobile.png)

**Files:** [app/grower/orders/[id]/edit/components/EditOrderForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/[id]/edit/components/EditOrderForm.tsx)

#### G41 — Use plain record-request copy

Record request explains the direct agreement once and uses one buyer search prompt.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-add-desktop.png) · [Evidence 2](../remediation/grower/order-add-mobile.png)

**Files:** [app/grower/orders/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/add/page.tsx)

#### G42 — Put items before optional request details

The form runs Buyer, Items, then optional Shipping/notes, with one save action at the end.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-add-desktop.png) · [Evidence 2](../remediation/grower/order-add-mobile.png) · [Evidence 3](../remediation/grower/order-add-item-desktop.png) · [Evidence 4](../remediation/grower/order-add-item-mobile.png)

**Files:** [app/grower/orders/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/add/page.tsx)

#### G43 — Keep the message launcher clear of Add item

Add item is left-aligned with reserved trailing space, clear of the floating message launcher at mobile widths.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-add-desktop.png) · [Evidence 2](../remediation/grower/order-add-mobile.png) · [Evidence 3](../remediation/grower/order-add-item-mobile.png) · [Evidence 4](../remediation/grower/order-add-item-narrow.png)

**Files:** [app/grower/orders/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/add/page.tsx)

#### G44 — Remove repeated item prices and stock

Items select by product name, pair quantity and agreed price, show availability once, and use concise totals.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-add-desktop.png) · [Evidence 2](../remediation/grower/order-add-mobile.png) · [Evidence 3](../remediation/grower/order-add-item-desktop.png) · [Evidence 4](../remediation/grower/order-add-item-mobile.png) · [Evidence 5](../remediation/grower/order-add-item-narrow.png)

**Files:** [app/grower/orders/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/add/page.tsx)

#### G39 — Keep history values and actions visible

Mobile history cards expose buyer/reference, closed date, value, status and View request together.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-history-desktop.png) · [Evidence 2](../remediation/grower/order-history-mobile.png) · [Evidence 3](../remediation/grower/order-history-narrow.png)

**Files:** [app/grower/orders/history/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/history/page.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G40 — Compact history summaries

Request history uses compact metrics and one concise heading with Active requests navigation.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/order-history-desktop.png) · [Evidence 2](../remediation/grower/order-history-mobile.png) · [Evidence 3](../remediation/grower/order-history-narrow.png)

**Files:** [app/grower/orders/history/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/orders/history/page.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G08 — Bring products into the first mobile screen

Compact metrics and toolbars bring the first mobile product into the initial viewport; bulk controls appear after selection.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/products-desktop.png) · [Evidence 2](../remediation/grower/products-mobile.png) · [Evidence 3](../remediation/grower/products-selected-mobile.png)

**Files:** [app/grower/products/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/page.tsx), [app/grower/products/ProductCsvImportDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/ProductCsvImportDialog.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G09 — Simplify product toolbar labels

Short filter/group labels replace workflow explanations and the ungrouped All Products heading.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/products-desktop.png) · [Evidence 2](../remediation/grower/products-mobile.png) · [Evidence 3](../remediation/grower/products-selected-mobile.png)

**Files:** [app/grower/products/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/page.tsx), [app/grower/products/ProductCsvImportDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/ProductCsvImportDialog.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G10 — Keep product price, stock, and actions visible

Mobile product cards show identity, price, stock and Edit/Hide/More without horizontal table scrolling.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/products-desktop.png) · [Evidence 2](../remediation/grower/products-mobile.png) · [Evidence 3](../remediation/grower/products-narrow.png) · [Evidence 4](../remediation/grower/products-more-mobile.png)

**Files:** [app/grower/products/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/page.tsx), [app/grower/products/ProductCsvImportDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/ProductCsvImportDialog.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx), [app/grower/components/RecordActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/RecordActions.tsx)

#### G11 — Make Quick add quick to scan

Quick add has one heading with Close beside it, concise defaults, and paired mobile price/stock inputs.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/products-desktop.png) · [Evidence 2](../remediation/grower/products-mobile.png) · [Evidence 3](../remediation/grower/products-quick-desktop.png) · [Evidence 4](../remediation/grower/products-quick-mobile.png)

**Files:** [app/grower/products/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/page.tsx), [app/grower/products/ProductCsvImportDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/ProductCsvImportDialog.tsx)

#### G16 — Show the saved unit in the edit form

Legacy product units normalize into the selected option; editing preserves price, stock, labs and harvest date.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Three meaningful data regressions cover decimal/zero/missing labs, harvest dates in Los Angeles and Tokyo at 1440/390/360px, and saving a legacy lowercase unit without altering stock, price, labs or harvest day; all passed in the root stable-build run.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/product-edit-desktop.png) · [Evidence 2](../remediation/grower/product-edit-mobile.png)

**Files:** [app/grower/products/components/ProductForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/[id]/edit/components/EditProductPageClient.tsx), [app/grower/components/BatchSelector.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchSelector.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts)

#### G17 — Use a focused product-edit layout

Editing uses compact navigation, wider fields, Stock wording and one Save changes action per viewport.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/product-edit-desktop.png) · [Evidence 2](../remediation/grower/product-edit-mobile.png)

**Files:** [app/grower/products/components/ProductForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/[id]/edit/components/EditProductPageClient.tsx), [app/grower/components/BatchSelector.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchSelector.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts)

#### G18 — Hide irrelevant batch-detail guidance

Batch details links appear only for a matching selected batch; empty guidance is concise.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/product-edit-desktop.png) · [Evidence 2](../remediation/grower/product-edit-mobile.png)

**Files:** [app/grower/products/components/ProductForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/[id]/edit/components/EditProductPageClient.tsx), [app/grower/components/BatchSelector.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchSelector.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts)

#### G12 — Reduce product setup guidance

Product creation starts with compact section links and core fields instead of a five-step guide.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/product-add-desktop.png) · [Evidence 2](../remediation/grower/product-add-mobile.png)

**Files:** [app/grower/products/components/ProductForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/[id]/edit/components/EditProductPageClient.tsx), [app/grower/components/BatchSelector.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchSelector.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts)

#### G13 — Use one consistent publish action

Publish product is consistent; mobile uses one sticky primary action, one draft action and a compact summary.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/product-add-desktop.png) · [Evidence 2](../remediation/grower/product-add-mobile.png)

**Files:** [app/grower/products/components/ProductForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/[id]/edit/components/EditProductPageClient.tsx), [app/grower/components/BatchSelector.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchSelector.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts)

#### G14 — Shorten product field labels

Core labels read Starting stock, Available and Show price/Quote only with one visibility explanation.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/product-add-desktop.png) · [Evidence 2](../remediation/grower/product-add-mobile.png)

**Files:** [app/grower/products/components/ProductForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/[id]/edit/components/EditProductPageClient.tsx), [app/grower/components/BatchSelector.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchSelector.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts)

#### G15 — Remove repeated optional and upload wording

Optional details and photo requirements appear once with concise labels and actual upload status.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/product-add-desktop.png) · [Evidence 2](../remediation/grower/product-add-mobile.png)

**Files:** [app/grower/products/components/ProductForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/components/ProductForm.tsx), [app/grower/products/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/add/page.tsx), [app/grower/products/[id]/edit/components/EditProductPageClient.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/products/[id]/edit/components/EditProductPageClient.tsx), [app/grower/components/BatchSelector.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/BatchSelector.tsx), [lib/product-display.ts](/Users/sam/dev/phenofarm-mvp/lib/product-display.ts), [tests/ui-grower-data-regressions.spec.ts](/Users/sam/dev/phenofarm-mvp/tests/ui-grower-data-regressions.spec.ts)

#### G23 — Use denser strain cards and counts

Strain metrics share one row and cards have concise counts, genetics when present and a compact action row.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/strains-desktop.png) · [Evidence 2](../remediation/grower/strains-mobile.png)

**Files:** [app/grower/strains/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/page.tsx), [app/grower/components/RecordActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/RecordActions.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G24 — Clarify strain actions

Strain cards use Add product and keep Delete inside More actions.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Opened More and Delete confirmation, then cancelled; no deletion was submitted.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/strains-desktop.png) · [Evidence 2](../remediation/grower/strains-mobile.png) · [Evidence 3](../remediation/grower/strain-more-desktop.png) · [Evidence 4](../remediation/grower/strain-more-mobile.png) · [Evidence 5](../remediation/grower/strain-delete-confirm-mobile.png)

**Files:** [app/grower/strains/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/page.tsx), [app/grower/components/RecordActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/RecordActions.tsx), [app/grower/components/OperationsSummary.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/OperationsSummary.tsx)

#### G27 — Remove repeated help from strain editing

Edit strain shares the concise form and on-demand type help while retaining populated values.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Expanded the shared strain-type help content and verified it remains readable at both widths.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/strain-edit-desktop.png) · [Evidence 2](../remediation/grower/strain-edit-mobile.png) · [Evidence 3](../remediation/grower/strain-help-desktop.png) · [Evidence 4](../remediation/grower/strain-help-mobile.png)

**Files:** [app/grower/strains/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/add/page.tsx), [app/grower/strains/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/[id]/edit/page.tsx)

#### G25 — Show strain-type help on demand

Strain-type definitions sit behind About strain types rather than filling every new form.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Expanded the shared strain-type help content and verified it remains readable at both widths.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/strain-add-desktop.png) · [Evidence 2](../remediation/grower/strain-add-mobile.png) · [Evidence 3](../remediation/grower/strain-help-desktop.png) · [Evidence 4](../remediation/grower/strain-help-mobile.png)

**Files:** [app/grower/strains/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/add/page.tsx), [app/grower/strains/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/[id]/edit/page.tsx)

#### G26 — Shorten strain-form copy

Add strain has one heading, brief examples, and distinct description/growing-notes prompts.

**Verified:** Focused ESLint passed on changed grower components.; Reviewed the data, authorization and action paths; validation and request payloads remain intact.; Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.; Parent final npm run verify passed after all source corrections.

**Evidence:** [Evidence 1](../remediation/grower/strain-add-desktop.png) · [Evidence 2](../remediation/grower/strain-add-mobile.png)

**Files:** [app/grower/strains/add/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/add/page.tsx), [app/grower/strains/[id]/edit/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/strains/[id]/edit/page.tsx)


### admin-extra

#### E19 — State the preview purpose once

One preview introduction with compact listing counts and Terms link, one card shell, smaller empty art, grouped seller identity, stock once and concise buyer controls/lab note.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_marketplace-1440.png) · [Evidence 2](../remediation/final-pages/_grower_marketplace-390.png)

**Files:** [app/grower/marketplace/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/marketplace/page.tsx), [app/components/ui/ProductImage.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/ProductImage.tsx)

#### E20 — Replace four stacked preamble cards

One preview introduction with compact listing counts and Terms link, one card shell, smaller empty art, grouped seller identity, stock once and concise buyer controls/lab note.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_marketplace-1440.png) · [Evidence 2](../remediation/final-pages/_grower_marketplace-390.png)

**Files:** [app/grower/marketplace/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/marketplace/page.tsx), [app/components/ui/ProductImage.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/ProductImage.tsx)

#### E21 — Remove nested mobile card padding

One preview introduction with compact listing counts and Terms link, one card shell, smaller empty art, grouped seller identity, stock once and concise buyer controls/lab note.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_marketplace-1440.png) · [Evidence 2](../remediation/final-pages/_grower_marketplace-390.png)

**Files:** [app/grower/marketplace/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/marketplace/page.tsx), [app/components/ui/ProductImage.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/ProductImage.tsx)

#### E22 — Simplify shared product-card repetition

One preview introduction with compact listing counts and Terms link, one card shell, smaller empty art, grouped seller identity, stock once and concise buyer controls/lab note. Batch lab values now take priority over product ranges, matching buyer cards and preserving legitimate zero values.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.; Preview THC 24.8% and CBD 0% verified at 1440, 390 and 360px in two timezones.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_marketplace-1440.png) · [Evidence 2](../remediation/final-pages/_grower_marketplace-390.png)

**Files:** [app/grower/marketplace/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/marketplace/page.tsx), [app/components/ui/ProductImage.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/ProductImage.tsx)

#### E08 — Reduce the plan-page preamble

Concise plan intro and unavailable-upgrade guidance, one current-plan marker, deduplicated benefits and expandable features while prices and annual billing terms remain visible.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_pricing-1440.png) · [Evidence 2](../remediation/final-pages/_grower_pricing-390.png)

**Files:** [app/grower/pricing/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/page.tsx), [app/grower/pricing/PricingPlans.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/PricingPlans.tsx)

#### E09 — Show useful unavailable-upgrade copy

Concise plan intro and unavailable-upgrade guidance, one current-plan marker, deduplicated benefits and expandable features while prices and annual billing terms remain visible.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_pricing-1440.png) · [Evidence 2](../remediation/final-pages/_grower_pricing-390.png)

**Files:** [app/grower/pricing/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/page.tsx), [app/grower/pricing/PricingPlans.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/PricingPlans.tsx)

#### E10 — Remove repeated plan labels and features

Concise plan intro and unavailable-upgrade guidance, one current-plan marker, deduplicated benefits and expandable features while prices and annual billing terms remain visible.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_pricing-1440.png) · [Evidence 2](../remediation/final-pages/_grower_pricing-390.png)

**Files:** [app/grower/pricing/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/page.tsx), [app/grower/pricing/PricingPlans.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/PricingPlans.tsx)

#### E11 — Make mobile plan comparison less scroll-heavy

Concise plan intro and unavailable-upgrade guidance, one current-plan marker, deduplicated benefits and expandable features while prices and annual billing terms remain visible.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_pricing-1440.png) · [Evidence 2](../remediation/final-pages/_grower_pricing-390.png)

**Files:** [app/grower/pricing/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/page.tsx), [app/grower/pricing/PricingPlans.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/pricing/PricingPlans.tsx)

#### E01 — Shorten report headings and repeated range wording

Compact report header, inline exports and presets, 2×2 KPIs, bounded sparse chart, collapsed zero statuses, UTC calendar-month labels, singular counts and customer-first rows.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_reports-1440.png) · [Evidence 2](../remediation/final-pages/_grower_reports-390.png)

**Files:** [app/grower/reports/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/page.tsx), [app/grower/reports/ReportsExportActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/ReportsExportActions.tsx), [lib/calendar-month.ts](/Users/sam/dev/phenofarm-mvp/lib/calendar-month.ts)

#### E02 — Compact mobile exports and date presets

Compact report header, inline exports and presets, 2×2 KPIs, bounded sparse chart, collapsed zero statuses, UTC calendar-month labels, singular counts and customer-first rows.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_reports-1440.png) · [Evidence 2](../remediation/final-pages/_grower_reports-390.png)

**Files:** [app/grower/reports/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/page.tsx), [app/grower/reports/ReportsExportActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/ReportsExportActions.tsx), [lib/calendar-month.ts](/Users/sam/dev/phenofarm-mvp/lib/calendar-month.ts)

#### E03 — Remove the orphan KPI half-row

Compact report header, inline exports and presets, 2×2 KPIs, bounded sparse chart, collapsed zero statuses, UTC calendar-month labels, singular counts and customer-first rows.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_reports-1440.png) · [Evidence 2](../remediation/final-pages/_grower_reports-390.png)

**Files:** [app/grower/reports/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/page.tsx), [app/grower/reports/ReportsExportActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/ReportsExportActions.tsx), [lib/calendar-month.ts](/Users/sam/dev/phenofarm-mvp/lib/calendar-month.ts)

#### E04 — Right-size a one-period chart and empty statuses

Compact report header, inline exports and presets, 2×2 KPIs, bounded sparse chart, collapsed zero statuses, UTC calendar-month labels, singular counts and customer-first rows.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_reports-1440.png) · [Evidence 2](../remediation/final-pages/_grower_reports-390.png)

**Files:** [app/grower/reports/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/page.tsx), [app/grower/reports/ReportsExportActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/ReportsExportActions.tsx), [lib/calendar-month.ts](/Users/sam/dev/phenofarm-mvp/lib/calendar-month.ts)

#### E05 — Correct the month displayed on the trend

Compact report header, inline exports and presets, 2×2 KPIs, bounded sparse chart, collapsed zero statuses, UTC calendar-month labels, singular counts and customer-first rows.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_reports-1440.png) · [Evidence 2](../remediation/final-pages/_grower_reports-390.png)

**Files:** [app/grower/reports/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/page.tsx), [app/grower/reports/ReportsExportActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/ReportsExportActions.tsx), [lib/calendar-month.ts](/Users/sam/dev/phenofarm-mvp/lib/calendar-month.ts)

#### E06 — Use singular count wording

Compact report header, inline exports and presets, 2×2 KPIs, bounded sparse chart, collapsed zero statuses, UTC calendar-month labels, singular counts and customer-first rows.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_reports-1440.png) · [Evidence 2](../remediation/final-pages/_grower_reports-390.png)

**Files:** [app/grower/reports/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/page.tsx), [app/grower/reports/ReportsExportActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/ReportsExportActions.tsx), [lib/calendar-month.ts](/Users/sam/dev/phenofarm-mvp/lib/calendar-month.ts)

#### E07 — Preserve customer context in the compact mobile list

Compact report header, inline exports and presets, 2×2 KPIs, bounded sparse chart, collapsed zero statuses, UTC calendar-month labels, singular counts and customer-first rows.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_reports-1440.png) · [Evidence 2](../remediation/final-pages/_grower_reports-390.png)

**Files:** [app/grower/reports/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/page.tsx), [app/grower/reports/ReportsExportActions.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/reports/ReportsExportActions.tsx), [lib/calendar-month.ts](/Users/sam/dev/phenofarm-mvp/lib/calendar-month.ts)

#### E12 — Explain settlement once

Profile-first full-width layout, horizontal section navigation, shorter linked labels, dirty-only Save profile actions, separate Save terms, multiline contact note, one settlement disclosure and navigation sign-out.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_settings-1440.png) · [Evidence 2](../remediation/final-pages/_grower_settings-390.png)

**Files:** [app/grower/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsForm.tsx), [app/grower/settings/components/SettingsSectionNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsSectionNav.tsx), [app/components/settings/CommercialTermsPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/SubscriptionBilling.tsx)

#### E13 — Rebalance profile and logo space

Profile-first full-width layout, horizontal section navigation, shorter linked labels, dirty-only Save profile actions, separate Save terms, multiline contact note, one settlement disclosure and navigation sign-out.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_settings-1440.png) · [Evidence 2](../remediation/final-pages/_grower_settings-390.png)

**Files:** [app/grower/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsForm.tsx), [app/grower/settings/components/SettingsSectionNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsSectionNav.tsx), [app/components/settings/CommercialTermsPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/SubscriptionBilling.tsx)

#### E14 — Restore mobile section navigation

Profile-first full-width layout, horizontal section navigation, shorter linked labels, dirty-only Save profile actions, separate Save terms, multiline contact note, one settlement disclosure and navigation sign-out.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_settings-1440.png) · [Evidence 2](../remediation/final-pages/_grower_settings-390.png)

**Files:** [app/grower/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsForm.tsx), [app/grower/settings/components/SettingsSectionNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsSectionNav.tsx), [app/components/settings/CommercialTermsPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/SubscriptionBilling.tsx)

#### E15 — Reduce the persistent save strip and clarify its scope

Profile-first full-width layout, horizontal section navigation, shorter linked labels, dirty-only Save profile actions, separate Save terms, multiline contact note, one settlement disclosure and navigation sign-out.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_settings-1440.png) · [Evidence 2](../remediation/final-pages/_grower_settings-390.png)

**Files:** [app/grower/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsForm.tsx), [app/grower/settings/components/SettingsSectionNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsSectionNav.tsx), [app/components/settings/CommercialTermsPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/SubscriptionBilling.tsx)

#### E16 — Replace repeated form instructions with targeted guidance

Profile-first full-width layout, horizontal section navigation, shorter linked labels, dirty-only Save profile actions, separate Save terms, multiline contact note, one settlement disclosure and navigation sign-out.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_settings-1440.png) · [Evidence 2](../remediation/final-pages/_grower_settings-390.png)

**Files:** [app/grower/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsForm.tsx), [app/grower/settings/components/SettingsSectionNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsSectionNav.tsx), [app/components/settings/CommercialTermsPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/SubscriptionBilling.tsx)

#### E17 — Keep the contact note readable

Profile-first full-width layout, horizontal section navigation, shorter linked labels, dirty-only Save profile actions, separate Save terms, multiline contact note, one settlement disclosure and navigation sign-out.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_settings-1440.png) · [Evidence 2](../remediation/final-pages/_grower_settings-390.png)

**Files:** [app/grower/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsForm.tsx), [app/grower/settings/components/SettingsSectionNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsSectionNav.tsx), [app/components/settings/CommercialTermsPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/SubscriptionBilling.tsx)

#### E18 — Remove the redundant desktop sign-out card

Profile-first full-width layout, horizontal section navigation, shorter linked labels, dirty-only Save profile actions, separate Save terms, multiline contact note, one settlement disclosure and navigation sign-out.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_grower_settings-1440.png) · [Evidence 2](../remediation/final-pages/_grower_settings-390.png)

**Files:** [app/grower/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/page.tsx), [app/grower/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsForm.tsx), [app/grower/settings/components/SettingsSectionNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/settings/components/SettingsSectionNav.tsx), [app/components/settings/CommercialTermsPanel.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/CommercialTermsPanel.tsx), [app/components/settings/SubscriptionBilling.tsx](/Users/sam/dev/phenofarm-mvp/app/components/settings/SubscriptionBilling.tsx)

#### E23 — Give missing pages a recovery action

Branded missing-page recovery with Dashboard and Home links.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/not-found-desktop.png) · [Evidence 2](../remediation/root/not-found-mobile.png)

**Files:** [app/not-found.tsx](/Users/sam/dev/phenofarm-mvp/app/not-found.tsx)


### dispensary

#### BUY-059 — Mobile navigation has unnecessary categories

Catalog destination uses its task name; Grower role label is consistent; short menus omit category headings and repeated mobile role subtitle.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/settings-desktop.png) · [Evidence 2](../remediation/root/settings-mobile.png)

**Files:** [app/grower/layout.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/layout.tsx), [app/grower/components/ClientNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/ClientNav.tsx), [app/components/ui/MobileNav.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/MobileNav.tsx)

#### BUY-060 — Search empty state repeats instructions

Short search guidance, no empty result count, correct singular result, desktop-only keyboard hints and 40px secondary actions.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/search-desktop.png) · [Evidence 2](../remediation/root/search-mobile.png) · [Evidence 3](../remediation/root/search-one-mobile.png)

**Files:** [app/components/SearchDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/components/SearchDialog.tsx)

#### BUY-061 — Touch search shows keyboard hints and plural error

Short search guidance, no empty result count, correct singular result, desktop-only keyboard hints and 40px secondary actions.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/search-desktop.png) · [Evidence 2](../remediation/root/search-mobile.png) · [Evidence 3](../remediation/root/search-one-mobile.png)

**Files:** [app/components/SearchDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/components/SearchDialog.tsx)

#### BUY-062 — Search result secondary actions are small

Short search guidance, no empty result count, correct singular result, desktop-only keyboard hints and 40px secondary actions.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/search-desktop.png) · [Evidence 2](../remediation/root/search-mobile.png) · [Evidence 3](../remediation/root/search-one-mobile.png)

**Files:** [app/components/SearchDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/components/SearchDialog.tsx)

#### BUY-063 — Notifications omit distinguishing product context

Notifications identify the buyer/seller and request or product, group duplicate history, omit empty counts, and anchor the desktop panel beside its trigger.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/notifications-desktop.png) · [Evidence 2](../remediation/root/notifications-mobile.png)

**Files:** [app/components/notifications/NotificationBell.tsx](/Users/sam/dev/phenofarm-mvp/app/components/notifications/NotificationBell.tsx), [app/api/notifications/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/notifications/route.ts), [lib/notifications.ts](/Users/sam/dev/phenofarm-mvp/lib/notifications.ts), [app/api/messages/conversations/[id]/messages/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/messages/conversations/[id]/messages/route.ts), [app/api/messages/messages/[id]/offer-action/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/messages/messages/[id]/offer-action/route.ts)

#### BUY-064 — Notification panel opens far from its trigger

Notifications identify the buyer/seller and request or product, group duplicate history, omit empty counts, and anchor the desktop panel beside its trigger.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/notifications-desktop.png) · [Evidence 2](../remediation/root/notifications-mobile.png)

**Files:** [app/components/notifications/NotificationBell.tsx](/Users/sam/dev/phenofarm-mvp/app/components/notifications/NotificationBell.tsx), [app/api/notifications/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/notifications/route.ts), [lib/notifications.ts](/Users/sam/dev/phenofarm-mvp/lib/notifications.ts), [app/api/messages/conversations/[id]/messages/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/messages/conversations/[id]/messages/route.ts), [app/api/messages/messages/[id]/offer-action/route.ts](/Users/sam/dev/phenofarm-mvp/app/api/messages/messages/[id]/offer-action/route.ts)

#### BUY-089 — Empty message pane repeats its instruction

One empty selection prompt, deferred composer, compact Templates and Quote controls; labeled product-specific quote form replaces message controls, preserves drafts and keeps payment guidance in quote context.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/chat-mobile.png) · [Evidence 2](../remediation/root/quote-1440.png) · [Evidence 3](../remediation/root/quote-390.png) · [Evidence 4](../remediation/root/quote-360.png)

**Files:** [app/components/messaging/ChatDrawer.tsx](/Users/sam/dev/phenofarm-mvp/app/components/messaging/ChatDrawer.tsx)

#### BUY-090 — Message footer repeats role and payment guidance

One empty selection prompt, deferred composer, compact Templates and Quote controls; labeled product-specific quote form replaces message controls, preserves drafts and keeps payment guidance in quote context.

**Verified:** Implementation reviewed against the original finding.; Desktop/mobile rendered inspection passed.; Relevant shared controls, forms, API or calendar regressions passed on the isolated local database.; Lint and production build passed.

**Evidence:** [Evidence 1](../remediation/root/chat-mobile.png) · [Evidence 2](../remediation/root/quote-1440.png) · [Evidence 3](../remediation/root/quote-390.png) · [Evidence 4](../remediation/root/quote-360.png)

**Files:** [app/components/messaging/ChatDrawer.tsx](/Users/sam/dev/phenofarm-mvp/app/components/messaging/ChatDrawer.tsx)

#### BUY-091 — Recent activity uses route-like page names

Recent navigation uses short page names and actual shop business names.

**Verified:** Shop visit appears as Vermont Nurseries in the desktop recent-activity drawer.; The desktop-only drawer remains hidden on mobile, preserving the existing mobile navigation.; Recent shop labels and missing-page recovery regression passed.; Lint/build passed.

**Evidence:** [Evidence 1](../remediation/root/recent-desktop.png) · [Evidence 2](../remediation/root/recent-mobile.png)

**Files:** [app/components/ux/RecentActivityDrawer.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ux/RecentActivityDrawer.tsx)

#### BUY-014 — Empty draft repeats payment guidance

Empty draft has one short heading and helper line.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

**Evidence:** [Evidence 1](../remediation/buyer/cart-empty-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-empty-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-015 — Quote-only suggestions use an ambiguous Add action

Quote-only suggestions offer Request pricing instead of adding an unpriced item.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

**Evidence:** [Evidence 1](../remediation/buyer/cart-empty-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-empty-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-016 — Empty-state copy and illustration delay suggestions

Empty-state decorative padding and oversized icon are removed.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

**Evidence:** [Evidence 1](../remediation/buyer/cart-empty-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-empty-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-017 — Saved destination label is unnecessarily abstract

Suggestions use the concise Saved items heading.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected empty draft at both widths; quote-only saved product offers Request pricing and priced recent product offers Add. Temporary browser draft restored afterward.

**Evidence:** [Evidence 1](../remediation/buyer/cart-empty-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-empty-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-018 — Draft repeats direct-payment guidance

Payment guidance appears once with payment terms.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/cart-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-019 — Default and refresh notices dominate mobile draft

Template actions are compact; reconciliation feedback appears only when product data changed.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/cart-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-020 — Optional fields appear as warnings

Removed nonblocking warning-style suggestions for optional fields.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/cart-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-021 — Mobile draft stepper duplicates visible sections

Items, Logistics and Terms are compact anchored navigation.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/cart-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-022 — Draft summary repeats form details

Draft summary shows one Total and item/grower count.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/cart-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-023 — Remove-item touch target is too narrow

Remove-item controls have 40px targets.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected filled draft at both widths; named section anchors, larger remove targets, one total and one direct-payment note remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/cart-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-078 — Mobile draft Add link is ambiguous

Mobile draft shortcut reads Add items.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected mobile Add items shortcut and desktop draft navigation; existing link destination preserved.

**Evidence:** [Evidence 1](../remediation/buyer/cart-stable-desktop.png) · [Evidence 2](../remediation/buyer/cart-stable-mobile.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-079 — Mobile review dialog clips submission and back actions

Review is portaled above navigation with fixed header/footer and a scrollable body; Back and Submit remain inside the viewport.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected review at 1440/390/360px: header and Back/Submit remain visible above navigation, body scrolls and final recap has one Total. Dismissed without submitting.; Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

**Evidence:** [Evidence 1](../remediation/buyer/review-stable-desktop.png) · [Evidence 2](../remediation/buyer/review-stable-mobile.png) · [Evidence 3](../remediation/buyer/review-stable-360-viewport.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-080 — Review dialog repeats its purpose and summary

Review request is the sole title; details use a compact grid.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected review at 1440/390/360px: header and Back/Submit remain visible above navigation, body scrolls and final recap has one Total. Dismissed without submitting.

**Evidence:** [Evidence 1](../remediation/buyer/review-stable-desktop.png) · [Evidence 2](../remediation/buyer/review-stable-mobile.png) · [Evidence 3](../remediation/buyer/review-stable-360-viewport.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-081 — Review edit links are small and recap repeats copy

Review edit controls have 40px targets; final recap has one Total and short direct-payment note.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected review at 1440/390/360px: header and Back/Submit remain visible above navigation, body scrolls and final recap has one Total. Dismissed without submitting.

**Evidence:** [Evidence 1](../remediation/buyer/review-stable-desktop.png) · [Evidence 2](../remediation/buyer/review-stable-mobile.png) · [Evidence 3](../remediation/buyer/review-stable-360-viewport.png)

**Files:** [app/dispensary/cart/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/cart/page.tsx)

#### BUY-007 — Catalog hero delays product browsing

Catalog uses a short heading and description.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-008 — Mobile catalog toolbar spans three rows

Mobile search and toolbar use two compact rows and preserve named sort/filter/view controls.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-009 — Product cards repeat seller and stock details

Removed per-card seller text inside grower groups and repeated group counts.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-010 — Desktop price and quantity controls compete for space

Availability appears once per product, next to request controls.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-011 — Missing-photo placeholders dominate listings

Lab guidance is shortened to Lab results on request.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-012 — Catalog repeats counts and view state

Phone product images are shorter; missing-photo space no longer dominates cards.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-013 — Sparse grower groups retain a four-column grid

Removed repeated view CTA and reduced end-of-list copy and spacing.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile catalog: short heading, compact toolbar, grouped seller context, reduced images and one availability statement; all request controls remain visible.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-065 — Catalog shows an orphan draft-count badge

Catalog draft count is attached to a View draft link; navigation badge remains valid inline markup.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected View draft link/count in Catalog. Source review confirms navigation CartBadge stays inline, avoiding nested links.

**Evidence:** [Evidence 1](../remediation/buyer/catalog-stable-desktop.png) · [Evidence 2](../remediation/buyer/catalog-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-066 — Open desktop filters clip product action controls

Auto-fit cards enforce a usable minimum width; price sits above full-width quantity/Add controls with filters open.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected actual open desktop filter sidebar: cards retain minimum width, price row is separate and quantity/Add controls remain within card padding.; Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

**Evidence:** [Evidence 1](../remediation/buyer/filters-stable-desktop.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-067 — Filter shortcuts are oversized

Filter shortcuts are compact checkboxes.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected open desktop filter sidebar and mobile sheet; compact checkboxes, Favorites only label, one price-unit label and reachable Apply filters.

**Evidence:** [Evidence 1](../remediation/buyer/filters-stable-desktop.png) · [Evidence 2](../remediation/buyer/filters-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-068 — Filter action and toggle labels are unclear

Favorites only is a labelled checkbox and the sheet ends with Apply filters.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected open desktop filter sidebar and mobile sheet; compact checkboxes, Favorites only label, one price-unit label and reachable Apply filters.

**Evidence:** [Evidence 1](../remediation/buyer/filters-stable-desktop.png) · [Evidence 2](../remediation/buyer/filters-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-069 — Price filters repeat unit wording

Price per unit is stated once above shortened range options.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected open desktop filter sidebar and mobile sheet; compact checkboxes, Favorites only label, one price-unit label and reachable Apply filters.

**Evidence:** [Evidence 1](../remediation/buyer/filters-stable-desktop.png) · [Evidence 2](../remediation/buyer/filters-stable-mobile.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-070 — Mobile message context truncates both names

Message context uses wrapping product and To: grower lines.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected composer at desktop and 360px: wrapping product/grower context, concise templates, 16px mobile textarea and reachable actions. No message sent.

**Evidence:** [Evidence 1](../remediation/buyer/composer-stable-desktop.png) · [Evidence 2](../remediation/buyer/composer-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-071 — Mobile message input text is small

Catalog message input uses 16px text on phones.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected composer at desktop and 360px: wrapping product/grower context, concise templates, 16px mobile textarea and reachable actions. No message sent.

**Evidence:** [Evidence 1](../remediation/buyer/composer-stable-desktop.png) · [Evidence 2](../remediation/buyer/composer-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-072 — Pricing composer repeats explanations

Pricing templates are concise and Replies in Messages is a single quiet line.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected composer at desktop and 360px: wrapping product/grower context, concise templates, 16px mobile textarea and reachable actions. No message sent.

**Evidence:** [Evidence 1](../remediation/buyer/composer-stable-desktop.png) · [Evidence 2](../remediation/buyer/composer-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-073 — Price alert dialog omits manual-check limitation

Target-price dialog states that checking occurs on visits or refresh.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected target-price dialog at both widths: explicit manual check timing and matching target/current sale-unit notation. No alert submitted.

**Evidence:** [Evidence 1](../remediation/buyer/price-alert-stable-desktop.png) · [Evidence 2](../remediation/buyer/price-alert-stable-mobile.png) · [Evidence 3](../remediation/buyer/price-alert-stable-360-viewport.png) · [Evidence 4](../remediation/buyer/price-alert-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-074 — Price alert dialog omits sale unit

Target-price input and current price show their sale unit without nested card decoration.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected target-price dialog at both widths: explicit manual check timing and matching target/current sale-unit notation. No alert submitted.

**Evidence:** [Evidence 1](../remediation/buyer/price-alert-stable-desktop.png) · [Evidence 2](../remediation/buyer/price-alert-stable-mobile.png) · [Evidence 3](../remediation/buyer/price-alert-stable-360-viewport.png) · [Evidence 4](../remediation/buyer/price-alert-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-075 — Comparison dialog sits behind navigation

Compare is portaled above navigation with a bounded, scrolling panel and reachable close control.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected comparison at 1440/390/360px, including three products at 360px: portaled above navigation, shared attribute labels, separate request rows and reachable close control. Escape dismisses.; Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

**Evidence:** [Evidence 1](../remediation/buyer/compare-stable-desktop.png) · [Evidence 2](../remediation/buyer/compare-stable-mobile.png) · [Evidence 3](../remediation/buyer/compare-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-076 — Mobile comparison columns are too narrow

Comparison uses shared attribute labels, short units, compact headers and separate action rows; full quantity selection remains expandable.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected comparison at 1440/390/360px, including three products at 360px: portaled above navigation, shared attribute labels, separate request rows and reachable close control. Escape dismisses.

**Evidence:** [Evidence 1](../remediation/buyer/compare-stable-desktop.png) · [Evidence 2](../remediation/buyer/compare-stable-mobile.png) · [Evidence 3](../remediation/buyer/compare-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-077 — Comparison repeats decorative and explanatory content

Compare title and thumbnails are compact; grower appears once per product.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected comparison at 1440/390/360px, including three products at 360px: portaled above navigation, shared attribute labels, separate request rows and reachable close control. Escape dismisses.

**Evidence:** [Evidence 1](../remediation/buyer/compare-stable-desktop.png) · [Evidence 2](../remediation/buyer/compare-stable-mobile.png) · [Evidence 3](../remediation/buyer/compare-stable-360-viewport.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-092 — Catalog mobile list hides prices and Add buttons

Catalog list separates mobile identity, price and request controls into full-width areas.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected catalog List at 390/360px: full identity, price and request actions in separate rows without overlap.; Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

**Evidence:** [Evidence 1](../remediation/buyer/catalog-list-stable-mobile.png) · [Evidence 2](../remediation/buyer/catalog-list-stable-360.png)

**Files:** [app/dispensary/catalog/CatalogContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/CatalogContent.tsx), [app/dispensary/catalog/components/AddToCartButton.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/AddToCartButton.tsx), [app/dispensary/catalog/components/CartBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/CartBadge.tsx), [app/dispensary/catalog/components/MobileFilterSheet.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/catalog/components/MobileFilterSheet.tsx)

#### BUY-001 — Completed setup card remains oversized

Completed setup becomes a compact Verified buyer link.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

**Evidence:** [Evidence 1](../remediation/buyer/dashboard-stable-desktop.png) · [Evidence 2](../remediation/buyer/dashboard-stable-mobile.png)

**Files:** [app/dispensary/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/dashboard/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-002 — Saved summary repeats labels and counts

Saved is one row with Favorites and Alerts counts.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

**Evidence:** [Evidence 1](../remediation/buyer/dashboard-stable-desktop.png) · [Evidence 2](../remediation/buyer/dashboard-stable-mobile.png)

**Files:** [app/dispensary/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/dashboard/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-003 — Recent requests subtitle describes implementation

Removed the internal tracker-format explanation.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

**Evidence:** [Evidence 1](../remediation/buyer/dashboard-stable-desktop.png) · [Evidence 2](../remediation/buyer/dashboard-stable-mobile.png)

**Files:** [app/dispensary/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/dashboard/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-004 — Dashboard cards leave large empty areas

Recent products fit their content; the empty weekly chart is a short message.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

**Evidence:** [Evidence 1](../remediation/buyer/dashboard-stable-desktop.png) · [Evidence 2](../remediation/buyer/dashboard-stable-mobile.png)

**Files:** [app/dispensary/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/dashboard/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-005 — Mobile recent requests need compact rows

Dashboard shows three compact linked mobile order rows with short IDs, grower/date, amount and status.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

**Evidence:** [Evidence 1](../remediation/buyer/dashboard-stable-desktop.png) · [Evidence 2](../remediation/buyer/dashboard-stable-mobile.png)

**Files:** [app/dispensary/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/dashboard/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-006 — Dashboard status labels are unclear

Awaiting response and In progress use distinct status counts; Request value is shorter and definitions are expandable.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile dashboard: three compact mobile request rows, content-height cards, one Saved summary and distinct pending/in-progress values.

**Evidence:** [Evidence 1](../remediation/buyer/dashboard-stable-desktop.png) · [Evidence 2](../remediation/buyer/dashboard-stable-mobile.png)

**Files:** [app/dispensary/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/dashboard/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-037 — Shop repeats verification and category details

Verification/license appear once in a compact shop header; product types remain in filters.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png) · [Evidence 3](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 4](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 5](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 6](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 7](../remediation/buyer/shop-list-stable-mobile.png) · [Evidence 8](../remediation/buyer/shop-composer-stable-360-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-038 — Commercial terms delay the mobile product list

A short fulfillment/minimum line precedes products; full shop details expand beneath them.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png) · [Evidence 3](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 4](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 5](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 6](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 7](../remediation/buyer/shop-list-stable-mobile.png) · [Evidence 8](../remediation/buyer/shop-composer-stable-360-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-039 — Shop message label opens an anchor

Browse products accurately describes the header anchor action.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png) · [Evidence 3](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 4](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 5](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 6](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 7](../remediation/buyer/shop-list-stable-mobile.png) · [Evidence 8](../remediation/buyer/shop-composer-stable-360-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-040 — Shop placeholders dominate mobile product cards

Shop phone product images are 96px tall, bringing the first product into the first screen.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png) · [Evidence 3](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 4](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 5](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 6](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 7](../remediation/buyer/shop-list-stable-mobile.png) · [Evidence 8](../remediation/buyer/shop-composer-stable-360-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-041 — Shop card wording differs from catalog

Shop cards share catalog THC colors, product-type normalization, price units, request labels and one stock statement.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls. Toggled List, opened quote-only Request pricing at360px, confirmed16px textarea, and dismissed without sending.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png) · [Evidence 3](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 4](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 5](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 6](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 7](../remediation/buyer/shop-list-stable-mobile.png) · [Evidence 8](../remediation/buyer/shop-composer-stable-360-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-042 — Commercial terms mix topics and repeat payment copy

Shop details separate minimum, reply window, fulfillment and direct payment facts.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png) · [Evidence 3](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 4](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 5](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 6](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 7](../remediation/buyer/shop-list-stable-mobile.png) · [Evidence 8](../remediation/buyer/shop-composer-stable-360-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-043 — Shop repeats product-list context

Products (count) is the single product-list context label.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop: compact terms, products near the top, contained shorter images, normalized product type, per-unit prices and full request controls.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png) · [Evidence 3](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 4](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 5](../remediation/buyer/shop-details-stable-desktop.png) · [Evidence 6](../remediation/buyer/shop-details-stable-mobile.png) · [Evidence 7](../remediation/buyer/shop-list-stable-mobile.png) · [Evidence 8](../remediation/buyer/shop-composer-stable-360-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-082 — Shop anchor hides its destination heading

Browse products anchor uses a mobile-header scroll offset.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Clicked Browse products; product heading lands below fixed mobile header. No application data changed. Product heading top95.75px versus fixed header65px.

**Evidence:** [Evidence 1](../remediation/buyer/shop-anchor-stable-mobile.png) · [Evidence 2](../remediation/buyer/shop-anchor-stable-mobile-viewport.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-083 — Shop action button reaches beyond card padding

Shop price has its own row above quantity/Add, preserving card padding.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile shop cards: separate price row and quantity/Add controls fully contained within card padding.

**Evidence:** [Evidence 1](../remediation/buyer/shop-stable-desktop.png) · [Evidence 2](../remediation/buyer/shop-stable-mobile.png)

**Files:** [app/dispensary/grower/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/page.tsx), [app/dispensary/grower/[id]/GrowerShopContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/grower/[id]/GrowerShopContent.tsx)

#### BUY-024 — Mobile order stats consume four rows

Order statistics use a two-column mobile grid.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

**Evidence:** [Evidence 1](../remediation/buyer/orders-stable-desktop.png) · [Evidence 2](../remediation/buyer/orders-stable-mobile.png)

**Files:** [app/dispensary/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-025 — Mobile order cards repeat labels and actions

Mobile orders are compact linked rows; legacy and current IDs retain distinguishable short labels.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

**Evidence:** [Evidence 1](../remediation/buyer/orders-stable-desktop.png) · [Evidence 2](../remediation/buyer/orders-stable-mobile.png)

**Files:** [app/dispensary/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-026 — Order page repeats its heading

Orders is the sole page heading; removed Request Tracker heading.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

**Evidence:** [Evidence 1](../remediation/buyer/orders-stable-desktop.png) · [Evidence 2](../remediation/buyer/orders-stable-mobile.png)

**Files:** [app/dispensary/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-027 — Order search placeholder is clipped

Search orders grows within the responsive filter row.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

**Evidence:** [Evidence 1](../remediation/buyer/orders-stable-desktop.png) · [Evidence 2](../remediation/buyer/orders-stable-mobile.png)

**Files:** [app/dispensary/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-028 — Order result count appears twice

A single result count accompanies pagination.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

**Evidence:** [Evidence 1](../remediation/buyer/orders-stable-desktop.png) · [Evidence 2](../remediation/buyer/orders-stable-mobile.png)

**Files:** [app/dispensary/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-029 — Order status wording differs across pages

Orders and dashboard use Awaiting response, In progress and Request value consistently.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile order list: two-column mobile stats, distinct shortened IDs, grower/date/value/status and one result count.

**Evidence:** [Evidence 1](../remediation/buyer/orders-stable-desktop.png) · [Evidence 2](../remediation/buyer/orders-stable-mobile.png)

**Files:** [app/dispensary/orders/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/page.tsx), [app/dispensary/components/OrdersTable.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/components/OrdersTable.tsx)

#### BUY-030 — Order status is repeated four times

Status remains in the heading; timeline and history are collapsed until requested.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

**Evidence:** [Evidence 1](../remediation/buyer/detail-stable-desktop.png) · [Evidence 2](../remediation/buyer/detail-stable-mobile.png) · [Evidence 3](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 4](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 5](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 6](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 7](../remediation/buyer/detail-withdraw-stable-desktop-viewport.png) · [Evidence 8](../remediation/buyer/detail-withdraw-stable-360-viewport.png) · [Evidence 9](../remediation/buyer/detail-message-stable-360-viewport.png)

**Files:** [app/dispensary/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/page.tsx), [app/dispensary/orders/[id]/OrderDetailActions.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/OrderDetailActions.tsx)

#### BUY-031 — Mobile timeline delays requested items

Expandable timeline keeps requested items near the top; shared timeline removes repeated stage/pending copy.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

**Evidence:** [Evidence 1](../remediation/buyer/detail-stable-desktop.png) · [Evidence 2](../remediation/buyer/detail-stable-mobile.png) · [Evidence 3](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 4](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 5](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 6](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 7](../remediation/buyer/detail-withdraw-stable-desktop-viewport.png) · [Evidence 8](../remediation/buyer/detail-withdraw-stable-360-viewport.png) · [Evidence 9](../remediation/buyer/detail-message-stable-360-viewport.png)

**Files:** [app/dispensary/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/page.tsx), [app/dispensary/orders/[id]/OrderDetailActions.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/OrderDetailActions.tsx)

#### BUY-032 — Buyer action copy is noisy and state-inaccurate

Only available buyer actions are shown; withdrawal consequences appear in confirmation.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved. Opened withdrawal confirmation at desktop/360px and canceled; no order mutation.

**Evidence:** [Evidence 1](../remediation/buyer/detail-stable-desktop.png) · [Evidence 2](../remediation/buyer/detail-stable-mobile.png) · [Evidence 3](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 4](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 5](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 6](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 7](../remediation/buyer/detail-withdraw-stable-desktop-viewport.png) · [Evidence 8](../remediation/buyer/detail-withdraw-stable-360-viewport.png) · [Evidence 9](../remediation/buyer/detail-message-stable-360-viewport.png)

**Files:** [app/dispensary/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/page.tsx), [app/dispensary/orders/[id]/OrderDetailActions.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/OrderDetailActions.tsx)

#### BUY-033 — Two message actions compete

One Message grower action opens an editable update draft for active requests.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved. Opened Message grower; confirmed the editable update draft, then cleared it and closed without sending.

**Evidence:** [Evidence 1](../remediation/buyer/detail-stable-desktop.png) · [Evidence 2](../remediation/buyer/detail-stable-mobile.png) · [Evidence 3](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 4](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 5](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 6](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 7](../remediation/buyer/detail-withdraw-stable-desktop-viewport.png) · [Evidence 8](../remediation/buyer/detail-withdraw-stable-360-viewport.png) · [Evidence 9](../remediation/buyer/detail-message-stable-360-viewport.png)

**Files:** [app/dispensary/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/page.tsx), [app/dispensary/orders/[id]/OrderDetailActions.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/OrderDetailActions.tsx)

#### BUY-034 — Request value is repeated

A single Total replaces duplicate item/request totals when there are no fees.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

**Evidence:** [Evidence 1](../remediation/buyer/detail-stable-desktop.png) · [Evidence 2](../remediation/buyer/detail-stable-mobile.png) · [Evidence 3](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 4](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 5](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 6](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 7](../remediation/buyer/detail-withdraw-stable-desktop-viewport.png) · [Evidence 8](../remediation/buyer/detail-withdraw-stable-360-viewport.png) · [Evidence 9](../remediation/buyer/detail-message-stable-360-viewport.png)

**Files:** [app/dispensary/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/page.tsx), [app/dispensary/orders/[id]/OrderDetailActions.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/OrderDetailActions.tsx)

#### BUY-035 — Export occupies a separate row

Export CSV is in the page header action group.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

**Evidence:** [Evidence 1](../remediation/buyer/detail-stable-desktop.png) · [Evidence 2](../remediation/buyer/detail-stable-mobile.png) · [Evidence 3](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 4](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 5](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 6](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 7](../remediation/buyer/detail-withdraw-stable-desktop-viewport.png) · [Evidence 8](../remediation/buyer/detail-withdraw-stable-360-viewport.png) · [Evidence 9](../remediation/buyer/detail-message-stable-360-viewport.png)

**Files:** [app/dispensary/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/page.tsx), [app/dispensary/orders/[id]/OrderDetailActions.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/OrderDetailActions.tsx)

#### BUY-036 — Neutral details use warning styling

Request details use neutral styling and Payment terms.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile request detail with compact header/actions, one Total, Export CSV and collapsed timeline/history; underlying role/status actions preserved.

**Evidence:** [Evidence 1](../remediation/buyer/detail-stable-desktop.png) · [Evidence 2](../remediation/buyer/detail-stable-mobile.png) · [Evidence 3](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 4](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 5](../remediation/buyer/detail-expanded-stable-desktop.png) · [Evidence 6](../remediation/buyer/detail-expanded-stable-mobile.png) · [Evidence 7](../remediation/buyer/detail-withdraw-stable-desktop-viewport.png) · [Evidence 8](../remediation/buyer/detail-withdraw-stable-360-viewport.png) · [Evidence 9](../remediation/buyer/detail-message-stable-360-viewport.png)

**Files:** [app/dispensary/orders/[id]/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/page.tsx), [app/dispensary/orders/[id]/OrderDetailActions.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/orders/[id]/OrderDetailActions.tsx)

#### BUY-050 — Saved header and tabs delay the first product

Saved uses a short heading, compact horizontal tabs and one sorting/view toolbar.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Saved at both widths and toggled named List/Grid controls; default list and quote-only Request pricing remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/saved-stable-desktop.png) · [Evidence 2](../remediation/buyer/saved-stable-mobile.png) · [Evidence 3](../remediation/buyer/saved-grid-stable-desktop.png) · [Evidence 4](../remediation/buyer/saved-grid-stable-mobile.png)

**Files:** [app/dispensary/saved/SavedContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/saved/SavedContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/favorites/FavoritesContent.tsx)

#### BUY-051 — Clear favorites is too prominent

Clear favorites moved into More and retains confirmation.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Opened More then Clear favorites at both widths; shared confirmation stays above navigation, traps focus and dismisses with Cancel/Escape. No favorites cleared.

**Evidence:** [Evidence 1](../remediation/buyer/saved-stable-desktop.png) · [Evidence 2](../remediation/buyer/saved-stable-mobile.png) · [Evidence 3](../remediation/buyer/favorites-clear-stable-desktop.png) · [Evidence 4](../remediation/buyer/favorites-clear-stable-mobile.png)

**Files:** [app/dispensary/saved/SavedContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/saved/SavedContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/favorites/FavoritesContent.tsx)

#### BUY-052 — Saved quote-only card repeats pricing guidance

Quote-only favorites show one Request pricing action without duplicated guidance.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Saved at both widths and toggled named List/Grid controls; default list and quote-only Request pricing remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/saved-stable-desktop.png) · [Evidence 2](../remediation/buyer/saved-stable-mobile.png) · [Evidence 3](../remediation/buyer/saved-grid-stable-desktop.png) · [Evidence 4](../remediation/buyer/saved-grid-stable-mobile.png)

**Files:** [app/dispensary/saved/SavedContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/saved/SavedContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/favorites/FavoritesContent.tsx)

#### BUY-053 — Sparse favorites grid wastes space

Favorites default to compact List; Grid remains available with shorter images.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Saved at both widths and toggled named List/Grid controls; default list and quote-only Request pricing remain readable.

**Evidence:** [Evidence 1](../remediation/buyer/saved-stable-desktop.png) · [Evidence 2](../remediation/buyer/saved-stable-mobile.png) · [Evidence 3](../remediation/buyer/saved-grid-stable-desktop.png) · [Evidence 4](../remediation/buyer/saved-grid-stable-mobile.png)

**Files:** [app/dispensary/saved/SavedContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/saved/SavedContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/favorites/FavoritesContent.tsx)

#### BUY-084 — Saved mobile view controls have no accessible names

Saved view controls have Grid view/List view labels and pressed states.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Toggled accessible Grid view and List view controls; pressed state and visible card layout changed correctly.

**Evidence:** [Evidence 1](../remediation/buyer/saved-stable-desktop.png) · [Evidence 2](../remediation/buyer/saved-stable-mobile.png) · [Evidence 3](../remediation/buyer/saved-grid-stable-desktop.png) · [Evidence 4](../remediation/buyer/saved-grid-stable-mobile.png)

**Files:** [app/dispensary/saved/SavedContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/saved/SavedContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/favorites/FavoritesContent.tsx)

#### BUY-088 — Saved mobile list view overlaps product text

Saved list has readable thumbnail/identity and separate mobile price/actions rows.

**Verified:** Scoped ESLint passed after this implementation batch.; Initial fix visually inspected; final repeat and focused geometry regression remain pending.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected default Saved list at 1440/390/360px: product identity is readable and quote request/message/remove controls occupy a separate mobile row.; Final regression: relevant clipping/geometry, layering or action-reachability check passed in tests/buyer-ui-layout-regressions.spec.ts (five of five passed, root run).

**Evidence:** [Evidence 1](../remediation/buyer/saved-stable-desktop.png) · [Evidence 2](../remediation/buyer/saved-stable-mobile.png) · [Evidence 3](../remediation/buyer/saved-list-stable-360.png)

**Files:** [app/dispensary/saved/SavedContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/saved/SavedContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/favorites/FavoritesContent.tsx)

#### BUY-054 — Alert summary delays the first mobile product

Alerts use compact Saved tabs and a single toolbar above the first product.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

**Evidence:** [Evidence 1](../remediation/buyer/alerts-stable-desktop.png) · [Evidence 2](../remediation/buyer/alerts-stable-mobile.png)

**Files:** [app/dispensary/price-alerts/PriceAlertsContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/price-alerts/PriceAlertsContent.tsx)

#### BUY-055 — Alert counts appear three times

Alert counts appear once in Active and Triggered tabs.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

**Evidence:** [Evidence 1](../remediation/buyer/alerts-stable-desktop.png) · [Evidence 2](../remediation/buyer/alerts-stable-mobile.png)

**Files:** [app/dispensary/price-alerts/PriceAlertsContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/price-alerts/PriceAlertsContent.tsx)

#### BUY-056 — Alert cards repeat target price and units

Current and target per-unit prices are paired; removed repeated unit/target badges.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

**Evidence:** [Evidence 1](../remediation/buyer/alerts-stable-desktop.png) · [Evidence 2](../remediation/buyer/alerts-stable-mobile.png)

**Files:** [app/dispensary/price-alerts/PriceAlertsContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/price-alerts/PriceAlertsContent.tsx)

#### BUY-057 — Manual price-check explanation needs shorter copy

Manual-check copy is one line; Refresh remains visible and Clear alerts is under More.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Active alerts at both widths: compact tabs/toolbar, one pair of per-unit prices and manually refreshed-state wording.

**Evidence:** [Evidence 1](../remediation/buyer/alerts-stable-desktop.png) · [Evidence 2](../remediation/buyer/alerts-stable-mobile.png)

**Files:** [app/dispensary/price-alerts/PriceAlertsContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/price-alerts/PriceAlertsContent.tsx)

#### BUY-085 — Mobile alert icons have no accessible names

Alert Refresh, More, delete and mark-seen actions have accessible names.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected named Refresh, More, delete and clear actions; opened Clear alerts confirmation and canceled. Mark-seen naming reviewed in source because the fixture has no triggered alert. No alerts changed.

**Evidence:** [Evidence 1](../remediation/buyer/alerts-stable-desktop.png) · [Evidence 2](../remediation/buyer/alerts-stable-mobile.png) · [Evidence 3](../remediation/buyer/alerts-menu-stable-mobile.png)

**Files:** [app/dispensary/price-alerts/PriceAlertsContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/price-alerts/PriceAlertsContent.tsx)

#### BUY-086 — Triggered-alert empty state repeats instructions

Triggered empty state is compact; View active alerts switches to Active.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected compact Triggered empty state at both widths; View active alerts switches to Active and restores the product list.

**Evidence:** [Evidence 1](../remediation/buyer/alerts-triggered-stable-desktop.png) · [Evidence 2](../remediation/buyer/alerts-triggered-stable-mobile.png)

**Files:** [app/dispensary/price-alerts/PriceAlertsContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/price-alerts/PriceAlertsContent.tsx)

#### BUY-087 — Alert History lacks dates or events

The combined alert tab is correctly named All.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected accurately named All tab beside counted Active and Triggered tabs; combined-list behavior preserved.

**Evidence:** [Evidence 1](../remediation/buyer/alerts-stable-desktop.png) · [Evidence 2](../remediation/buyer/alerts-stable-mobile.png)

**Files:** [app/dispensary/price-alerts/PriceAlertsContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/price-alerts/PriceAlertsContent.tsx)

#### BUY-058 — Recent tab repeats its purpose and metadata

Recent products omit repeated intro copy and use compact grower/count/date metadata and unit notation.

**Verified:** Scoped ESLint passed after this implementation batch.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected Recent at both widths: grower/count/date metadata on one compact line with price per unit and retained navigation actions.

**Evidence:** [Evidence 1](../remediation/buyer/recent-stable-desktop.png) · [Evidence 2](../remediation/buyer/recent-stable-mobile.png)

**Files:** [app/dispensary/saved/SavedContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/saved/SavedContent.tsx), [app/dispensary/favorites/FavoritesContent.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/favorites/FavoritesContent.tsx)

#### BUY-044 — Desktop branding card stretches into empty space

Branding fits its content while business fields use a two-column desktop layout.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

**Evidence:** [Evidence 1](../remediation/buyer/settings-stable-desktop.png) · [Evidence 2](../remediation/buyer/settings-stable-mobile.png)

**Files:** [app/dispensary/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/page.tsx), [app/dispensary/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/components/SettingsForm.tsx)

#### BUY-045 — Complete account still receives setup instructions

Completed accounts show Verified through; setup guidance is conditional on missing required fields.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

**Evidence:** [Evidence 1](../remediation/buyer/settings-stable-desktop.png) · [Evidence 2](../remediation/buyer/settings-stable-mobile.png)

**Files:** [app/dispensary/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/page.tsx), [app/dispensary/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/components/SettingsForm.tsx)

#### BUY-046 — License fields are grouped under the wrong section

License number, state and expiry controls moved into License & verification with existing validation intact.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

**Evidence:** [Evidence 1](../remediation/buyer/settings-stable-desktop.png) · [Evidence 2](../remediation/buyer/settings-stable-mobile.png)

**Files:** [app/dispensary/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/page.tsx), [app/dispensary/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/components/SettingsForm.tsx)

#### BUY-047 — Settings labels repeat account context

Settings and field labels omit redundant dispensary/business prefixes.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

**Evidence:** [Evidence 1](../remediation/buyer/settings-stable-desktop.png) · [Evidence 2](../remediation/buyer/settings-stable-mobile.png)

**Files:** [app/dispensary/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/page.tsx), [app/dispensary/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/components/SettingsForm.tsx)

#### BUY-048 — Persistent footer repeats draft and shortcut guidance

Save bars show relevant Saving, Unsaved changes or Saved status; removed persistent browser/keyboard instructions.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

**Evidence:** [Evidence 1](../remediation/buyer/settings-stable-desktop.png) · [Evidence 2](../remediation/buyer/settings-stable-mobile.png)

**Files:** [app/dispensary/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/page.tsx), [app/dispensary/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/components/SettingsForm.tsx)

#### BUY-049 — Sign-out action lacks a visible label

Account offers a visibly labelled Sign out button.

**Verified:** Scoped ESLint passed.; Reviewed preserved data contracts, event handlers, validation and authorization; changes are UI composition, display labels and nonoverlapping status counts.; Rendered verification: Inspected desktop/mobile settings: license fields match their section, branding fits content, two-column desktop fields and labelled Sign out; no profile changes submitted.

**Evidence:** [Evidence 1](../remediation/buyer/settings-stable-desktop.png) · [Evidence 2](../remediation/buyer/settings-stable-mobile.png)

**Files:** [app/dispensary/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/page.tsx), [app/dispensary/settings/components/SettingsForm.tsx](/Users/sam/dev/phenofarm-mvp/app/dispensary/settings/components/SettingsForm.tsx)


### admin

#### A02 — Standardize business-role names

Admin navigation, headings, actions, and seed results consistently use Growers and Dispensaries.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-dashboard-desktop.png) · [Evidence 2](../remediation/public-admin/admin-dashboard-mobile.png)

**Files:** [app/admin/layout.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/layout.tsx), [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx), [app/admin/components/SeedDataButton.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/components/SeedDataButton.tsx)

#### A08 — Compact mobile metric cards

Three compact mobile count cards share one row. Nonessential arrows hide on mobile; 12px labels and full-card links remain readable.

**Verified:** Final 1440/390/360px screenshots inspected; three metric cards stay on one row.; Shared compact card uses mutually exclusive display/padding classes.; Lint/build passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_dashboard-1440.png) · [Evidence 2](../remediation/root/_admin_dashboard-390.png) · [Evidence 3](../remediation/root/_admin_dashboard-360.png)

**Files:** [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx), [app/components/ui/StatCard.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/StatCard.tsx)

#### A09 — Collapse completed checklist items

Dashboard shows pending checklist work and collapses completed checks behind a single summary disclosure.

**Verified:** Final dashboard screenshot inspected; pending work is visible and three completed checks are collapsed.; Lint/build passed.

**Evidence:** [Evidence 1](../remediation/final-pages/_admin_dashboard-1440.png) · [Evidence 2](../remediation/final-pages/_admin_dashboard-390.png)

**Files:** [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx), [app/components/ux/SetupChecklist.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ux/SetupChecklist.tsx)

#### A10 — Shrink the clear verification queue

The clear verification queue uses one short status and directory links, without the repeated queue heading.

**Verified:** Final 1440/390/360px screenshots inspected; three metric cards stay on one row.; Shared compact card uses mutually exclusive display/padding classes.; Lint/build passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_dashboard-1440.png) · [Evidence 2](../remediation/root/_admin_dashboard-390.png) · [Evidence 3](../remediation/root/_admin_dashboard-360.png)

**Files:** [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx)

#### A11 — Move standing business-model explanation

The standing settlement explanation is replaced by one Settlement & billing policy link.

**Verified:** Final 1440/390/360px screenshots inspected; three metric cards stay on one row.; Shared compact card uses mutually exclusive display/padding classes.; Lint/build passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_dashboard-1440.png) · [Evidence 2](../remediation/root/_admin_dashboard-390.png) · [Evidence 3](../remediation/root/_admin_dashboard-360.png)

**Files:** [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx)

#### A12 — Simplify development-only seeding panel

Dev-only seed tools are behind one collapsed Developer tools row with one action; production guard remains.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-dashboard-desktop.png) · [Evidence 2](../remediation/public-admin/admin-dashboard-mobile.png)

**Files:** [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx), [app/admin/components/SeedDataButton.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/components/SeedDataButton.tsx)

#### A13 — Make dashboard counts match destinations

Dashboard dispensary counts and pending counts use the same platform-account scope as the directory; grower query remains schema-valid.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-dashboard-desktop.png) · [Evidence 2](../remediation/public-admin/admin-dashboard-mobile.png)

**Files:** [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx)

#### A07 — Make confirmation wording specific

Verification confirmations name the action and preserve a square, top-aligned icon. Dialogs portal above navigation, focus Cancel initially and close with Escape.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/admin-confirm-1440.png) · [Evidence 2](../remediation/root/admin-confirm-390.png) · [Evidence 3](../remediation/root/admin-confirm-360.png)

**Files:** [app/admin/components/ConfirmActionButton.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/components/ConfirmActionButton.tsx), [app/admin/dispensaries/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dispensaries/page.tsx), [app/components/ui/ConfirmDialog.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/ConfirmDialog.tsx), [app/admin/growers/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/growers/page.tsx)

#### A16 — Remove repeated ordering-policy copy

Dispensary rows use compact Can order / License review states and keep settlement guidance outside each row.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-dispensaries-mobile.png) · [Evidence 2](../remediation/public-admin/admin-dispensaries-desktop.png)

**Files:** [app/admin/dispensaries/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dispensaries/page.tsx)

#### A17 — Give business and license identifiers enough room

Normal expiry dates are plain dates, identifier cells are nowrap, and exception dates retain badges.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-dispensaries-desktop.png) · [Evidence 2](../remediation/public-admin/admin-dispensaries-mobile.png)

**Files:** [app/admin/components/LicenseExpiryBadge.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/components/LicenseExpiryBadge.tsx), [app/admin/dispensaries/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dispensaries/page.tsx)

#### A18 — Delay wide table/header layout at tablet widths

Business directories switch to cards below 1280px; tablet controls stack without clipping.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_growers-390.png) · [Evidence 2](../remediation/root/_admin_growers-1440.png)

**Files:** [app/admin/growers/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/growers/page.tsx), [app/admin/dispensaries/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dispensaries/page.tsx), [app/admin/components/AdminVerificationFilters.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/components/AdminVerificationFilters.tsx)

#### A04 — Mobile directory controls consume too many rows

Directory search and Search share one row; status/counts sit together below, with full usable controls.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_growers-390.png) · [Evidence 2](../remediation/root/_admin_users-390.png)

**Files:** [app/admin/components/AdminVerificationFilters.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/components/AdminVerificationFilters.tsx)

#### A15 — Use compact verification metadata

Grower mobile cards place plan beside verification and tighten metadata while retaining license exceptions.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-growers-mobile.png) · [Evidence 2](../remediation/public-admin/admin-growers-desktop.png)

**Files:** [app/admin/growers/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/growers/page.tsx)

#### A06 — Reduce navigation grouping and empty notification controls

The five-item admin menu omits category labels, and empty notifications omit unread/actions.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_settings-1440.png)

**Files:** [app/admin/layout.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/layout.tsx), [app/grower/components/ClientNav.tsx](/Users/sam/dev/phenofarm-mvp/app/grower/components/ClientNav.tsx), [app/components/ui/MobileNav.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/MobileNav.tsx), [app/components/notifications/NotificationBell.tsx](/Users/sam/dev/phenofarm-mvp/app/components/notifications/NotificationBell.tsx)

#### A19 — Remove implementation commentary and obvious labels

Settings copy now focuses on billing, support, and policy state without implementation history or platform identity.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-settings-desktop.png) · [Evidence 2](../remediation/public-admin/admin-settings-mobile.png)

**Files:** [app/admin/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/settings/page.tsx)

#### A20 — Stop stretching the short support card

Settings grid aligns cards to content height so Support does not stretch to billing height.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-settings-desktop.png) · [Evidence 2](../remediation/public-admin/admin-settings-mobile.png)

**Files:** [app/admin/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/settings/page.tsx)

#### A21 — Use one compact status per billing item

One fit-content billing status sits beside each label at all widths.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_settings-390.png) · [Evidence 2](../remediation/root/_admin_settings-1440.png)

**Files:** [app/admin/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/settings/page.tsx)

#### A22 — Consolidate setup and settlement guidance

Settings retains one setup instruction and one settlement policy; repeated bottom guidance was removed.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-settings-desktop.png) · [Evidence 2](../remediation/public-admin/admin-settings-mobile.png)

**Files:** [app/admin/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/settings/page.tsx)

#### A23 — Prioritize setup issues and flatten policy cards

Missing provider configuration appears first. Configured checks collapse into a summary; policy rows reveal detailed reference copy on demand.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_settings-390.png) · [Evidence 2](../remediation/root/_admin_settings-1440.png)

**Files:** [app/admin/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/settings/page.tsx)

#### A01 — Shorten admin headings and introductions

Concise admin titles use 28px mobile headings and 36px desktop headings.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_users-390.png) · [Evidence 2](../remediation/root/_admin_growers-390.png) · [Evidence 3](../remediation/root/_admin_settings-390.png)

**Files:** [app/admin/users/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/users/page.tsx), [app/admin/growers/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/growers/page.tsx), [app/admin/dispensaries/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dispensaries/page.tsx), [app/admin/settings/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/settings/page.tsx), [app/admin/dashboard/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dashboard/page.tsx), [app/components/ui/PageHeader.tsx](/Users/sam/dev/phenofarm-mvp/app/components/ui/PageHeader.tsx)

#### A03 — Search placeholders clip on desktop

Directory placeholders now use concise Email or business / Business or license copy.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-users-desktop.png) · [Evidence 2](../remediation/public-admin/admin-growers-desktop.png) · [Evidence 3](../remediation/public-admin/admin-dispensaries-desktop.png)

**Files:** [app/admin/users/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/users/page.tsx), [app/admin/components/AdminVerificationFilters.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/components/AdminVerificationFilters.tsx)

#### A05 — Simplify directory result counts

Unfiltered counts use correct singular/plural; filtered counts keep the true matching total across pages.

**Verified:** Final desktop/mobile visual inspection.; 35 admin geometry, responsive table, heading, badge and confirmation checks passed at 1440, 1024, 768, 390 and 360px.; Lint/build passed; admin access, pagination and redirect regression checks passed.

**Evidence:** [Evidence 1](../remediation/root/_admin_growers-390.png) · [Evidence 2](../remediation/root/_admin_users-390.png)

**Files:** [app/admin/users/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/users/page.tsx), [app/admin/growers/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/growers/page.tsx), [app/admin/dispensaries/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/dispensaries/page.tsx)

#### A14 — Tighten sparse mobile account rows

Mobile user rows are compact and omit inapplicable business and verification fields for administrators.

**Verified:** Fresh authenticated desktop/mobile render captured and inspected on localhost:3144.; npx eslint app/admin app/landing app/auth app/contact app/help app/legal passed.

**Evidence:** [Evidence 1](../remediation/public-admin/admin-users-mobile.png) · [Evidence 2](../remediation/public-admin/admin-users-desktop.png)

**Files:** [app/admin/users/page.tsx](/Users/sam/dev/phenofarm-mvp/app/admin/users/page.tsx)

