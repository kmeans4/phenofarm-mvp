# PhenoFarm — two-pass UI review

17 September 2026 · 216 findings · 9 high / 120 medium / 87 low

PhenoFarm supports grower catalogs, inventory, strains and batches, buyer discovery and request drafts, quotes and fulfillment, direct business settlement records, subscriptions, and account verification.

The review covers all 48 pages and 5 redirect routes. Every page received two fresh rendered passes at 1440×1000 and 390×844, with additional menus, dialogs, tab states and selected 360/1024 px checks. Animated sections were also reviewed after scrolling. Page coverage and screenshot evidence are linked below.

This reviews the current local app using an isolated copy of the local database and sample records. Controls and drafts were inspected without submitting business transactions. Production and end-to-end payment behavior were outside this UI review. METRC-specific items are excluded. Application code was not changed.

The total counts page-specific observations; recurring patterns can appear on more than one page. No additional finding on a page means no additional issue within this review focus and the inspected states.

High means hidden/broken actions or materially misleading displayed information; Medium means significant layout, navigation or repeated-content cost; Low means copy or visual polish. Recommendations preserve business facts, usable controls and readable text.

## Overall direction

- Put the work first: show search, products, requests and editable fields before static explanations.
- State the subscription/direct-settlement boundary once in each relevant flow; retain it where it prevents payment confusion.
- Use compact mobile grids and rows before reducing text. Most app body text is already 12–14 px; inputs should remain readable and touch targets usable.
- Use concise labels such as Reports, Plans, Add product, Delivered value, 30d, 90d and 12mo, with full accessible names where abbreviations could be ambiguous.
- Keep warnings, lab information, prices, units and verification exceptions explicit. Empty space from a short data set is not itself a defect.
- Fix clipped controls, obscured dialogs and misleading values before polishing copy.

## Highest-priority findings

- **G28 — Repair the batch list render failure** (/grower/batches).
- **G29 — Keep harvest dates consistent** (/grower/batches, /grower/batches/[id]/edit).
- **G16 — Show the saved unit in the edit form** (/grower/products/[id]/edit).
- **E05 — Correct the month displayed on the trend** (/grower/reports).
- **BUY-079 — Mobile review dialog clips submission and back actions** (/dispensary/cart).
- **BUY-066 — Open desktop filters clip product action controls** (/dispensary/catalog).
- **BUY-075 — Comparison dialog sits behind navigation** (/dispensary/catalog).
- **BUY-092 — Catalog mobile list hides prices and Add buttons** (/dispensary/catalog).
- **BUY-088 — Saved mobile list view overlaps product text** (/dispensary/saved, /dispensary/saved?tab=favorites, /dispensary/favorites).

## Page-by-page coverage

[Open the screenshot coverage table](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/page-coverage.md). Every page below was reviewed in both desktop and mobile passes. Shared controls and alternate states are listed in the area notes.

| Page | Assessment | Findings |
|---|---|---|
| `/admin/dashboard` | Density or clarity improvements | A02, A08, A09, A10, A11, A12, A13 |
| `/admin/dispensaries` | Density or clarity improvements | A07, A16, A17, A18 |
| `/admin/growers` | Density or clarity improvements | A04, A15 |
| `/admin` | Redirect checked | — |
| `/admin/settings` | Density or clarity improvements | A06, A19, A20, A21, A22, A23 |
| `/admin/users` | Density or clarity improvements | A01, A03, A05, A14 |
| `/auth/error` | Density or clarity improvements | PUB-014, PUB-015 |
| `/auth/sign_in` | Density or clarity improvements | PUB-011 |
| `/auth/sign_up` | Density or clarity improvements | PUB-012, PUB-013 |
| `/contact` | Density or clarity improvements | PUB-005, PUB-006 |
| `/dashboard` | Redirect checked | — |
| `/dispensary/cart` | Action or data-display issue | BUY-014, BUY-015, BUY-016, BUY-017, BUY-018, BUY-019, BUY-020, BUY-021, BUY-022, BUY-023, BUY-078, BUY-079, BUY-080, BUY-081 |
| `/dispensary/catalog` | Action or data-display issue | BUY-007, BUY-008, BUY-009, BUY-010, BUY-011, BUY-012, BUY-013, BUY-065, BUY-066, BUY-067, BUY-068, BUY-069, BUY-070, BUY-071, BUY-072, BUY-073, BUY-074, BUY-075, BUY-076, BUY-077, BUY-092 |
| `/dispensary/dashboard` | Density or clarity improvements | BUY-001, BUY-002, BUY-003, BUY-004, BUY-005, BUY-006 |
| `/dispensary/favorites` | Redirect checked | BUY-050, BUY-051, BUY-052, BUY-053, BUY-084, BUY-088 |
| `/dispensary/grower/[id]` | Density or clarity improvements | BUY-037, BUY-038, BUY-039, BUY-040, BUY-041, BUY-042, BUY-043, BUY-082, BUY-083 |
| `/dispensary/orders/[id]` | Density or clarity improvements | BUY-030, BUY-031, BUY-032, BUY-033, BUY-034, BUY-035, BUY-036 |
| `/dispensary/orders` | Density or clarity improvements | BUY-024, BUY-025, BUY-026, BUY-027, BUY-028, BUY-029 |
| `/dispensary/price-alerts` | Redirect checked | BUY-054, BUY-055, BUY-056, BUY-057, BUY-085, BUY-086, BUY-087 |
| `/dispensary/saved` | Action or data-display issue | BUY-050, BUY-051, BUY-052, BUY-053, BUY-084, BUY-088, BUY-054, BUY-055, BUY-056, BUY-057, BUY-085, BUY-086, BUY-087, BUY-058 |
| `/dispensary/settings` | Density or clarity improvements | BUY-044, BUY-045, BUY-046, BUY-047, BUY-048, BUY-049 |
| `/grower/batches/[id]/edit` | Action or data-display issue | G29, G33, G34, G35 |
| `/grower/batches/add` | Density or clarity improvements | G31, G32 |
| `/grower/batches` | Action or data-display issue | G28, G29, G30 |
| `/grower/catalog` | Density or clarity improvements | G05, G06, G07 |
| `/grower/customers/[id]/edit` | Density or clarity improvements | G54, G55 |
| `/grower/customers/[id]/statement` | Density or clarity improvements | G56, G57 |
| `/grower/customers/add` | Density or clarity improvements | G53 |
| `/grower/customers` | Density or clarity improvements | G51, G52 |
| `/grower/dashboard` | Density or clarity improvements | G01, G02, G03, G04, G58, G59, G60, G61, G62, G63 |
| `/grower/inventory/add` | Density or clarity improvements | G22 |
| `/grower/inventory` | Density or clarity improvements | G19, G20, G21 |
| `/grower/marketplace` | Density or clarity improvements | E19, E20, E21, E22 |
| `/grower/orders/[id]/edit` | Density or clarity improvements | G49, G50 |
| `/grower/orders/[id]` | Density or clarity improvements | G45, G46, G47, G48 |
| `/grower/orders/add` | Density or clarity improvements | G41, G42, G43, G44 |
| `/grower/orders/history` | Density or clarity improvements | G39, G40 |
| `/grower/orders` | Density or clarity improvements | G36, G37, G38 |
| `/grower` | Redirect checked | — |
| `/grower/pricing` | Density or clarity improvements | E08, E09, E10, E11 |
| `/grower/products/[id]/edit` | Action or data-display issue | G16, G17, G18 |
| `/grower/products/add` | Density or clarity improvements | G12, G13, G14, G15 |
| `/grower/products` | Density or clarity improvements | G08, G09, G10, G11 |
| `/grower/reports` | Action or data-display issue | E01, E02, E03, E04, E05, E06, E07 |
| `/grower/settings` | Density or clarity improvements | E12, E13, E14, E15, E16, E17, E18 |
| `/grower/strains/[id]/edit` | Density or clarity improvements | G27 |
| `/grower/strains/add` | Density or clarity improvements | G25, G26 |
| `/grower/strains` | Density or clarity improvements | G23, G24 |
| `/help` | Density or clarity improvements | PUB-004 |
| `/legal/cookies` | Density or clarity improvements | PUB-009, PUB-010 |
| `/legal/privacy` | Density or clarity improvements | PUB-007 |
| `/legal/terms` | Density or clarity improvements | PUB-008 |
| `/` | Density or clarity improvements | PUB-003, PUB-016, PUB-017 |

## Page-by-page findings

### /

**PUB-003 · Low · Mobile hero repeats the settlement promise**

The hero supporting paragraph takes five mobile lines and repeats the direct-settlement/no-take-rate idea that appears again in the hero footnote and later sections.

**Suggested change:** Shorten “Verified partners, recorded quotes, and live request tracking from submission to delivery — while settlement moves directly between businesses. PhenoFarm never takes a cut.” to “Verified partners, recorded quotes, and live request tracking — while settlement stays direct. PhenoFarm takes no cut.”

**Checked:** 390x844. Pass 2 rechecked the hero at mobile width; the paragraph remains the same five-line block and no clipping occurs.

Evidence: [home-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/home-mobile.png) · [home-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/home-mobile.png)

**PUB-016 · Low · Testimonial-to-pricing transition has excess vertical space**

After the final testimonial cards and the “Illustrative customer scenarios.” disclaimer, the Pricing eyebrow sits after a low-content transition of roughly 300px on desktop and 240px on mobile. The content is fully rendered; the issue is the repeated section padding at this boundary.

**Suggested change:** Reduce the shared bottom padding after testimonials or top padding before pricing by roughly 25–35%, keeping a deliberate but shorter transition before the pricing heading.

**Checked:** 1440x1000 and 390x844. Pass 1 and Pass 2 show the same settled transition at both widths; all testimonials and the pricing heading are visible, so this replaces the withdrawn missing-content gap claim with a narrower spacing observation.

Evidence: [y04200](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass1/desktop/y04200.png) · [y04200](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass2/desktop/y04200.png) · [y05664](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass1/mobile/y05664.png) · [y05664](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass2/mobile/y05664.png)

**PUB-017 · Low · Mobile footer repeats Privacy and Terms links**

The mobile footer stacks the Growers, Dispensaries, and Company groups into a long single column. Company includes “Privacy policy” and “Terms of service”, then the bottom legal row repeats those destinations as “Privacy” and “Terms” alongside “Cookies”.

**Suggested change:** Keep Contact and Help center in the Company group, remove the duplicate Privacy policy and Terms of service entries there, and retain one compact bottom row for Privacy, Terms, and Cookies.

**Checked:** 390x844. Pass 1 and Pass 2 show the same one-column footer density and repeated policy destinations at 390x844.

Evidence: [y09912](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass1/mobile/y09912.png) · [y10319](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass1/mobile/y10319.png) · [y09912](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass2/mobile/y09912.png) · [y10319](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/settled/pass2/mobile/y10319.png)

### /auth/error?error=Configuration

**PUB-014 · Low · Configuration error repeats marketing copy**

Both desktop error states reuse the same long marketing panel (“Get back into your marketplace workspace.”), the same two-sentence support explanation, and the same three bullets. The right cards correctly distinguish configuration from credential failure, so the repeated left panel is the remaining copy weight.

**Suggested change:** Use a shorter shared panel such as “Need access? We can help.” with one concise support line, leaving the specific error title and red message on the right.

**Checked:** 1440x1000. Pass 2 rechecked both error states and their back-to-sign-in/contact-support actions; mobile cards remain concise and clear.

Evidence: [error-configuration-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/error-configuration-desktop.png) · [error-configuration-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/error-configuration-desktop.png)

### /auth/error?error=CredentialsSignin

**PUB-015 · Low · Credentials error repeats marketing copy**

Both desktop error states reuse the same long marketing panel (“Get back into your marketplace workspace.”), the same two-sentence support explanation, and the same three bullets. The right cards correctly distinguish configuration from credential failure, so the repeated left panel is the remaining copy weight.

**Suggested change:** Use a shorter shared panel such as “Need access? We can help.” with one concise support line, leaving the specific error title and red message on the right.

**Checked:** 1440x1000. Pass 2 rechecked both error states and their back-to-sign-in/contact-support actions; mobile cards remain concise and clear.

Evidence: [error-credentials-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/error-credentials-desktop.png) · [error-credentials-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/error-credentials-desktop.png)

### /auth/sign_in

**PUB-011 · Low · Sign-in marketing panel is overlong**

The desktop marketing panel uses a long three-line headline, “Wholesale cannabis workflows without payment confusion.”, while the adjacent form already establishes sign-in context and the supporting paragraph repeats workflow/payment language.

**Suggested change:** Shorten the marketing headline to “Wholesale workflows, without payment confusion.” and trim the paragraph to one sentence. Keep the marketing panel hidden on mobile as it is today.

**Checked:** 1440x1000. Pass 2 rechecked the desktop form and password-visibility state; controls remain aligned and the mobile form remains focused without the marketing panel.

Evidence: [sign-in-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/sign-in-desktop.png) · [sign-in-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/sign-in-desktop.png)

### /auth/sign_up

**PUB-012 · Low · Sign-up marketing panel repeats the form promise**

The desktop marketing panel headline “Build a verified marketplace profile in one pass.” and the paragraph beginning “Create one account...” repeat the same account-creation promise already shown by the form heading.

**Suggested change:** Use “Build your verified profile.” for the marketing headline and keep the paragraph focused on the two workflows: “One account covers grower catalog or dispensary buying workflows.”

**Checked:** 1440x1000. Pass 2 rechecked the desktop role selection and password visibility state; the form remains readable and the additional dispensary guidance fits.

Evidence: [sign-up-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/sign-up-desktop.png) · [sign-up-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/sign-up-desktop.png) · [sign-up-desktop-dispensary-password-visible](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/sign-up-desktop-dispensary-password-visible.png)

**PUB-013 · Low · Mobile sign-up disclosure wraps awkwardly**

The mobile legal disclosure wraps into two centered lines with a large gap created by the line break: “By signing up, you agree to our Terms of Service” followed by “and Privacy Policy.”

**Suggested change:** Shorten the copy to “By signing up, you agree to the Terms and Privacy Policy.” while retaining both links inline.

**Checked:** 390x844. Pass 2 rechecked the default grower and selected dispensary states; the disclosure remains readable and does not overflow.

Evidence: [sign-up-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/sign-up-mobile.png) · [sign-up-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/sign-up-mobile.png) · [sign-up-mobile-dispensary-password-visible](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/sign-up-mobile-dispensary-password-visible.png)

### /contact

**PUB-005 · Medium · Mobile contact form starts below a long preamble**

The mobile title wraps to three lines, followed by a four-line intro and three information cards before the form begins at roughly y=843px. The form is usable, but the primary contact action is pushed below a long preamble.

**Suggested change:** Shorten the title to “Talk about wholesale workflows” and move the email contact card beside or immediately below the intro, before the location and policy cards. Keep the full form lower on the page.

**Checked:** 390x844. Pass 2 confirmed the same 1,670px page height and form start position; no horizontal overflow or control clipping was found.

Evidence: [contact-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/contact-mobile.png) · [contact-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/contact-mobile.png)

**PUB-006 · Low · Contact helper copy is longer than needed**

The form helper text “Your draft will include these details so support can route the conversation quickly.” is longer than needed and repeats the surrounding support-routing context.

**Suggested change:** Use “These details help support route your request.”

**Checked:** 1440x1000 and 390x844. Pass 1 and Pass 2 show the same helper copy in both layouts; field labels and the email-draft action remain clear.

Evidence: [contact-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/contact-desktop.png) · [contact-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/contact-mobile.png) · [contact-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/contact-desktop.png) · [contact-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/contact-mobile.png)

### /help

**PUB-004 · Low · Help intro repeats the page purpose**

The “HELP CENTER” eyebrow, “Practical answers for licensed marketplace teams.” heading, and explanatory paragraph all communicate the same page purpose before the question groups begin.

**Suggested change:** Use “Marketplace help” as the heading and “Verification, requests, quotes, settlement, and subscriptions.” as the intro, or keep the current heading and remove the eyebrow. This trims the opening copy without removing context.

**Checked:** 1440x1000 and 390x844. Pass 1 and Pass 2 show the same three-layer intro at both widths; opened disclosures still retain clear context.

Evidence: [help-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/help-desktop.png) · [help-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/help-mobile.png) · [help-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/help-desktop.png) · [help-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/help-mobile.png)

### /legal/cookies

**PUB-009 · Medium · Cookie draft status is duplicated**

The hero warning and first Draft status card repeat the same pre-launch/counsel-review state before the cookie content starts. The mobile version is 3,188px tall, so the duplicate has a noticeable scroll cost.

**Suggested change:** Keep one concise hero warning, remove the duplicate Draft status card, and let Contents lead into “Cookies and storage.”

**Checked:** 1440x1000 and 390x844. Pass 2 rechecked the top and bottom sections at both widths; the duplicate remains, while all legal content stays readable.

Evidence: [cookies-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/cookies-desktop.png) · [cookies-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/cookies-mobile.png) · [cookies-desktop-bottom](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/cookies-desktop-bottom.png) · [cookies-mobile-bottom](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/cookies-mobile-bottom.png)

**PUB-010 · Low · Cookie section heading is wordy**

The section heading “What cookies and storage are” reads like a question fragment and is longer than the neighboring noun-based section headings.

**Suggested change:** Rename it to “Cookies and storage.”

**Checked:** 1440x1000 and 390x844. Pass 1 and Pass 2 show the same heading at both widths; the section body remains legible.

Evidence: [cookies-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/cookies-desktop.png) · [cookies-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/cookies-mobile.png) · [cookies-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/cookies-desktop.png) · [cookies-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/cookies-mobile.png)

### /legal/privacy

**PUB-007 · Medium · Privacy draft status is duplicated**

The hero warning identifies a pre-launch draft pending counsel review, then the first body card repeats the same draft-status message before substantive policy content. On mobile this adds a full card before “Information we collect.”

**Suggested change:** Keep one concise hero warning, such as “Pre-launch draft for counsel review.”, and remove the duplicate Draft status body card so Contents leads directly to “Information we collect.”

**Checked:** 1440x1000 and 390x844. Pass 2 rechecked the top and lower sections at both widths; legal sections remain readable and the duplicate is still present.

Evidence: [privacy-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/privacy-desktop.png) · [privacy-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/privacy-mobile.png) · [privacy-desktop-bottom](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/privacy-desktop-bottom.png) · [privacy-mobile-bottom](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/privacy-mobile-bottom.png)

### /legal/terms

**PUB-008 · Medium · Terms draft status is duplicated**

The hero warning and the first Draft status card repeat the pre-launch/counsel-review message before “Eligible users.” The repetition adds vertical weight to an already long mobile legal page.

**Suggested change:** Keep the warning once in the hero, shorten it to “Pre-launch draft for counsel review.”, and remove the duplicate Draft status card.

**Checked:** 1440x1000 and 390x844. Pass 2 rechecked the complete document and bottom sections at both widths; no readability or overflow issue was found beyond the redundant status block.

Evidence: [terms-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/terms-desktop.png) · [terms-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass1/terms-mobile.png) · [terms-desktop-bottom](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/terms-desktop-bottom.png) · [terms-mobile-bottom](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/screenshots/pass2/terms-mobile-bottom.png)

### /grower/batches

**G28 · High · Repair the batch list render failure**

The Batches page fails before rendering its list: runtime TypeError ‘batch.thc.toFixed is not a function’. Both fresh navigations show the application error overlay.

**Suggested change:** Normalize batch lab values before numeric formatting and show a recoverable error state when data is invalid. The normal list layout has separate two-pass findings under 11b-batches-ready.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [11-batches-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11-batches-desktop.png) · [11-batches-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11-batches-mobile.png) · [11-batches-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11-batches-desktop.png) · [11-batches-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11-batches-mobile.png)

**G29 · High · Keep harvest dates consistent**

The same batch lists ‘Sep11,2026’ here but edit form shows harvest date09/12/2026. A date-only field appears to shift by one day between views.

**Suggested change:** Use the same date-only formatting in list and edit views so harvest dates agree; verify across time zones without altering the stored harvest day.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [11b-batches-ready-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11b-batches-ready-desktop.png) · [11b-batches-ready-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11b-batches-ready-mobile.png) · [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png) · [11b-batches-ready-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11b-batches-ready-desktop.png) · [11b-batches-ready-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11b-batches-ready-mobile.png) · [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png)

**G30 · Medium · Compact mobile batch actions**

Three stacked metrics push the first batch to y558; the batch's three actions each consume a full row, and Delete is the largest bright-red emphasis.

**Suggested change:** Use ‘Batches’, compact metrics, and a single action row with ‘Edit’, ‘Add product’ and an overflow menu for Delete. Shorten ‘+ Product from batch’ to ‘Add product’; the batch context already supplies the relationship.

**Checked:** Mobile. Both fresh passes

Evidence: [11b-batches-ready-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11b-batches-ready-mobile.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png) · [11b-batches-ready-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11b-batches-ready-mobile.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png)

### /grower/batches/[id]/edit

**G33 · Medium · Replace the raw JSON terpene editor**

The edit form asks growers to enter ‘Terpenes (JSON)’ in a code-style textarea. On mobile the example wraps as raw braces, quoted keys and numeric values.

**Suggested change:** Replace raw JSON with repeatable ‘Terpene’ and ‘%’ fields plus ‘Add terpene’. Put an advanced import option behind disclosure only if technical users need it.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png) · [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png)

**G34 · Medium · Reduce repeated batch-edit content**

As on Add Batch, three lab-document cards repeat headings in their descriptions, and three numeric lab fields stack full-width on mobile. The Edit Batch/Update batch details/Batch Details trio repeats context.

**Suggested change:** Use one ‘Edit batch’ heading, a compact lab-results grid and document rows labeled ‘Potency’, ‘Pesticides’, ‘Microbials’. State ‘PDF ·2MB max’ once and use a concise Upload/Replace action per row.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png) · [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png)

**G35 · Low · Clarify the batch-number example**

‘Expected format: BATCH-YYYYMMDD-XX…’ remains beside an existing VN-2026-0912 ID, implying the existing record is invalid without showing a validation error.

**Suggested change:** If it is only guidance, label it ‘Example: BATCH-20260917-01’ or omit it in edit mode. If mandatory, show a specific validation message rather than generic expected-format copy.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png) · [13-batch-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png) · [13-batch-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png)

### /grower/batches/add

**G31 · Medium · Use compact lab-document rows**

Three upload cards each repeat the test name in a sentence, display a Missing badge and a separate Upload PDF button. On mobile these occupy roughly560px; the introductory upload paragraph adds another80px.

**Suggested change:** Use ‘Lab PDFs · up to2MB each’ once, then compact rows ‘Potency’, ‘Pesticides’, ‘Microbials’ with status and Upload. Reserve explanation for help or an error. Avoid ‘Missing’ warning styling on a brand-new untouched form unless required.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [12-batch-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/12-batch-add-desktop.png) · [12-batch-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/12-batch-add-mobile.png) · [12-batch-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/12-batch-add-desktop.png) · [12-batch-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/12-batch-add-mobile.png)

**G32 · Low · Pair short lab fields**

THC, CBD and total cannabinoids each occupy a full-width row despite short numeric values; Add New Batch/subtitle/Batch Details repeat the task, and the batch-number example is shown twice.

**Suggested change:** Use ‘Add batch’, one ‘Batch ID’ example and a ‘Generate’ control. Pair THC/CBD in a grid with total below or use a compact three-column lab row if labels remain readable; use ‘Total (%)’ inside Lab results.

**Checked:** Mobile. Both fresh passes

Evidence: [12-batch-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/12-batch-add-mobile.png) · [12-batch-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/12-batch-add-mobile.png)

### /grower/catalog

**G05 · Medium · Make the catalog overview concise**

Overview navigation opens ‘Catalog Workspace’; the page describes managing listings in the subtitle, next-action banner, Listings card, and Catalog health area. Four navigation cards repeat sidebar destinations with explanatory paragraphs.

**Suggested change:** Use ‘Catalog overview’. Replace the generic banner with one actionable issue count. Compress destinations into ‘Listings · 3’, ‘Inventory’, ‘Buyer preview’, and ‘Price visibility’, with one-line helper text only where needed.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-desktop.png) · [02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-mobile.png) · [02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-desktop.png) · [02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-mobile.png)

**G06 · Medium · Shorten multi-line status badges**

The status pills on four destination cards are narrow enough to wrap ‘3 buyer-visible listings’ or ‘1 quote-only listing’ over three or four lines; mobile cards consume about450px before health details.

**Suggested change:** Use short badges ‘3 live’, ‘1 quote-only’, ‘0 low stock’; keep counts beside titles or use a secondary line rather than circular multi-line pills.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-desktop.png) · [02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-mobile.png) · [02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-desktop.png) · [02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-mobile.png)

**G07 · Medium · Compact catalog health checks**

Catalog health begins at y1211 and shows four tall cards with instructional copy even when three counts are zero; page reaches1977px for a summary screen.

**Suggested change:** Show only issues by default with compact rows, ‘Images missing · 0’, ‘Type missing · 0’, ‘Quote only · 1’, ‘Low stock · 0’; hide zero-count details behind ‘All checks’.

**Checked:** Mobile. Both fresh passes

Evidence: [02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-mobile.png) · [02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-mobile.png)

### /grower/customers

**G51 · Medium · Expose supported customer-management actions**

The customer directory exposes only View requests and Message. Add customer, edit saved contact and statement routes exist but have no visible entry point on this directory in the audited account.

**Suggested change:** If the existing Add/Edit/Statement screens are intended for everyday contact management, add an “Add customer” action and “Edit contact”/“Statement” menu entries for eligible owned contacts. Respect platform-managed restrictions.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [19-customers-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/19-customers-desktop.png) · [19-customers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/19-customers-mobile.png) · [19-customers-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/19-customers-desktop.png) · [19-customers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/19-customers-mobile.png)

**G52 · Medium · Compact customer summaries and metadata**

Three summary cards push the first customer to y583. Each card prints labeled contact/email/phone/location lines plus totals; ‘Customers’ and ‘Customer List’ repeat, and Orders terminology differs from Requests elsewhere.

**Suggested change:** Use a compact summary ‘2 customers ·2 active ·20 requests’. Remove Customer List heading and simplify subtitle to ‘Saved contacts and buyers’. Group contact details compactly, skip duplicate contact name when it equals business name, and use Requests consistently.

**Checked:** Mobile. Both fresh passes

Evidence: [19-customers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/19-customers-mobile.png) · [19-customers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/19-customers-mobile.png)

### /grower/customers/[id]/edit

**G54 · Medium · Combine the customer-edit header rows**

View statement sits alone at the top right, followed by a separate back link, then title and repeated subtitle. Mobile title starts at y214 rather than the usual96; the header spends over200px before the form.

**Suggested change:** Place ‘Customers’ back link and ‘Statement’ in one compact row, followed by ‘Edit customer’. Remove ‘Update customer information’.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [21-customer-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/21-customer-edit-desktop.png) · [21-customer-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/21-customer-edit-mobile.png) · [21-customer-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/21-customer-edit-desktop.png) · [21-customer-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/21-customer-edit-mobile.png)

**G55 · Low · Tighten customer-edit form spacing**

Large gaps/padding in three form cards plus full rows for City, State, ZIP and three footer actions make this contact form1862px tall. The delete action is prominently positioned above save even for a contact with request history.

**Suggested change:** Use ‘Business’, ‘Contact’, ‘Address’ headings with tighter spacing; pair State/ZIP. Put Delete in a secondary menu or explain why it is unavailable when history must be retained. Keep Cancel/Save together.

**Checked:** Mobile. Both fresh passes

Evidence: [21-customer-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/21-customer-edit-mobile.png) · [21-customer-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/21-customer-edit-mobile.png)

### /grower/customers/[id]/statement

**G56 · Medium · Keep statement values visible on mobile**

Mobile statement shows request and delivered date but clips Items and Value to the right. The overall total is visible, but per-request details needed to reconcile the statement are hidden without a scroll hint.

**Suggested change:** Use mobile statement rows with reference/date on one line and item summary/value below; alternatively pin value and provide a clear horizontal-scroll affordance.

**Checked:** Mobile. Both fresh passes

Evidence: [22-customer-statement-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/22-customer-statement-mobile.png) · [22-customer-statement-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/22-customer-statement-mobile.png)

**G57 · Low · Shorten statement copy and fix singular counts**

The long customer-name-plus-statement32px title takes two mobile lines; ‘Customer relationship’ is an abstract back label; direct-settlement explanation appears in subtitle and footer, and singular count reads ‘1 delivered requests’.

**Suggested change:** Use ‘Statement’ with ‘Maple Street Market’ as a smaller subtitle, back label ‘Customer’, count ‘1 delivered request’, and one concise ‘Payments are arranged directly; PhenoFarm does not collect funds’ note.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [22-customer-statement-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/22-customer-statement-desktop.png) · [22-customer-statement-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/22-customer-statement-mobile.png) · [22-customer-statement-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/22-customer-statement-desktop.png) · [22-customer-statement-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/22-customer-statement-mobile.png)

### /grower/customers/add

**G53 · Low · Trim repeated customer-form context**

‘Add New Customer’, ‘Add a new dispensary customer’, and ‘Customer Information’ repeat the task. State and ZIP each consume a full row despite short values, and both footer actions are full-width.

**Suggested change:** Use ‘Add customer’ and omit the duplicate subtitle/inner title. Keep State and ZIP side by side with City above; pair Cancel/Add at the bottom while retaining adequate tap sizes.

**Checked:** Mobile. Both fresh passes

Evidence: [20-customer-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/20-customer-add-mobile.png) · [20-customer-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/20-customer-add-mobile.png)

### /grower/dashboard

**G01 · Medium · Put pending work before the setup checklist**

A six-row readiness checklist and setup pitch appear before daily attention items. On mobile, attention begins at y1700 after an approximately 1100px setup block; completed items each keep explanation and Complete badge.

**Suggested change:** Put pending requests first; collapse completed setup items into ‘Setup · 3 left’. Use ‘Review 17 requests’ and remove ‘Pending requests are the fastest path to keeping buyers moving.’

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-mobile.png) · [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-mobile.png)

**G02 · Medium · Remove repeated dashboard headings**

‘ATTENTION CENTER’ repeats ‘What needs your attention’; ‘Activity Feed’ and ‘Recent Activity’ create two headings for one list plus instructional subtitles. KPI helper text repeats linked destinations.

**Suggested change:** Use one ‘Needs attention’ heading and one ‘Recent activity’ heading; remove generic subtitles. Shorten KPIs to ‘Requests’, ‘Delivered value’, ‘Customers’, ‘Products’. Keep one concise settlement qualifier near value.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-mobile.png) · [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-mobile.png)

**G03 · Medium · Show recent chart data first**

Delivered-value chart shows mostly empty space and oldest days first; the only visible $450 bar is outside the initial horizontal window. Desktop card is approximately340px tall; mobile swipe view initially looks empty.

**Suggested change:** Default to the most recent days or a seven-day mobile view; use ‘Delivered value · 30 days’, reduce chart height, and make date range visible.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-mobile.png) · [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-mobile.png)

**G04 · Low · Use plain subscription and terms copy**

Subscription readiness text exposes ‘when Stripe Billing is ready’, while commercial terms lists five implementation concepts.

**Suggested change:** Use ‘Choose a plan to activate your account’ only when available, otherwise ‘Billing is not available yet’; use ‘Set order and delivery defaults’.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-mobile.png) · [01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-desktop.png) · [01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-mobile.png)

**G58 · Low · Name the catalog destination clearly**

‘Dashboard’ and ‘Overview’ are adjacent destinations, but Overview opens Catalog Workspace. The shell calls the role Cultivator while the mobile drawer says Grower Portal and Grower.

**Suggested change:** Rename Overview to ‘Catalog’ or ‘Catalog overview’. Pick one user-facing role term across the shell; remove ‘Portal’ where it adds no information.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [24-navigation-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/24-navigation-desktop.png) · [24-navigation-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/24-navigation-mobile.png) · [24-navigation-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/24-navigation-desktop.png) · [24-navigation-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/24-navigation-mobile.png)

**G59 · Low · Shorten mobile search guidance**

The long input placeholder truncates at390px and uses Orders while navigation says Requests. Keyboard-only navigation hints remain in the mobile footer.

**Suggested change:** Use placeholder ‘Search PhenoFarm’ and one category hint ‘Products, requests, customers, strains’. Hide arrow/Enter/Esc instructions on touch layouts; keep them on desktop.

**Checked:** Mobile. Both fresh passes

Evidence: [25-search-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25-search-mobile.png) · [25-search-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25-search-mobile.png)

**G60 · Low · Use one conversation-selection prompt**

Before a thread is selected, ‘Select a conversation’ appears in the header, an empty-state card and composer placeholder. Quote/pricing controls and settlement note still occupy the bottom.

**Suggested change:** Use one centered ‘Choose a conversation’ prompt and hide composer/quote actions until selection. The explanatory sentence about context, pricing actions and templates is unnecessary.

**Checked:** Desktop. Both fresh passes

Evidence: [26-messages-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26-messages-desktop.png) · [26-messages-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26-messages-desktop.png)

**G61 · Medium · Reduce message-composer clutter**

Composer has a horizontal row of six templates, two quote/pricing buttons and a two-line role/settlement note. Settlement is already a chip beneath the conversation header; on mobile the template row clips a label at the right edge.

**Suggested change:** Keep the message box and Send primary. Put templates under ‘Templates’ and pricing actions under ‘Quote’. Show one payment note only in quote context, with concise ‘Payment arranged directly’. Use shorter template names such as ‘Follow up’, ‘Availability’, ‘Delivery’, ‘Terms’.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [26a-message-thread-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26a-message-thread-desktop.png) · [26a-message-thread-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26a-message-thread-mobile.png) · [26a-message-thread-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26a-message-thread-desktop.png) · [26a-message-thread-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26a-message-thread-mobile.png)

**G62 · Medium · Give quotes persistent labels and context**

The quote form uses only placeholders—‘Quote unit price’, ‘Qty (optional)’, ‘Quote terms note (optional)’—with no visible currency/unit or product context. It sits above the still-visible message composer and two other pricing controls.

**Suggested change:** Give the form a ‘Quote’ heading and persistent labels ‘Unit price ($/unit)’, ‘Qty’, ‘Terms’; show the product/unit being quoted or require a product choice if necessary. While quoting, replace the normal composer/actions with this form to avoid competing send controls.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [26b-quote-form-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26b-quote-form-desktop.png) · [26b-quote-form-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26b-quote-form-mobile.png) · [26b-quote-form-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26b-quote-form-desktop.png) · [26b-quote-form-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26b-quote-form-mobile.png)

**G63 · Medium · Make notifications specific and concise**

Repeated ‘New order request’ and ‘New counter quote’ titles are followed by full generic sentences (‘The other party sent revised quote terms for your review’). Adjacent rows look almost identical and lack a visible request/product reference.

**Suggested change:** Use shorter, specific rows such as ‘Green Vermont · Request #XPJO3I’ or ‘Revised quote · Purple Haze’; show a concise value/status preview rather than ‘the other party’. Keep relative time and unread styling.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [27-notifications-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/27-notifications-desktop.png) · [27-notifications-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/27-notifications-mobile.png) · [27-notifications-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/27-notifications-desktop.png) · [27-notifications-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/27-notifications-mobile.png)

### /grower/inventory

**G19 · Medium · Compact inventory summaries**

Two full-width actions and three stacked metric cards push the first product below the844px initial viewport. ‘Inventory’ is followed by ‘Product Inventory’ plus two similar explanations.

**Suggested change:** Use a compact metrics row and one Add action; move ‘Update stock’ next to filters or label it ‘Stock update’. Remove the second heading and use one short helper ‘Enter current stock’.

**Checked:** Mobile. Both fresh passes

Evidence: [06-inventory-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-mobile.png) · [06-inventory-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-mobile.png)

**G20 · Low · Format values and units consistently**

The value is ‘$10000.00’ here versus ‘$10,000.00’ in Products; rows repeat the quantity beneath the stock input and spell out ‘gram’ in prices.

**Suggested change:** Format value as ‘$10,000’ when cents are zero. Put units beside stock inputs and use ‘$25/g’, ‘240 g’ consistently, keeping less familiar package units written out.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [06-inventory-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-desktop.png) · [06-inventory-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-mobile.png) · [06-inventory-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-desktop.png) · [06-inventory-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-mobile.png)

**G21 · Low · Explain stock edits in plain language**

‘Changes save as absolute quantities’ describes implementation rather than the user's action.

**Suggested change:** Use ‘Set the amount currently in stock’ or ‘Enter current stock; changes save automatically’.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [06-inventory-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-desktop.png) · [06-inventory-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-mobile.png) · [06-inventory-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-desktop.png) · [06-inventory-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-mobile.png)

### /grower/inventory/add

**G22 · Low · Keep stock updates focused**

The top Add Product action competes with the stock task. The subtitle's second sentence and search helper repeat obvious context, while ‘Stock Details’ adds another heading for two fields. Desktop input spans nearly1100px.

**Suggested change:** Use subtitle ‘Set a product’s current stock’. Move ‘New product’ beside search or into the empty state. Label fields ‘Product’ and ‘New stock’; retain ‘Replaces current stock’. Constrain desktop form width and place Cancel/Save side by side on mobile.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [07-inventory-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/07-inventory-add-desktop.png) · [07-inventory-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/07-inventory-add-mobile.png) · [07-inventory-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/07-inventory-add-desktop.png) · [07-inventory-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/07-inventory-add-mobile.png)

### /grower/orders

**G36 · Medium · Keep request status, value, and View visible**

At 390px the initial table view shows selection, a long request ID, and dispensary. Date, value, status, and View are offscreen and require horizontal scrolling. The identifier wraps over multiple lines while decision-making fields remain outside the initial view, with no clear scroll cue.

**Suggested change:** Use compact mobile request cards/rows with buyer, short request reference, value, status and a visible View action. Keep full ID available in details or copy action. If retaining table scrolling, pin identifier/action and add a clear scroll hint.

**Checked:** Mobile. Both fresh passes

Evidence: [14-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-mobile.png) · [14-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-mobile.png)

**G37 · Medium · Move requests above summary clutter**

Four full-width metric cards and the saved-view explanation push Active Requests below y1000; the first actual request is beyond the first screen. Active and Needs Review counts are repeated in cards, filters and section heading.

**Suggested change:** Combine metrics into a compact two-by-two or single summary strip, use a short status filter row, and put Record request/History in one compact header row. Show ‘18 active ·17 need review’ once near the list.

**Checked:** Mobile. Both fresh passes

Evidence: [14-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-mobile.png) · [14-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-mobile.png)

**G38 · Medium · Replace request workflow jargon**

‘Saved workflow views’, ‘Start with the next request state before selecting batch actions’, and the heading subtitle's ‘without in-app payment settlement’ add administrative wording before the core list.

**Suggested change:** Use title ‘Requests’, filters labeled by status, and no instructional sentence. Keep the payment model as a concise contextual note ‘Payment is arranged directly’ where order value/payment decisions are shown.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [14-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-desktop.png) · [14-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-mobile.png) · [14-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-desktop.png) · [14-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-mobile.png)

### /grower/orders/[id]

**G45 · Medium · Prioritize the next request action**

Long32px request heading plus four stacked navigation/edit/print/export actions precede the item. The primary fulfillment decision Accept/Cancel is far lower on the page, while sticky footer repeats All orders and Edit request rather than the next action.

**Suggested change:** Use ‘Request’ with a smaller reference line; put back navigation once, keep the next status action near the summary, and move Edit/Print/Export into an overflow menu. Use ‘Requests’ consistently instead of ‘All orders’.

**Checked:** Mobile. Both fresh passes

Evidence: [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-mobile.png) · [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-mobile.png)

**G46 · Medium · Consolidate repeated request status**

Submitted appears in the title area, Update Status badge, timeline, ‘Currently: Submitted’ callout and History. Timeline lists four future stages with Pending; mobile stretches it into a tall block, followed by a near-duplicate History card.

**Suggested change:** Use one current-status chip and one compact progress/history area. Collapse future stages; remove ‘5 stages’, ‘Quick actions to move fulfillment forward’ and the duplicate current-status callout.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [17-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-desktop.png) · [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-mobile.png) · [17-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-desktop.png) · [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-mobile.png)

**G47 · Low · Shorten request totals copy**

‘Requested Items’, ‘Estimated item value’, ‘Estimated request value’ and repeated direct-payment wording lengthen a one-item request.

**Suggested change:** Use ‘Items’, ‘Subtotal’, ‘Est. total’ and one payment note ‘Payment arranged directly’.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [17-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-desktop.png) · [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-mobile.png) · [17-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-desktop.png) · [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-mobile.png)

**G48 · Medium · Separate street and city in addresses**

The customer address joins street and city as “456 Market StreetBurlington, VT 05401” with no separator. It was visible in both passes and independently confirmed in the second.

**Suggested change:** Preserve a line break or insert a comma between street and city in compact address layouts.

**Checked:** Mobile. Independent second-pass refinement; both screen captures retained

Evidence: [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-mobile.png) · [17-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-mobile.png)

### /grower/orders/[id]/edit

**G49 · Medium · Use one request status panel**

Submitted is shown beside the page heading and again in a full tinted Current Status box. ‘Order Status’ disagrees with request terminology and ‘Choose a valid next status’ adds procedural wording. Mobile status area is nearly310px before the item.

**Suggested change:** Use one ‘Status · Submitted’ header with compact next-state choices beneath it; remove the second badge, large Current status panel and ‘valid’ wording. Use ‘Request’ consistently.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [18-order-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/18-order-edit-desktop.png) · [18-order-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/18-order-edit-mobile.png) · [18-order-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/18-order-edit-desktop.png) · [18-order-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/18-order-edit-mobile.png)

**G50 · Low · Compact short request fields**

Shipping and recorded tax fields each use a full row with help text, followed by a large Notes field and separate Summary card. One item produces a1920px page.

**Suggested change:** Pair Shipping/Tax where readable, use ‘Shipping ($)’ and ‘Tax ($, optional)’, preserve the essential ‘Only if included on your invoice’ note, and shorten ‘Request Notes/Request Summary’ to ‘Notes/Summary’. Keep current readable item controls.

**Checked:** Mobile. Both fresh passes

Evidence: [18-order-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/18-order-edit-mobile.png) · [18-order-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/18-order-edit-mobile.png)

### /grower/orders/add

**G41 · Medium · Use plain record-request copy**

‘Record Direct Request’ repeats in title and button; subtitle uses ‘outside PhenoFarm payment rails’. Search placeholder and helper both describe filtering by business/city.

**Suggested change:** Use ‘Record request’, with one clear note ‘For orders arranged directly with a buyer. Payment is handled outside PhenoFarm.’ Keep a single search placeholder ‘Search buyers by name or city’ and remove the duplicate helper.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [16-order-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-desktop.png) · [16-order-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-mobile.png) · [16-order-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-desktop.png) · [16-order-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-mobile.png)

**G42 · Medium · Put items before optional request details**

Two stacked action buttons and an instruction precede the form, while Notes and a full-width shipping field come before Items. The empty Items panel starts at y769, and its Add button is near the floating message launcher.

**Suggested change:** Order the form Buyer → Items → shipping/notes. Use ‘Add item’ inside a compact empty state instead of a separate header button plus two explanatory lines; keep a single save action at the end or in a compact sticky footer.

**Checked:** Mobile. Both fresh passes

Evidence: [16-order-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-mobile.png) · [16-order-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-mobile.png)

**G43 · Medium · Keep the message launcher clear of Add item**

The floating message button partly overlaps Add item at the initial mobile viewport: launcher x334–378/y788–832; Add x289–357/y769–809. This competes with the next required form action.

**Suggested change:** Reserve space around the floating launcher or move it away from form action rows. Keep Add item fully visible and tappable.

**Checked:** Mobile. Independent second-pass refinement; both screen captures retained

Evidence: [16-order-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-mobile.png) · [16-order-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-mobile.png)

**G44 · Medium · Remove repeated item prices and stock**

One item repeats its price in the product option, next to ‘Agreed price’, and in the input. Stock appears both in the option and an ‘Available now’ badge. Mobile row is about350px; its long select text truncates. Desktop price column is narrow enough to wrap its help over three lines while product select is very wide.

**Suggested change:** Select by product name, show ‘25 available · List $40/eighth’ once below, pair Qty and Unit price, and place Remove in the row corner. Use ‘Subtotal’, ‘Shipping’, ‘Est. total’ and one concise ‘Payment arranged directly’ note.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [16a-product-picker-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16a-product-picker-desktop.png) · [16a-product-picker-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16a-product-picker-mobile.png) · [16a-product-picker-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16a-product-picker-desktop.png) · [16a-product-picker-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16a-product-picker-mobile.png)

### /grower/orders/history

**G39 · Medium · Keep history values and actions visible**

The history table requires horizontal scrolling to reveal estimated value, status, and View actions on mobile. Long request IDs wrap to three or four lines and dominate the initial view while buyer, value, status, and action information is harder to scan.

**Suggested change:** Use mobile history rows with customer, shortened reference, closed date, value and status plus a visible open action. Preserve complete references in the detail page or copy control.

**Checked:** Mobile. Both fresh passes

Evidence: [15-order-history-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/15-order-history-mobile.png) · [15-order-history-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/15-order-history-mobile.png)

**G40 · Medium · Compact history summaries**

Four full-width metrics occupy about490px; the two-row history list begins near y930. ‘Historical Requests’, ‘Delivered & Cancelled Requests’ and filter counts repeat the same summary.

**Suggested change:** Use ‘History’ with a compact ‘2 requests ·1 delivered ·1 cancelled’ summary and delivered value beside it. Shorten navigation to ‘Active requests’; remove the second long list heading.

**Checked:** Mobile. Both fresh passes

Evidence: [15-order-history-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/15-order-history-mobile.png) · [15-order-history-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/15-order-history-mobile.png)

### /grower/products

**G08 · Medium · Bring products into the first mobile screen**

Three full-width actions, three stacked KPI cards, a views panel, grouping/display panel, and bulk instructions push the first product to y1295. Most of the first screen contains repeated catalog context rather than products.

**Suggested change:** Keep one Add action with Quick add/Import in its menu. Put three metrics in one compact row; combine filters, grouping, and display in a compact toolbar. Show bulk controls after selection. Aim for the first product within the initial screen.

**Checked:** Mobile. Both fresh passes

Evidence: [03-products-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-mobile.png) · [03-products-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-mobile.png) · [03-products-narrow](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-narrow.png)

**G09 · Medium · Simplify product toolbar labels**

‘Saved workflow views’ plus ‘Use these before grouping…’ explains basic controls; ‘Select products for bulk cleanup’ is followed by another cleanup sentence. ‘All’ appears in saved views, grouping, and an All Products section header.

**Suggested change:** Use ‘Filters’, ‘Low stock’, ‘Missing photos’, ‘Hidden’; label grouping as ‘Group by’. Remove both bulk instruction sentences and the All Products divider when ungrouped. Shorten quote badge to ‘Quote only’ with a tooltip explaining price visibility.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [03-products-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-desktop.png) · [03-products-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-mobile.png) · [03-products-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-desktop.png) · [03-products-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-mobile.png) · [03-products-narrow](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-narrow.png)

**G10 · Medium · Keep product price, stock, and actions visible**

The table retains desktop columns. At 390px, price is partly offscreen and stock plus Edit/actions are outside the initial view; horizontal scrolling is required to reach them. At 360px even more of the price is hidden. There is no explicit horizontal-scroll cue, and the long quote-only pill forms a tall narrow stack.

**Suggested change:** Use compact mobile product rows showing name, status, price, stock and an always-visible action menu. If the table remains, pin product/actions and add an explicit horizontal-scroll cue; use ‘g’ and ‘ea’ only where unit meaning is clear.

**Checked:** Mobile. Both fresh passes

Evidence: [03-products-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-mobile.png) · [03-products-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-mobile.png) · [03-products-narrow](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-narrow.png)

**G11 · Medium · Make Quick add quick to scan**

Quick add expands a panel with ‘QUICK PRODUCT CREATION’, ‘Create the basic listing now’, and a 20-word explanation; on mobile its header/defaults/draft controls consume about250px before the first field.

**Suggested change:** Use one ‘Quick add’ heading and ‘Add details later’ helper. Put Close in the heading row and make defaults a compact ‘Flower · g’ control; pair price and stock fields when space permits.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [03a-quick-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03a-quick-add-desktop.png) · [03a-quick-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03a-quick-add-mobile.png) · [03a-quick-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03a-quick-add-desktop.png) · [03a-quick-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03a-quick-add-mobile.png)

### /grower/products/[id]/edit

**G16 · High · Show the saved unit in the edit form**

Unit is a required select showing ‘Select a unit’ while the same form summary says ‘$25/gram’ and ‘240 gram’. The screen does not clearly indicate the current unit.

**Suggested change:** Normalize existing units to the available options and show the selected value. Use ‘g’ consistently in summary after a labeled ‘Unit’ control; verify unchanged edits preserve the unit.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [05-product-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-desktop.png) · [05-product-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-mobile.png) · [05-product-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-desktop.png) · [05-product-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-mobile.png)

**G17 · Medium · Use a focused product-edit layout**

The five-step new-listing guide and creation-oriented sentences remain on Edit Product. Mobile reaches3982px; the summary repeats five values in separate cards. Desktop main form occupies a narrow column with a large empty right side below the sticky summary.

**Suggested change:** For edit mode use ‘Edit product’ plus compact section links, remove the creation guide, and use ‘Stock’ rather than ‘Initial Inventory Quantity’. Keep one ‘Save changes’ label across sticky and standard actions. Compact the summary into rows; give editable fields more desktop width.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [05-product-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-desktop.png) · [05-product-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-mobile.png) · [05-product-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-desktop.png) · [05-product-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-mobile.png)

**G18 · Low · Hide irrelevant batch-detail guidance**

Batch area has ‘No batches available yet…’, a ‘View batch details’ link, and ‘Link to a harvest batch for lab results’ together even though no batch is selected.

**Suggested change:** Use ‘No batches for this strain’ beside a ‘New batch’ action; hide ‘View batch details’ until a batch is selected. Remove the extra linkage explanation.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [05-product-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-desktop.png) · [05-product-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-mobile.png) · [05-product-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-desktop.png) · [05-product-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-mobile.png)

### /grower/products/add

**G12 · Medium · Reduce product setup guidance**

Title/subtitle, five-step setup block and its paragraph, defaults panel, then Step 1 description consume nearly the first mobile screen before editing. Each later section also explains its heading; default form totals3223px.

**Suggested change:** Use ‘Add product’; replace setup block with compact section links ‘Basics · Pricing · Stock · Details’. Put reusable defaults beside the Type field. Remove instructions such as ‘so mobile setup stays easier to scan’, ‘Name the product…’ and ‘Add the starting quantity…’.

**Checked:** Mobile. Both fresh passes

Evidence: [04-product-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-mobile.png) · [04-product-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-mobile.png)

**G13 · Medium · Use one consistent publish action**

Mobile has sticky ‘Publish product’ plus bottom ‘Create Product’, separate Cancel buttons, a five-card save summary, and repeated browser-autosave text; primary labels disagree for the same action. Desktop draft helper is a narrow five-line paragraph.

**Suggested change:** Use one action label ‘Publish product’ across widths. Keep draft as a secondary action, show a compact one- or two-line review summary and one ‘Draft saved on this device’ note; avoid repeating the full footer behind the sticky action bar.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [04-product-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-desktop.png) · [04-product-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-mobile.png) · [04-product-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-desktop.png) · [04-product-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-mobile.png)

**G14 · Low · Shorten product field labels**

‘Initial Inventory Quantity’, ‘Availability Status’, and nested ‘Pricing Display’ repeat context already supplied by their sections; price visibility options each include near-synonymous helper copy.

**Suggested change:** Use ‘Starting stock’, ‘Available’, and ‘Show price / Quote only’, with a single explanation ‘Quote-only listings hide the price’. Shorten ‘Optional profile, compliance, and images’ to ‘More details & photos’.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [04-product-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-desktop.png) · [04-product-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-mobile.png) · [04-product-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-desktop.png) · [04-product-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-mobile.png)

**G15 · Low · Remove repeated optional and upload wording**

Optional appears in the section title, badge and ‘Cannabinoid Profile (Optional)’. Image helper includes the implementation detail ‘Images upload separately before you save the product.’

**Suggested change:** Use ‘Cannabinoids’ inside the already optional section. Keep the upload helper to ‘Up to 2 photos · JPG, PNG, WebP · 1MB each’ and show actual upload status only when needed.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [04a-product-details-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04a-product-details-desktop.png) · [04a-product-details-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04a-product-details-mobile.png) · [04a-product-details-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04a-product-details-desktop.png) · [04a-product-details-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04a-product-details-mobile.png)

### /grower/strains

**G23 · Medium · Use denser strain cards and counts**

Four sparse strain cards have a large gap between counts and buttons. On mobile the three metric cards alone consume300px and the first strain starts at y626; four strains extend the page to1537px.

**Suggested change:** Use ‘Strains’ as the title and remove the generic subtitle. Put counts in a compact summary row. Use shorter strain rows/cards with counts beside the name and Edit/Add product in a small action row; reserve card height for actual genetics details.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [08-strains-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-desktop.png) · [08-strains-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-mobile.png) · [08-strains-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-desktop.png) · [08-strains-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-mobile.png)

**G24 · Low · Clarify strain actions**

The green ‘+ Product’ action is shorter than other create labels but does not clearly say it creates a product from this strain; delete icons receive strong red emphasis on every card.

**Suggested change:** Use ‘Add product’ consistently and move destructive actions into an overflow menu, keeping Edit most prominent for library maintenance.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [08-strains-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-desktop.png) · [08-strains-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-mobile.png) · [08-strains-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-desktop.png) · [08-strains-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-mobile.png)

### /grower/strains/[id]/edit

**G27 · Medium · Remove repeated help from strain editing**

Editing an existing Hybrid still displays all five definitions and three levels of repeated ‘strain details’ wording. The help block consumes216px on mobile and pushes optional fields below the fold.

**Suggested change:** Apply the add-form simplification here: ‘Edit strain’, then fields without another details heading; show only selected-type help on demand. Use ‘Name’, ‘Type’, ‘Lineage’ and define the different purposes of description and notes.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [10-strain-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/10-strain-edit-desktop.png) · [10-strain-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/10-strain-edit-mobile.png) · [10-strain-edit-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/10-strain-edit-desktop.png) · [10-strain-edit-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/10-strain-edit-mobile.png)

### /grower/strains/add

**G25 · Medium · Show strain-type help on demand**

All five strain-type definitions are displayed below the select. They mostly restate the option name and take216px on mobile before Lineage.

**Suggested change:** Show help only for the selected option or behind ‘About strain types’. Use compact options ‘Indica’, ‘Sativa’, ‘Hybrid’, ‘Sativa dominant’, ‘Indica dominant’ and remove generic buyer-positioning wording.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [09-strain-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-desktop.png) · [09-strain-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-mobile.png) · [09-strain-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-desktop.png) · [09-strain-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-mobile.png)

**G26 · Low · Shorten strain-form copy**

‘Add New Strain’, ‘Create a new cannabis genetics entry’, and ‘Strain Details’ repeat the same task; placeholders list several long examples and truncate on mobile. Description and Grower Notes do not explain their distinct purposes.

**Suggested change:** Use ‘Add strain’, omit the subtitle or inner title, and shorten labels to ‘Name’, ‘Type’, ‘Lineage’. Use one brief example per placeholder. Clarify the audience/purpose of Description versus Grower notes instead of overlapping generic examples.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [09-strain-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-desktop.png) · [09-strain-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-mobile.png) · [09-strain-add-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-desktop.png) · [09-strain-add-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-mobile.png)

### /grower/marketplace

**E19 · Medium · State the preview purpose once**

Page title/intro, Buyer preview heading/subtitle and a green banner repeat the same purpose.

**Suggested change:** Use Marketplace preview and one sentence: “How buyers see your listings.” Use Add product for the primary action.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-mobile.png)

**E20 · Medium · Replace four stacked preamble cards**

Two counts and two standing instructions get equally large cards; the mobile preview heading starts at y 739.

**Suggested change:** Use compact Active and Quote required counts, then one Terms link and a short relevant policy note.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-mobile.png)

**E21 · Medium · Remove nested mobile card padding**

The preview panel and product cards both add borders/padding, leaving about 278 px for content inside a 390 px screen.

**Suggested change:** Use a single product-card shell on mobile and remove the outer preview padding.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-mobile.png)

**E22 · Medium · Simplify shared product-card repetition**

Large placeholder art repeats category; cards repeat stock status/quantity, unit and long lab-availability text. Three products make the mobile page 3011 px tall.

**Suggested change:** Shrink placeholder-only art, use category once, condense stock/unit and use “Lab results: request”. Coordinate with the buyer catalog so preview stays accurate. Preserve supplied photos and safety-relevant lab facts.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-marketplace-mobile.png)

### /grower/pricing

**E08 · Medium · Reduce the plan-page preamble**

The first plan begins around y 825 on mobile. A two-line title, long disclosure and large current-plan panel repeat information before comparisons.

**Suggested change:** Use Plans; one short subscription/settlement disclosure; a compact “Current plan: Free” line. Preserve price and billing terms.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-mobile.png)

**E09 · Medium · Show useful unavailable-upgrade copy**

The local unavailable state tells growers to add STRIPE_PRO_PRICE_ID or STRIPE_BUSINESS_PRICE_ID.

**Suggested change:** Show “Paid upgrades are unavailable. Contact support.” Put configuration steps in the admin view. This is not a claim about production billing.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-mobile.png)

**E10 · Low · Remove repeated plan labels and features**

Free/current plan is repeated across the summary, badge and button; Pro lists priority support twice; some Free entitlements overlap vaguely.

**Suggested change:** Keep one current-plan badge, one support benefit and distinct concise entitlements. Make the Free status badge fit-content on mobile.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-mobile.png)

**E11 · Medium · Make mobile plan comparison less scroll-heavy**

The three plans require over 2200 px of page height; Pro starts around y 1287.

**Suggested change:** Use compact plan summaries with optional feature expansion or a concise comparison. Keep actual prices, annual terms and primary actions visible.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-pricing-mobile.png)

### /grower/reports

**E01 · Low · Shorten report headings and repeated range wording**

Analytics & Reports repeats the navigation label; four KPI helpers repeat the selected date range, plus settlement and export explanations.

**Suggested change:** Use Reports, Delivered value and Avg. delivered value; state the date range once and omit routine export/settlement reminders. Preserve the distinction between delivered value and paid revenue.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-mobile.png)

**E02 · Medium · Compact mobile exports and date presets**

Two full-width export buttons, a helper line and a two-row date-range card precede the metrics.

**Suggested change:** Use one Export menu or inline PDF/CSV; use 30 d,90 d,12 mo,All with full accessible names.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-mobile.png)

**E03 · Medium · Remove the orphan KPI half-row**

The first metric spans the full row; the next three create an empty lower-right half-row. The trend starts around y 887.

**Suggested change:** Use a consistent 2×2 mobile grid, with subtle highlighting instead of forcing the first metric full-width.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-mobile.png)

**E04 · Medium · Right-size a one-period chart and empty statuses**

The one-period chart has a 490 px-wide bar and roughly 200 px unused space below it. Four of six status rows contain zero in the sampled 90 day view.

**Suggested change:** Constrain bar width and chart height for sparse data; present zero statuses compactly or under a reveal control. Preserve access to every status.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-mobile.png)

**E05 · High · Correct the month displayed on the trend**

September sample request value is labeled Aug 26 in both passes and the 30 day view. The month formatter parses a UTC month-start date then displays it in local time.

**Suggested change:** Format year/month as a calendar month without timezone shifting; verify September remains September across timezones.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-mobile.png)

**E06 · Low · Use singular count wording**

The sample renders “1 delivered requests” and “1 orders”.

**Suggested change:** Use “1 delivered request” and “1 order”.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-mobile.png)

**E07 · Medium · Preserve customer context in the compact mobile list**

Recent Requests hides customer and date, leaving cryptic IDs, status and value.

**Suggested change:** Make customer the primary row label, with a short date/ID metadata line; keep status and value alongside.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-reports-mobile.png)

### /grower/settings

**E12 · Medium · Explain settlement once**

The subscription panel, separate Wholesale Settlement panel and Commercial terms note repeat the payment boundary.

**Suggested change:** Keep one concise disclosure near the relevant subscription/terms action and remove the separate repeated explanation.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-mobile.png)

**E13 · Medium · Rebalance profile and logo space**

The business form occupies a single narrow column while the short logo card leaves a large unused column below it. The app sidebar plus section sidebar further compress the form.

**Suggested change:** Put logo in a compact profile header, arrange short fields in two columns on desktop and consider horizontal section navigation.

**Checked:** Desktop. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-mobile.png)

**E14 · Medium · Restore mobile section navigation**

The page is 3606 px tall, Business profile starts at y 1902, and the desktop section navigation disappears on mobile.

**Suggested change:** Add a compact section chooser or anchored tabs so users can reach Profile, Terms and Branding directly.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-mobile.png)

**E15 · Medium · Reduce the persistent save strip and clarify its scope**

An untouched page reserves 92 px at the bottom for Save settings and a draft note. Commercial terms simultaneously has its own Save terms control.

**Suggested change:** Show a compact save strip when relevant/dirty; label its scope “Save profile” if it only saves profile fields. Keep Save terms distinct.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-mobile.png)

**E16 · Low · Replace repeated form instructions with targeted guidance**

Required-first prose lists fields already marked required; Business prefixes repeat within the profile; title/nav names vary between Business Information and Business profile.

**Suggested change:** Use Settings, Business profile, Name/Email/Phone/Address, Logo and Upload. Show one short required-field key or only the missing required items.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-mobile.png)

**E17 · Medium · Keep the contact note readable**

The single-line Contact note input clips the end of its default sentence on mobile.

**Suggested change:** Use a concise default such as “Message before confirming fulfillment” or a compact two-line field when longer content is needed.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-mobile.png)

**E18 · Low · Remove the redundant desktop sign-out card**

An Account card repeats the sign-out action already in the sidebar.

**Suggested change:** Use one consistent account action; retain a clear mobile route to sign out.

**Checked:** Desktop. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-settings-mobile.png)

### Unmatched URL (404)

**E23 · Medium · Give missing pages a recovery action**

The default 404 page shows only the error code and “This page could not be found”, without branding or a route back into the app.

**Suggested change:** Use a concise “Page not found” message and Home/Back to dashboard action with the normal brand treatment. Do not add filler to the empty area.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-not-found-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-not-found-desktop.png) · [p1-not-found-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p1-not-found-mobile.png) · [p2-not-found-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-not-found-desktop.png) · [p2-not-found-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/p2-not-found-mobile.png)

### /dispensary/*

**BUY-059 · Low · Mobile navigation has unnecessary categories**

Six navigation destinations are split under five tiny letter-spaced section labels, while the menu header also repeats Dispensary Portal. This adds hierarchy with little information.

**Suggested change:** Use one straightforward list, optionally a single Shop grouping; remove the role subtitle. Keep the current 14px link text and generous rows.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Inspected the open menu and confirmed Escape closes it.

Evidence: [p2-shared-menu-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-menu-mobile.png)

**BUY-060 · Low · Search empty state repeats instructions**

Long mobile search placeholder crowds the close control; the empty state repeats Start typing to search and three category chips, and the footer says 0 results before a query exists.

**Suggested change:** Use Search PhenoFarm or Search products and orders; hide result counts until a query is entered.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Empty and populated search states inspected at both widths; query was typed without a form submission.

Evidence: [p2-shared-search-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-search-mobile.png) · [p2-shared-search-results-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-search-results-mobile.png)

**BUY-061 · Low · Touch search shows keyboard hints and plural error**

Mobile fullscreen search displays tiny keyboard navigation/Enter/Escape instructions even though the interface is being used as a touch layout; 1 results is also ungrammatical.

**Suggested change:** Hide keyboard hints on touch widths and use 1 result / N results.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Empty and populated search states inspected at both widths; query was typed without a form submission.

Evidence: [p2-shared-search-results-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-search-results-mobile.png)

**BUY-062 · Low · Search result secondary actions are small**

Saved and message icons in search results are only 32x32px on mobile.

**Suggested change:** Use at least 40x40px touch areas, or move secondary actions to the destination screen.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Empty and populated search states inspected at both widths; query was typed without a form submission.

Evidence: [p2-shared-search-results-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-search-results-mobile.png)

**BUY-063 · Medium · Notifications omit distinguishing product context**

Rows repeat Quote accepted or New quote terms plus generic multi-line explanations, but omit the product/grower that would distinguish entries. Eighteen older rows are visually near-identical.

**Suggested change:** Use a specific one-line event such as Vermont Nurseries accepted Purple Haze quote, then a short date. Group related older events where appropriate.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Panel opened independently at each width and inspected; no notification or mark-read action used.

Evidence: [p2-shared-notifications-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-notifications-desktop.png) · [p2-shared-notifications-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-notifications-mobile.png)

**BUY-064 · Low · Notification panel opens far from its trigger**

Desktop notifications opens at the far upper-right even though its trigger is in the left sidebar, increasing the visual distance between action and result.

**Suggested change:** Anchor the desktop panel beside the sidebar trigger or use a consistently placed notification drawer.

**Checked:** desktop. Pass 1: control-state-not-inspected; pass 2: discovered. Panel opened independently at each width and inspected; no notification or mark-read action used.

Evidence: [p2-shared-notifications-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-notifications-desktop.png)

**BUY-089 · Low · Empty message pane repeats its instruction**

Desktop repeats Select a conversation in the pane heading, empty-state card, and composer placeholder while exposing pricing controls before a conversation is selected.

**Suggested change:** Use one centered Choose a conversation prompt; reveal the composer and relevant pricing actions after selection.

**Checked:** desktop. Pass 1: control-state-not-inspected; pass 2: discovered. Drawer list inspected at both widths; existing conversations were not opened because that marks messages read.

Evidence: [p2-shared-messages-list-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-messages-list-desktop.png)

**BUY-090 · Low · Message footer repeats role and payment guidance**

The permanent desktop footer explains You are messaging as Dispensary and Quotes set terms only; wholesale payment is handled directly in small text, adding role and settlement copy to every conversation.

**Suggested change:** Keep necessary settlement guidance beside a quote action or its confirmation, and remove the redundant role sentence.

**Checked:** desktop. Pass 1: control-state-not-inspected; pass 2: discovered. Drawer list inspected at both widths; existing conversations were not opened because that marks messages read.

Evidence: [p2-shared-messages-list-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-messages-list-desktop.png)

**BUY-091 · Low · Recent activity uses route-like page names**

The recently used list names the visited shop Grower 001 instead of Vermont Nurseries, and prefixes familiar account pages with Dispensary.

**Suggested change:** Use the business name for shop visits and the same short Dashboard, Settings, and Saved labels as navigation.

**Checked:** desktop. Pass 1: control-state-not-inspected; pass 2: discovered. Desktop drawer inspected; this control is not present at the mobile breakpoint.

Evidence: [p2-shared-activity-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shared-activity-desktop.png)

### /dispensary/cart

**BUY-014 · Medium · Empty draft repeats payment guidance**

No wholesale payment is collected is explained both under Request draft and again inside the empty state.

**Suggested change:** Keep one short sentence: Send requests here; arrange payment with the grower.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

Evidence: [p1-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-desktop.png) · [p1-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-mobile.png) · [p2-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-desktop.png) · [p2-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-mobile.png)

**BUY-015 · Medium · Quote-only suggestions use an ambiguous Add action**

Quote only suggestion presents the same Add action as a priced product.

**Suggested change:** Use Request pricing for quote-only suggestions or clearly indicate that a quote is needed before submission.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

Evidence: [p1-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-desktop.png) · [p1-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-mobile.png) · [p2-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-desktop.png) · [p2-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-mobile.png)

**BUY-016 · Low · Empty-state copy and illustration delay suggestions**

Start a request from the catalog plus a multi-line process explanation and large plus icon delay suggestions.

**Suggested change:** Use Your draft is empty with Add products to get started; reduce illustration padding.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

Evidence: [p1-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-desktop.png) · [p1-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-mobile.png) · [p2-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-desktop.png) · [p2-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-mobile.png)

**BUY-017 · Low · Saved destination label is unnecessarily abstract**

Open saved workspace is longer and more abstract than the destination content.

**Suggested change:** Use Saved items.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All four pass-one findings confirmed with a freshly emptied browser-local draft. No product added.

Evidence: [p1-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-desktop.png) · [p1-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-empty-mobile.png) · [p2-03-cart-empty-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-desktop.png) · [p2-03-cart-empty-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-empty-mobile.png)

**BUY-018 · Medium · Draft repeats direct-payment guidance**

Payment outside PhenoFarm is repeated in the page introduction, Terms helper, summary notice, and selected Handled directly summary.

**Suggested change:** Keep one concise note below payment terms: Arrange payment directly with the grower.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

Evidence: [p1-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-desktop.png) · [p1-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-mobile.png) · [p2-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-desktop.png) · [p2-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-mobile.png) · [p2-cart-sticky-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-sticky-viewport-mobile.png)

**BUY-019 · Medium · Default and refresh notices dominate mobile draft**

Smart request defaults and an always-visible inventory-refreshed banner consume about 190px on mobile before the one item. Banner discusses unavailable items even when none are unavailable.

**Suggested change:** Use a small Reuse last request control; show a change banner only when something actually changed.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

Evidence: [p1-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-desktop.png) · [p1-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-mobile.png) · [p2-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-desktop.png) · [p2-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-mobile.png) · [p2-cart-sticky-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-sticky-viewport-mobile.png)

**BUY-020 · Medium · Optional fields appear as warnings**

Yellow Optional fixes before review presents missing optional timing/notes as warning cards and repeats both field prompts.

**Suggested change:** Keep (optional) next to fields; remove warnings unless a required action blocks submission.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

Evidence: [p1-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-desktop.png) · [p1-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-mobile.png) · [p2-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-desktop.png) · [p2-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-mobile.png) · [p2-cart-sticky-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-sticky-viewport-mobile.png)

**BUY-021 · Medium · Mobile draft stepper duplicates visible sections**

Mobile four-step tracker takes two rows even though all form sections are already displayed together.

**Suggested change:** Use a compact Draft / Review indicator or section anchors in one row.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

Evidence: [p1-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-mobile.png) · [p2-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-mobile.png) · [p2-cart-sticky-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-sticky-viewport-mobile.png)

**BUY-022 · Low · Draft summary repeats form details**

Summary repeats single-grower request count, fulfillment and payment terms already shown in the form.

**Suggested change:** Show total and grower count compactly; reserve the full recap for Review.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

Evidence: [p1-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-desktop.png) · [p1-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-mobile.png) · [p2-03-cart-filled-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-desktop.png) · [p2-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-mobile.png) · [p2-cart-sticky-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-sticky-viewport-mobile.png)

**BUY-023 · Medium · Remove-item touch target is too narrow**

Remove-item target is only 16px wide at mobile size (40px high).

**Suggested change:** Provide at least a 40px square icon-button target without increasing the icon.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

Evidence: [p1-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-03-cart-filled-mobile.png) · [p2-03-cart-filled-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-03-cart-filled-mobile.png) · [p2-cart-sticky-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-sticky-viewport-mobile.png)

**BUY-078 · Low · Mobile draft Add link is ambiguous**

The sticky mobile secondary action is labeled only Add, which does not identify that it returns to the catalog.

**Suggested change:** Use Add items or Browse catalog.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. All six pass-one observations confirmed at both widths. Actual viewport inspection resolved the seemingly blank Add link: its text is covered by the development-only Next.js badge, not a production product defect.

Evidence: [p2-cart-sticky-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-sticky-viewport-mobile.png)

**BUY-079 · High · Mobile review dialog clips submission and back actions**

At 390x844 the review panel ends at y802 with overflow hidden, while Submit Order Request runs y777–817 and Back to Draft runs y829–871. Submit is partly cut off and Back is entirely invisible. The fixed mobile header also overlaps the dialog title.

**Suggested change:** Use a modal above navigation with a flex column layout: fixed header/footer and a flexing scrollable body. Ensure both footer actions fit inside the panel at mobile heights.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Review-only dialog opened and inspected at both widths; actual viewport capture and element geometry confirmed clipping. No submission.

Evidence: [p2-cart-review-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-review-viewport-mobile.png) · [p2-cart-review-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-review-mobile.png)

**BUY-080 · Medium · Review dialog repeats its purpose and summary**

Review Order Request, its long confirmation subtitle, REVIEW MODE and Confirm before submitting repeat the same instruction. Four separate summary tiles stack before the actual product.

**Suggested change:** Use Review request as the sole heading; one compact line for item/grower count and a 2x2 detail grid or labeled rows.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Review-only dialog opened and inspected at both widths; actual viewport capture and element geometry confirmed clipping. No submission.

Evidence: [p2-cart-review-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-review-desktop.png) · [p2-cart-review-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-review-mobile.png) · [p2-cart-review-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-review-viewport-mobile.png)

**BUY-081 · Low · Review edit links are small and recap repeats copy**

Each Edit link is only 21px wide, and payment/estimated-value explanations repeat the draft screen.

**Suggested change:** Make each detail row itself an edit target, retain one final Total and a short Payment arranged with grower note.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Review-only dialog opened and inspected at both widths; actual viewport capture and element geometry confirmed clipping. No submission.

Evidence: [p2-cart-review-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-review-mobile.png) · [p2-cart-review-viewport-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-cart-review-viewport-mobile.png)

### /dispensary/catalog

**BUY-007 · Medium · Catalog hero delays product browsing**

Marketing title and explanatory copy dominate a task screen and push product content below the first mobile viewport.

**Suggested change:** Use Catalog and a single short line: Browse verified growers. Use a 24–28px mobile title.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p1-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-desktop.png) · [p1-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-mobile.png) · [p2-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-desktop.png) · [p2-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-mobile.png)

**BUY-008 · Medium · Mobile catalog toolbar spans three rows**

Mobile sort/filter/view controls occupy three rows; the sort arrow sits detached at the far right.

**Suggested change:** Put Sort and Filters in one row with view icons beside them; use Search products or growers as placeholder.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p1-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-mobile.png) · [p2-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-mobile.png)

**BUY-009 · Medium · Product cards repeat seller and stock details**

Each listing repeats the grower name under an existing grower group, In stock plus Stock N units plus N Available, and a long identical lab-result note.

**Suggested change:** Keep stock once; omit redundant grouped grower byline; shorten shared note to Lab results on request.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p1-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-desktop.png) · [p1-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-mobile.png) · [p2-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-desktop.png) · [p2-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-mobile.png)

**BUY-010 · Medium · Desktop price and quantity controls compete for space**

Price and unit break across lines on desktop while quantity controls and Add to Request crowd the same area.

**Suggested change:** Give price its own compact row; place quantity and Add to draft together beneath it.

**Checked:** desktop. Pass 1: observed; pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p1-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-desktop.png) · [p2-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-desktop.png)

**BUY-011 · Medium · Missing-photo placeholders dominate listings**

Missing-photo fallback is a large repeated leaf occupying 192px per card and contributes to 2845px for only three products.

**Suggested change:** Use a compact thumbnail row for missing images or a shorter fallback aspect ratio.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p1-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-desktop.png) · [p1-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-mobile.png) · [p2-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-desktop.png) · [p2-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-mobile.png)

**BUY-012 · Low · Catalog repeats counts and view state**

Counts repeat in 3 of 3 products, grower 3 products, and a large bottom end-of-results notice; View: Grid repeats the selected toggle.

**Suggested change:** Show the count once and remove View: Grid; reduce end marker to End of results.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p1-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-desktop.png) · [p1-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-mobile.png) · [p2-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-desktop.png) · [p2-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-mobile.png)

**BUY-013 · Low · Sparse grower groups retain a four-column grid**

Desktop grid leaves an entire unused fourth-column slot for a three-item grower group.

**Suggested change:** Let low-count groups fit three useful-width cards instead of fixed four narrow columns.

**Checked:** desktop. Pass 1: observed; pass 2: confirmed. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p1-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-02-catalog-desktop.png) · [p2-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-desktop.png)

**BUY-065 · Medium · Catalog shows an orphan draft-count badge**

With a populated draft, the catalog header displays a standalone red 2 badge without a cart icon, label or action. It floats at the far right on desktop and creates a new row beneath the intro on mobile.

**Suggested change:** Attach the count to a clear View draft button or remove it here because the main navigation already shows the draft count.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. All seven first-pass observations confirmed. Populated draft adds 20px to the mobile header and pushes the first product heading to y843.

Evidence: [p2-02-catalog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-desktop.png) · [p2-02-catalog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-02-catalog-mobile.png)

**BUY-066 · High · Open desktop filters clip product action controls**

Opening the desktop filter sidebar retains a four-column product grid in the reduced content width. Product cards narrow to about 190px and clip quantity increment controls and the Add to Request buttons at their right edges.

**Suggested change:** Reduce the column count while filters are open, enforce a minimum usable card width, and stack price above quantity/action when needed. Verify controls inside the card bounds, not just page overflow.

**Checked:** desktop. Pass 1: control-state-not-inspected; pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

Evidence: [p2-catalog-filters-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-filters-desktop.png)

**BUY-067 · Medium · Filter shortcuts are oversized**

Favorites and Recently Added each take a large decorative card before the actual filter groups, pushing Unit Price below the initial mobile sheet viewport.

**Suggested change:** Use two compact checkbox or switch rows: Favorites (1) and Added in 7 days. Keep product type, THC and unit price visible with less padding.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

Evidence: [p2-catalog-filters-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-filters-desktop.png) · [p2-catalog-filters-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-filters-mobile.png)

**BUY-068 · Low · Filter action and toggle labels are unclear**

Mobile primary action reads Apply Filters All; All does not explain whether it is a result count or state. Favorites toggle is named only Off in the accessibility snapshot.

**Suggested change:** Use Show 3 products or Apply filters; label the toggle Favorites only with a separate on/off state.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

Evidence: [p2-catalog-filters-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-filters-mobile.png)

**BUY-069 · Low · Price filters repeat unit wording**

Each price option repeats per unit below Unit Price and Wholesale price per unit.

**Suggested change:** Keep Price per unit as the heading and use < $10, $10–25, $25–50, $50+ as options.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Desktop sidebar and mobile sheet independently opened and inspected.

Evidence: [p2-catalog-filters-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-filters-desktop.png) · [p2-catalog-filters-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-filters-mobile.png)

**BUY-070 · Medium · Mobile message context truncates both names**

Mobile product and grower names are both truncated inside one compact pill, obscuring the recipient/context before sending.

**Suggested change:** Use two short wrapping lines: product name and To: grower, with no pill width constraint.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Opened the unsent composer at both widths; did not submit.

Evidence: [p2-catalog-pricing-dialog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-pricing-dialog-mobile.png)

**BUY-071 · Medium · Mobile message input text is small**

The message textarea uses 14px text on mobile, smaller than the 16px form fields elsewhere.

**Suggested change:** Use 16px input text on small screens while keeping labels and supporting text compact.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Opened the unsent composer at both widths; did not submit.

Evidence: [p2-catalog-pricing-dialog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-pricing-dialog-mobile.png)

**BUY-072 · Low · Pricing composer repeats explanations**

Title is followed by Send a note to the grower about this listing; three long template chips stack vertically; a separate green box explains drawer behavior in two sentences.

**Suggested change:** Remove the subtitle, shorten templates to Pricing & MOQ / Availability / Introduction, and use Replies in Messages as a single quiet line.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Opened the unsent composer at both widths; did not submit.

Evidence: [p2-catalog-pricing-dialog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-pricing-dialog-desktop.png) · [p2-catalog-pricing-dialog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-pricing-dialog-mobile.png)

**BUY-073 · Medium · Price alert dialog omits manual-check limitation**

The dialog says Alert me when the product drops below this target price, but omits the manual-check limitation disclosed on Saved alerts. It can imply monitoring outside the app.

**Suggested change:** Use Track a target price, with Checks when you visit or refresh Saved. Keep the limitation short and visible before saving.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Opened unsaved alert dialog at both widths; inspected without submitting.

Evidence: [p2-catalog-alert-dialog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-alert-dialog-desktop.png) · [p2-catalog-alert-dialog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-alert-dialog-mobile.png)

**BUY-074 · Low · Price alert dialog omits sale unit**

Target price and Current $60 omit the sale unit, and the dialog uses an inner floating card inside another modal card.

**Suggested change:** Label Target price ($/g), show Current $60/g, and remove the nested shadow/card padding.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Opened unsaved alert dialog at both widths; inspected without submitting.

Evidence: [p2-catalog-alert-dialog-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-alert-dialog-desktop.png) · [p2-catalog-alert-dialog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-alert-dialog-mobile.png)

**BUY-075 · High · Comparison dialog sits behind navigation**

Comparison dialog sits behind the fixed navigation. Desktop sidebar obscures the dialog left edge, including title, first product name and row labels; mobile header overlaps the comparison heading.

**Suggested change:** Render the comparison overlay at the shared modal layer above all navigation, and keep the panel within the visible viewport.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Two browser-local comparison selections opened; initial and scrolled mobile content inspected.

Evidence: [p2-catalog-compare-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-desktop.png) · [p2-catalog-compare-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-mobile.png) · [p2-catalog-compare-lower-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-lower-mobile.png)

**BUY-076 · Medium · Mobile comparison columns are too narrow**

Mobile comparison uses two 115px-wide content columns, each repeating every attribute label beside its value. Prices, product types and headings wrap heavily; key controls are far below the first view.

**Suggested change:** Use one shared label per attribute with two values beneath it, compact product headers, and short unit notation. Keep comparison actions outside narrow value columns.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Two browser-local comparison selections opened; initial and scrolled mobile content inspected.

Evidence: [p2-catalog-compare-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-mobile.png) · [p2-catalog-compare-lower-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-lower-mobile.png)

**BUY-077 · Low · Comparison repeats decorative and explanatory content**

Two giant repeated leaf placeholders and Comparing 2 products side-by-side consume space that does not help compare products. Grower appears under the title and again in an attribute row.

**Suggested change:** Use small thumbnails, a concise Compare (2) title, omit the explanatory subtitle and show grower once.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Two browser-local comparison selections opened; initial and scrolled mobile content inspected.

Evidence: [p2-catalog-compare-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-desktop.png) · [p2-catalog-compare-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-mobile.png) · [p2-catalog-compare-lower-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-compare-lower-mobile.png)

**BUY-092 · High · Catalog mobile list hides prices and Add buttons**

At 390px catalog List view keeps a desktop horizontal row: product-name columns shrink to 57–91px, pricing/message controls overlap text, prices disappear off the right edge, and Add buttons sit at x400–440 outside the 390px viewport. The document still reports 390px width because overflow is clipped internally.

**Suggested change:** Switch list rows to a mobile stack with a compact thumbnail beside full-width identity, then price/availability and full-width actions below. Assert that each price and action fits within the visible card.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Fresh alternate layout inspected in both sizes; desktop readable, mobile severely clipped.

Evidence: [p2-catalog-list-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-catalog-list-mobile.png)

### /dispensary/dashboard

**BUY-001 · Medium · Completed setup card remains oversized**

Completed setup consumes a full card and lists internal feature readiness on every dashboard visit.

**Suggested change:** Replace with a compact Verified buyer chip or dismissible setup confirmation.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

Evidence: [p1-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-desktop.png) · [p1-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-mobile.png) · [p2-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-desktop.png) · [p2-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-mobile.png)

**BUY-002 · Medium · Saved summary repeats labels and counts**

Favorites block repeats Saved for later / Favorites and price alerts / explanatory sentence / FAVORITES 1 / 1 product.

**Suggested change:** Use one Saved row: Favorites 1 · Price alerts 1.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

Evidence: [p1-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-desktop.png) · [p1-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-mobile.png) · [p2-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-desktop.png) · [p2-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-mobile.png)

**BUY-003 · Medium · Recent requests subtitle describes implementation**

Recent Requests subtitle explains shared tracker formatting instead of helping the buyer.

**Suggested change:** Remove it; keep Recent requests and View all.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

Evidence: [p1-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-desktop.png) · [p1-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-mobile.png) · [p2-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-desktop.png) · [p2-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-mobile.png)

**BUY-004 · Medium · Dashboard cards leave large empty areas**

Desktop recently requested card has about 270px of unused lower space; empty chart card is over 400px tall.

**Suggested change:** Size recent list to content and replace empty chart with a compact No requests this week row.

**Checked:** desktop. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

Evidence: [p1-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-desktop.png) · [p2-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-desktop.png)

**BUY-005 · Medium · Mobile recent requests need compact rows**

On mobile recent requests begin below y949 and occupy five tall repeated cards.

**Suggested change:** Show three compact rows with ID suffix, grower, amount/status; move date into one secondary line.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

Evidence: [p1-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-mobile.png) · [p2-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-mobile.png)

**BUY-006 · Low · Dashboard status labels are unclear**

Requests Waiting and Active Requests are adjacent but their distinction is unclear; Estimated Request Value is verbose in a small KPI label.

**Suggested change:** Use Awaiting response, In progress, and Request value; add definition on demand.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on a fresh visit at both widths. Recent Requests remains y949 mobile; no overflow.

Evidence: [p1-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-desktop.png) · [p1-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-01-dashboard-mobile.png) · [p2-01-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-desktop.png) · [p2-01-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-01-dashboard-mobile.png)

### /dispensary/grower/[id]

**BUY-037 · Medium · Shop repeats verification and category details**

Verified badge/license in the hero are repeated in a separate License card; product types appear in both a large stat and product filters.

**Suggested change:** Keep verification/license in the header; combine product count and types into one short line.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p1-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-desktop.png) · [p1-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-mobile.png) · [p2-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-desktop.png) · [p2-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-mobile.png) · [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-038 · Medium · Commercial terms delay the mobile product list**

Four separate commercial-term cards stack before any products on mobile.

**Suggested change:** Show a compact Pickup/delivery · No minimum summary and expandable Shop details beneath the product list.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p1-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-mobile.png) · [p2-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-mobile.png) · [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-039 · Medium · Shop message label opens an anchor**

Message from a listing is the prominent header CTA but it scrolls toward products instead of opening a message composer.

**Suggested change:** Label it View products or Browse listings, or offer a direct Message grower action with clear context.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p1-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-desktop.png) · [p1-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-mobile.png) · [p2-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-desktop.png) · [p2-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-mobile.png) · [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-040 · Medium · Shop placeholders dominate mobile product cards**

Mobile product images are large square repeated placeholders; only three listings yield 3670px of page height.

**Suggested change:** Use shorter image ratios or compact missing-photo rows and bring a product name/price into the first screen.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p1-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-mobile.png) · [p2-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-mobile.png) · [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-041 · Low · Shop card wording differs from catalog**

Product card language/styles differ from catalog: purple THC badge, Featured sort vs Grouped by grower, Request Pricing vs Request pricing, gram casing, and a second In Stock below quantity availability.

**Suggested change:** Reuse consistent card tokens/labels and one availability statement across catalog and shop.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p1-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-desktop.png) · [p1-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-mobile.png) · [p2-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-desktop.png) · [p2-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-mobile.png) · [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-042 · Low · Commercial terms mix topics and repeat payment copy**

Order minimums card also contains response time; settlement card repeats direct payment twice.

**Suggested change:** Separate factual short labels: Minimum: none set · Replies: 1 business day · Payment: direct.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p1-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-desktop.png) · [p1-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-mobile.png) · [p2-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-desktop.png) · [p2-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-mobile.png) · [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-043 · Low · Shop repeats product-list context**

All Products / Browse the full catalog / Showing 3 of 3 products repeats context.

**Suggested change:** Use Products (3) beside the search controls.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p1-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-desktop.png) · [p1-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-06-grower-shop-mobile.png) · [p2-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-desktop.png) · [p2-06-grower-shop-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-mobile.png) · [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-082 · Low · Shop anchor hides its destination heading**

The Message from a listing anchor lands with the All Products heading hidden behind the fixed mobile header.

**Suggested change:** Rename the action Browse products and offset the anchor so the section heading remains visible.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p2-shop-message-anchor-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-shop-message-anchor-mobile.png)

**BUY-083 · Low · Shop action button reaches beyond card padding**

Desktop product price and request controls exceed the padded card width. The Add button reaches x830 while the first priced card ends at x828, clipping its outer edge; the price/unit and button are cramped together.

**Suggested change:** Put price on its own row above quantity and Add to draft; preserve consistent padding instead of letting controls touch the card edge.

**Checked:** desktop. Pass 1: control-state-not-inspected; pass 2: discovered. All seven pass-one findings confirmed. Clicking Message from a listing only navigated to #shop-products and opened no composer. First product name remains y1838 mobile.

Evidence: [p2-06-grower-shop-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-06-grower-shop-desktop.png)

### /dispensary/orders

**BUY-024 · Medium · Mobile order stats consume four rows**

Mobile stacks all four summary cards vertically unlike the dashboard two-column layout.

**Suggested change:** Use a two-by-two compact grid or a single summary line; put search/list first.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

Evidence: [p1-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-mobile.png) · [p2-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-mobile.png)

**BUY-025 · Medium · Mobile order cards repeat labels and actions**

Each mobile request occupies a large card with separate Date/Est. value labels, repeated View request button, and long full request ID.

**Suggested change:** Use a compact two-line tappable row: short ID + status, grower/date + amount. Keep full ID on the detail screen.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

Evidence: [p1-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-mobile.png) · [p2-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-mobile.png)

**BUY-026 · Low · Order page repeats its heading**

Order Requests then Request Tracker repeats the section purpose.

**Suggested change:** Use Orders as the page title and omit the inner tracker heading.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

Evidence: [p1-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-desktop.png) · [p1-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-mobile.png) · [p2-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-desktop.png) · [p2-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-mobile.png)

**BUY-027 · Low · Order search placeholder is clipped**

Search request or grower is clipped in a fixed-width field even on desktop.

**Suggested change:** Use Search orders and allow the input to grow within the filter row.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

Evidence: [p1-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-desktop.png) · [p1-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-mobile.png) · [p2-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-desktop.png) · [p2-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-mobile.png)

**BUY-028 · Low · Order result count appears twice**

Showing 19 of 19 requests and Page 1 · 19 matching requests repeat the same total.

**Suggested change:** Keep a single 19 requests summary next to pagination.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

Evidence: [p1-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-desktop.png) · [p1-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-mobile.png) · [p2-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-desktop.png) · [p2-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-mobile.png)

**BUY-029 · Low · Order status wording differs across pages**

Waiting on Growers here differs from Requests Waiting on the dashboard; Estimated Request Value is verbose.

**Suggested change:** Use Awaiting response and Request value consistently.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Nineteen mobile request cards produce a 5071px document; tracker still begins at y699.

Evidence: [p1-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-desktop.png) · [p1-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-04-orders-mobile.png) · [p2-04-orders-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-desktop.png) · [p2-04-orders-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-04-orders-mobile.png)

### /dispensary/orders/[id]

**BUY-030 · Medium · Order status is repeated four times**

Submitted is shown as the header badge, timeline step, Currently: Submitted banner, and a one-entry History card.

**Suggested change:** Keep status once near the heading and a compact progress line; collapse History behind View history.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

Evidence: [p1-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-desktop.png) · [p1-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-mobile.png) · [p2-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-desktop.png) · [p2-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-mobile.png)

**BUY-031 · Medium · Mobile timeline delays requested items**

Five vertical fulfillment stages and Pending on every future stage create a large mobile block before the requested product.

**Suggested change:** Show Submitted · Awaiting grower with a compact expandable timeline; remove 5 stages and repeated Pending.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

Evidence: [p1-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-mobile.png) · [p2-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-mobile.png)

**BUY-032 · Medium · Buyer action copy is noisy and state-inaccurate**

Buyer Actions explains three actions, then a red withdrawal explanation appears before any withdrawal intent. The paragraph also promises rebuilding although this pending-order state has no rebuild action.

**Suggested change:** Show the available actions directly; place withdrawal consequences in its confirmation and tailor copy to the current state.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

Evidence: [p1-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-desktop.png) · [p1-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-mobile.png) · [p2-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-desktop.png) · [p2-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-mobile.png)

**BUY-033 · Low · Two message actions compete**

Message Grower and Request Update are adjacent variants of contacting the same person.

**Suggested change:** Use one Message grower action with an optional Request an update suggestion in the composer.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

Evidence: [p1-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-desktop.png) · [p1-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-mobile.png) · [p2-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-desktop.png) · [p2-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-mobile.png)

**BUY-034 · Low · Request value is repeated**

Item value and request value both show the same $25.00, followed by another payment-outside-app explanation.

**Suggested change:** Show one Total unless fees change it; keep direct-payment terms in Request details.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

Evidence: [p1-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-desktop.png) · [p1-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-mobile.png) · [p2-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-desktop.png) · [p2-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-mobile.png)

**BUY-035 · Low · Export occupies a separate row**

Export record (CSV) occupies its own separate row/card gap.

**Suggested change:** Place Export CSV in the heading overflow/actions menu.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

Evidence: [p1-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-desktop.png) · [p1-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-mobile.png) · [p2-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-desktop.png) · [p2-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-mobile.png)

**BUY-036 · Low · Neutral details use warning styling**

Neutral request details use warning-like amber type and verbose DIRECT PAYMENT TERMS label.

**Suggested change:** Use neutral text and Payment terms.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All seven pass-one findings confirmed with a fresh submitted request detail. Requested Items remains y1522 mobile.

Evidence: [p1-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-desktop.png) · [p1-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-05-order-detail-mobile.png) · [p2-05-order-detail-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-desktop.png) · [p2-05-order-detail-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-05-order-detail-mobile.png)

### /dispensary/saved

**BUY-050 · Medium · Saved header and tabs delay the first product**

Saved Workspace introduction, three descriptive tabs, My Favorites/count card and separate sorting card push the first product name to y1063 on mobile. Tabs alone occupy roughly 225px.

**Suggested change:** Use Saved as the heading; a compact horizontal Favorites 1 / Alerts 1 / Recent 1 tab row; combine count, sort and view controls in one toolbar.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

Evidence: [p1-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-desktop.png) · [p1-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-mobile.png) · [p2-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-desktop.png) · [p2-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-mobile.png) · [p1-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-desktop.png) · [p1-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-mobile.png) · [p2-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-desktop.png) · [p2-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-mobile.png)

**BUY-051 · Medium · Clear favorites is too prominent**

Clear All is a prominent red standalone action in a large count card even with only one favorite, competing with the product task.

**Suggested change:** Move Clear favorites into an overflow menu; show a small count beside the active tab.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

Evidence: [p1-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-desktop.png) · [p1-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-mobile.png) · [p2-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-desktop.png) · [p2-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-mobile.png) · [p1-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-desktop.png) · [p1-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-mobile.png) · [p2-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-desktop.png) · [p2-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-mobile.png)

**BUY-052 · Low · Saved quote-only card repeats pricing guidance**

Hidden-price product says Request pricing in the section label and the button, with a full explanation between them.

**Suggested change:** Keep one Request pricing button plus a short Prices on request label, or remove the label entirely.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

Evidence: [p1-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-desktop.png) · [p1-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-mobile.png) · [p2-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-desktop.png) · [p2-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-mobile.png) · [p1-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-desktop.png) · [p1-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-mobile.png) · [p2-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-desktop.png) · [p2-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-mobile.png)

**BUY-053 · Low · Sparse favorites grid wastes space**

An isolated narrow card leaves most of the desktop content area empty, while its large decorative fallback image is dominant on mobile.

**Suggested change:** Use a compact list row when there are few saved products, or give the grid a sensible wider minimum card size and a shorter image fallback.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

Evidence: [p1-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-desktop.png) · [p1-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-08-favorites-alias-mobile.png) · [p2-08-favorites-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-desktop.png) · [p2-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-mobile.png) · [p1-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-desktop.png) · [p1-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-mobile.png) · [p2-10-saved-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-desktop.png) · [p2-10-saved-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-mobile.png)

**BUY-084 · Medium · Saved mobile view controls have no accessible names**

Mobile Grid and List controls are icon-only buttons with no accessible names in the rendered accessibility snapshot.

**Suggested change:** Add Grid view and List view accessible labels, matching the catalog controls.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Redirect worked at both widths on the second fresh visit. All four saved-favorites findings confirmed; no separate redirect defect.

Evidence: [p2-08-favorites-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-08-favorites-alias-mobile.png)

**BUY-088 · High · Saved mobile list view overlaps product text**

At 390px the list row compresses the product-name column to 60px, while price copy and request/message controls overlay the product title and grower text. Multiple text layers collide inside the card.

**Suggested change:** Give the product identity a full-width row on mobile, with a small thumbnail beside it; place price and actions in separate rows below. Do not preserve the desktop multi-column row at this width.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. List mode inspected at both widths. Desktop compact row works; mobile visibly overlaps.

Evidence: [p2-saved-list-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-saved-list-mobile.png)

### /dispensary/saved?tab=alerts

**BUY-054 · Medium · Alert summary delays the first mobile product**

Saved navigation plus the alert summary occupies most of the first mobile screen; the first product title is y962. The mobile summary becomes a large vertical stack of two counts and two isolated icons.

**Suggested change:** Use the compact Saved tabs and one alert toolbar: Active 1 · Triggered 0, Refresh icon with an accessible name; keep secondary counts off the main hierarchy.

**Checked:** mobile. Pass 1: observed; pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

Evidence: [p1-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-09-price-alerts-alias-mobile.png) · [p2-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-mobile.png)

**BUY-055 · Low · Alert counts appear three times**

Desktop repeats 1 active/0 triggered, 1 Active Alerts/0 Price Drops, and Active 1.

**Suggested change:** Show counts once in Active (1), Triggered (0), History tabs.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

Evidence: [p1-09-price-alerts-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-09-price-alerts-alias-desktop.png) · [p1-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-09-price-alerts-alias-mobile.png) · [p2-09-price-alerts-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-desktop.png) · [p2-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-mobile.png)

**BUY-056 · Low · Alert cards repeat target price and units**

Target price $20.00 repeats in both a price box and Alert at $20.00 badge; gram appears as a separate product badge and twice below prices.

**Suggested change:** Keep Current $25/g and Target $20/g together; remove the duplicate target badge and standalone unit badge.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

Evidence: [p1-09-price-alerts-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-09-price-alerts-alias-desktop.png) · [p1-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-09-price-alerts-alias-mobile.png) · [p2-09-price-alerts-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-desktop.png) · [p2-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-mobile.png)

**BUY-057 · Low · Manual price-check explanation needs shorter copy**

Important manual-check limitation is a long sentence; Clear All and Refresh Prices lose all visible text on mobile.

**Suggested change:** Shorten to Checks when you visit or refresh. Put Clear all in an overflow menu and retain a compact Refresh label.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

Evidence: [p1-09-price-alerts-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-09-price-alerts-alias-desktop.png) · [p1-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-09-price-alerts-alias-mobile.png) · [p2-09-price-alerts-alias-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-desktop.png) · [p2-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-mobile.png)

**BUY-085 · Medium · Mobile alert icons have no accessible names**

Mobile Clear all and Refresh prices are unlabeled icon buttons in the accessibility snapshot, including the destructive clear-all action.

**Suggested change:** Give them explicit accessible names; retain Refresh as compact visible text and move Clear all into a labeled overflow action.

**Checked:** mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Redirect worked again at both widths. All four alerts findings confirmed; no separate redirect defect.

Evidence: [p2-09-price-alerts-alias-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-09-price-alerts-alias-mobile.png)

**BUY-086 · Low · Triggered-alert empty state repeats instructions**

The empty state repeats No Triggered Alerts with No products have dropped below your target prices yet, adds an enthusiastic instruction and a View Active Alerts button even though the Active tab is immediately above.

**Suggested change:** Use No price drops yet with one compact View active alerts link and less vertical padding.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. Empty triggered tab inspected at both widths.

Evidence: [p2-alerts-triggered-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-alerts-triggered-desktop.png) · [p2-alerts-triggered-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-alerts-triggered-mobile.png)

**BUY-087 · Low · Alert History lacks dates or events**

History presents the active target/current-price card without dates or events, so its label suggests information the screen does not show.

**Suggested change:** If this tab is the union of active and triggered alerts, label it All. Reserve History for dated price/alert events.

**Checked:** desktop and mobile. Pass 1: control-state-not-inspected; pass 2: discovered. History tab inspected at both widths; it displays the same active alert card in this fixture.

Evidence: [p2-alerts-history-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-alerts-history-desktop.png) · [p2-alerts-history-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-alerts-history-mobile.png)

### /dispensary/saved?tab=recent

**BUY-058 · Low · Recent tab repeats its purpose and metadata**

Recently Requested tab description, section title and Use these products as a starting point for repeat order requests all explain the same task. Product metadata repeats ordered twice.

**Suggested change:** Use Recent in the tab and omit the explanation. Metadata: Vermont Nurseries · 19 requests · Jul 9. Shorten price to $25/g where unit meaning is established.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. Second freshly reopened Recent tab confirms the one pass-one copy finding. Product row itself remains compact and sound.

Evidence: [p1-10-saved-recent-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-recent-desktop.png) · [p1-10-saved-recent-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-10-saved-recent-mobile.png) · [p2-10-saved-recent-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-recent-desktop.png) · [p2-10-saved-recent-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-10-saved-recent-mobile.png)

### /dispensary/settings

**BUY-044 · Medium · Desktop branding card stretches into empty space**

Branding panel is as tall as the full business form although it contains only a small logo uploader, wasting most of the desktop right column.

**Suggested change:** Make branding a compact top card and use available width for two-column form groups; align cards to content height.

**Checked:** desktop. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

Evidence: [p1-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-desktop.png) · [p2-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-desktop.png)

**BUY-045 · Medium · Complete account still receives setup instructions**

Verified/complete account still shows REQUIRED FIRST and tells the buyer to finish already completed fields.

**Suggested change:** Show this guidance only when required information is missing; otherwise keep one Verified through date line.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

Evidence: [p1-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-desktop.png) · [p1-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-mobile.png) · [p2-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-desktop.png) · [p2-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-mobile.png)

**BUY-046 · Medium · License fields are grouped under the wrong section**

License & verification contains only notices; license number/state/expiry fields are under Business profile.

**Suggested change:** Move those three fields into License & verification so section links match the work.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

Evidence: [p1-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-desktop.png) · [p1-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-mobile.png) · [p2-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-desktop.png) · [p2-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-mobile.png)

**BUY-047 · Low · Settings labels repeat account context**

Long labels repeat account context: Dispensary Settings, Dispensary License Number, Business Email/Phone/Description.

**Suggested change:** Use Settings, License number, Email, Phone, Description where the section already supplies context.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

Evidence: [p1-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-desktop.png) · [p1-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-mobile.png) · [p2-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-desktop.png) · [p2-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-mobile.png)

**BUY-048 · Low · Persistent footer repeats draft and shortcut guidance**

Persistent save footer always says Settings drafts save in this browser and shows keyboard instructions, including Ctrl+S on this Mac review.

**Suggested change:** Show Unsaved changes / Saved status only when relevant; use platform-appropriate shortcut hints or omit them.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

Evidence: [p1-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-desktop.png) · [p1-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-mobile.png) · [p2-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-desktop.png) · [p2-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-mobile.png)

**BUY-049 · Low · Sign-out action lacks a visible label**

Bottom Account section explains signing out but uses only an unlabeled-in-appearance exit icon for the action.

**Suggested change:** Use a plainly labelled Sign out button and remove the explanatory sentence.

**Checked:** desktop and mobile. Pass 1: observed; pass 2: confirmed. All six pass-one findings confirmed on fresh navigation. Input font remains 16px; branding panel still stretches to the whole desktop profile height.

Evidence: [p1-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-desktop.png) · [p1-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p1-07-settings-mobile.png) · [p2-07-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-desktop.png) · [p2-07-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/p2-07-settings-mobile.png)

### /admin/dashboard

**A02 · Medium · Standardize business-role names**

Growers/Cultivators and Buyers/Dispensaries vary between navigation, headings and buttons on the same screen.

**Suggested change:** Choose one visible term per role; retain alternative legal wording only where needed.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-mobile.png)

**A08 · Medium · Compact the mobile metric cards**

Three one-column cards consume roughly 395 px before any checklist action. Helpers repeat already-understood verification context.

**Suggested change:** Use compact count cards/row and “1 verified” / “0 pending” helpers.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-mobile.png)

**A09 · Medium · Collapse completed checklist items**

Three completed checks remain expanded with individual buttons. The operations panel is about 728 px tall on mobile, and Open settings appears twice.

**Suggested change:** Lead with outstanding work, summarize completed checks behind “3 checks complete”, and retain only one primary settings action.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-mobile.png)

**A10 · Medium · Shrink the clear verification queue**

A large card uses both Pending verification and Newest accounts awaiting review, then says the queue is clear.

**Suggested change:** Show “No accounts awaiting review” as a short status row; expand the queue only when it contains work.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-mobile.png)

**A11 · Low · Move the standing business-model explanation**

A blue banner repeats the subscription/settlement policy on the routine dashboard, adding about 164 px on mobile.

**Suggested change:** Put the full explanation in billing/help and keep a short link here only if needed.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-mobile.png)

**A12 · Low · Simplify the development-only seeding panel**

The local-only panel repeats Demo data seeding, Seed demo accounts and Seed demo data inside nested cards. Source confirms this panel is hidden in production.

**Suggested change:** Use one collapsed developer-tools row and one action. This is development-only polish, not a production finding.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-mobile.png)

**A13 · Medium · Make dashboard counts match their destinations**

The clone shows 2 Dispensaries on the dashboard but 1 of 1 in the linked directory. The dashboard includes an off-platform contact that the directory excludes.

**Suggested change:** Count the same scope as the destination or label platform accounts and saved contacts separately. This was demonstrated with isolated sample data.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dashboard-mobile.png)

### /admin/dispensaries

**A07 · Medium · Make confirmation wording specific**

The verification dialog uses generic “Confirm admin action” and “Confirm”; its alert background stretches into a tall pill beside wrapped text.

**Suggested change:** Use “Remove verification?” and “Remove verification”; keep the alert icon square and aligned at the top.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p2-unverify-dialog-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-unverify-dialog-mobile.png)

**A16 · Medium · Remove repeated ordering-policy copy from rows**

Every desktop row repeats “Wholesale settlement stays direct” under ordering readiness. On mobile Ordering/Can submit requests gets a separate section.

**Suggested change:** Use a compact “Can order” status and keep the static settlement explanation in one relevant location.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-dispensaries-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dispensaries-desktop.png) · [p1-dispensaries-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dispensaries-mobile.png) · [p2-dispensaries-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dispensaries-desktop.png) · [p2-dispensaries-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dispensaries-mobile.png)

**A17 · Medium · Give business and license identifiers enough room**

Eight columns make business names, licenses and normal expiry dates wrap even at 1440 px. Normal expiry dates are padded badges.

**Suggested change:** Use plain compact dates, combine closely related status fields, and reserve width for identifiers. Show badges for exceptions, not every normal date.

**Checked:** Desktop. Both fresh passes

Evidence: [p1-dispensaries-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dispensaries-desktop.png) · [p1-dispensaries-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-dispensaries-mobile.png) · [p2-dispensaries-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dispensaries-desktop.png) · [p2-dispensaries-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dispensaries-mobile.png)

**A18 · Medium · Delay the wide table/header layout at tablet widths**

At 1024 px the title is squeezed to about 230 px beside 487 px filters. The table has 980 px content in 718 px space; actions are offscreen with little scrolling indication.

**Suggested change:** Stack header controls earlier and use cards or fewer columns until the content area is wide enough; retain a clear scroll affordance if a table must scroll.

**Checked:** Tablet 1024 px. Both fresh passes

Evidence: [p2-dispensaries-tablet](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-dispensaries-tablet.png)

### /admin/growers

**A04 · Medium · Mobile directory controls consume too many rows**

Growers and Dispensaries use a 160 px three-row form; Users uses a 113 px two-row form. The first records start around y 413–425.

**Suggested change:** Keep search field and Search button together; put status and result count on a compact second row. Preserve usable tap targets.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-growers-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-growers-desktop.png) · [p1-growers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-growers-mobile.png) · [p2-growers-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-growers-desktop.png) · [p2-growers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-growers-mobile.png)

**A15 · Medium · Use compact verification metadata**

A single grower card is about 270 px tall; subscription uses another section despite a short Free value.

**Suggested change:** Place plan alongside verification, tighten the email-to-license gap, and preserve separate missing/expired-license warnings. Existing 12 px metadata should not be made smaller.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-growers-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-growers-desktop.png) · [p1-growers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-growers-mobile.png) · [p2-growers-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-growers-desktop.png) · [p2-growers-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-growers-mobile.png)

### /admin/settings

**A06 · Low · Reduce navigation grouping and empty notification controls**

Five admin destinations are divided under three group headings. Empty notifications still show 0 unread and Mark all read.

**Suggested change:** Use a simpler five-item navigation list; hide irrelevant unread/action controls when notifications are empty.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-menu-mobile-viewport](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-menu-mobile-viewport.png) · [p1-notifications-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-notifications-mobile.png)

**A19 · Low · Remove implementation commentary and obvious labels**

The intro explains avoiding controls that silently fail; section subtitles restate titles, Platform:PhenoFarm repeats the shell, and notification copy mentions a future settings store.

**Suggested change:** Use “View billing, support and policies”; remove implementation history, repeated subtitles and obvious platform identity.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-mobile.png)

**A20 · Medium · Stop stretching the short support card**

The Support Profile card stretches to match billing, leaving roughly 335 px of empty white panel.

**Suggested change:** Align cards to their content height or use that area for the shorter policy information.

**Checked:** Desktop. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-mobile.png)

**A21 · Medium · Use one compact status per billing item**

Configured plus Ready, or Needs provider setup plus Review, repeats status. On mobile the short badges become full-width colored bars.

**Suggested change:** Use one status next to the label and make badges fit their text.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-mobile.png)

**A22 · Medium · Consolidate repeated setup and settlement guidance**

The same provider-setup sentence appears three times; settlement is explained in the banner, support profile and billing. The bottom price-update panel repeats it again.

**Suggested change:** Keep one provider-setup link/instruction and one settlement explanation. Give any footer action a relevant destination instead of an internal dashboard link with an external-link icon.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-mobile.png)

**A23 · Medium · Prioritize setup issues and flatten policy cards**

Billing begins around y 865 on mobile after static information. Operational policies are cards within a card, with redundant Policy badges.

**Suggested change:** Put missing configuration first; collapse reference facts and show policies as compact rows without repeated Policy labels.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-desktop.png) · [p1-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-settings-mobile.png) · [p2-settings-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-desktop.png) · [p2-settings-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-settings-mobile.png)

### /admin/users

**A01 · Low · Shorten page headings and introductions**

User Management, Cultivator Management and Dispensary Management repeat what the navigation already establishes; their subtitles add one to three lines.

**Suggested change:** Use Users, Growers and Dispensaries. Keep only necessary context, such as “View accounts and verification.” Use a consistent mobile heading size around 26–28 px instead of 32 px.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-desktop.png) · [p1-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-mobile.png) · [p2-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-desktop.png) · [p2-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-mobile.png)

**A03 · Low · Search placeholders clip on desktop**

The small desktop input visibly cuts “Search email or business”; the business directories similarly cut their longer placeholder.

**Suggested change:** Use “Email or business” and a concise visible label; size business/license search fields to their content.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-desktop.png) · [p1-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-mobile.png) · [p2-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-desktop.png) · [p2-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-mobile.png)

**A05 · Low · Simplify directory result counts**

“Showing 3 of 3 users” and “Showing 1 of 1 cultivators” use a full mobile row even when unfiltered.

**Suggested change:** Use “3 users” or “1 grower” in the unfiltered state, and place counts beside the heading/filter. Keep filtered totals when useful.

**Checked:** Desktop and mobile. Both fresh passes

Evidence: [p1-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-desktop.png) · [p1-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-mobile.png) · [p2-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-desktop.png) · [p2-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-mobile.png)

**A14 · Medium · Tighten sparse mobile account rows**

Each record occupies about 153 px with large gaps between email, business and joined date. The admin record repeats Admin twice plus an empty business dash.

**Suggested change:** Use a compact identity/status row and metadata line. Omit inapplicable business/verification rows for administrators.

**Checked:** Mobile. Both fresh passes

Evidence: [p1-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-desktop.png) · [p1-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p1-users-mobile.png) · [p2-users-desktop](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-desktop.png) · [p2-users-mobile](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/p2-users-mobile.png)

## Route inventory

53 route files: 48 page routes and 5 redirects. Auth error variants, saved tabs and404 are additional reviewed states rather than extra route files.

| Route | Type | Destination / area |
|---|---|---|
| `/admin/dashboard` | Page | admin |
| `/admin/dispensaries` | Page | admin |
| `/admin/growers` | Page | admin |
| `/admin` | Redirect | /admin/dashboard |
| `/admin/settings` | Page | admin |
| `/admin/users` | Page | admin |
| `/auth/error` | Page | public |
| `/auth/sign_in` | Page | public |
| `/auth/sign_up` | Page | public |
| `/contact` | Page | public |
| `/dashboard` | Redirect | role dashboard |
| `/dispensary/cart` | Page | dispensary |
| `/dispensary/catalog` | Page | dispensary |
| `/dispensary/dashboard` | Page | dispensary |
| `/dispensary/favorites` | Redirect | /dispensary/saved?tab=favorites |
| `/dispensary/grower/[id]` | Page | dispensary |
| `/dispensary/orders/[id]` | Page | dispensary |
| `/dispensary/orders` | Page | dispensary |
| `/dispensary/price-alerts` | Redirect | /dispensary/saved?tab=alerts |
| `/dispensary/saved` | Page | dispensary |
| `/dispensary/settings` | Page | dispensary |
| `/grower/batches/[id]/edit` | Page | grower |
| `/grower/batches/add` | Page | grower |
| `/grower/batches` | Page | grower |
| `/grower/catalog` | Page | grower |
| `/grower/customers/[id]/edit` | Page | grower |
| `/grower/customers/[id]/statement` | Page | grower |
| `/grower/customers/add` | Page | grower |
| `/grower/customers` | Page | grower |
| `/grower/dashboard` | Page | grower |
| `/grower/inventory/add` | Page | grower |
| `/grower/inventory` | Page | grower |
| `/grower/marketplace` | Page | grower |
| `/grower/orders/[id]/edit` | Page | grower |
| `/grower/orders/[id]` | Page | grower |
| `/grower/orders/add` | Page | grower |
| `/grower/orders/history` | Page | grower |
| `/grower/orders` | Page | grower |
| `/grower` | Redirect | /grower/dashboard |
| `/grower/pricing` | Page | grower |
| `/grower/products/[id]/edit` | Page | grower |
| `/grower/products/add` | Page | grower |
| `/grower/products` | Page | grower |
| `/grower/reports` | Page | grower |
| `/grower/settings` | Page | grower |
| `/grower/strains/[id]/edit` | Page | grower |
| `/grower/strains/add` | Page | grower |
| `/grower/strains` | Page | grower |
| `/help` | Page | public |
| `/legal/cookies` | Page | public |
| `/legal/privacy` | Page | public |
| `/legal/terms` | Page | public |
| `/` | Page | public |

## Detailed coverage and raw pass notes

- [public: findings.md](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/findings.md)
- [public: coverage.json](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/public/coverage.json)
- [grower: findings.md](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/findings.md)
- [grower: coverage.json](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/coverage.json)
- [admin-extra: findings.md](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/findings.md)
- [admin-extra: coverage.json](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/coverage.json)
- [admin-extra: pass-notes.md](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin-extra/pass-notes.md)
- [dispensary: findings.md](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/findings.md)
- [dispensary: coverage.json](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/dispensary/coverage.json)
- [admin: findings.md](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/findings.md)
- [admin: coverage.json](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/coverage.json)
- [admin: pass-notes.md](/Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/admin/pass-notes.md)