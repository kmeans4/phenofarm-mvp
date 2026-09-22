# Public and auth UI review — 2026-09-17

Two fresh rendered passes covered every requested route at 1440×1000 and 390×844 using the isolated `phenofarm-ui-marketing` Chrome session against `http://localhost:3144`. The homepage also received two fresh viewport-scroll passes at both widths so reveal-on-scroll sections could settle before inspection. Full-page screenshots, settled viewport captures, DOM text/geometry snapshots, and lower-page captures are under `screenshots/`. No forms were submitted.

## Confirmed opportunities

### PUB-003 · P3 · `/` · 390x844 · Mobile hero repeats the settlement promise

The hero supporting paragraph takes five mobile lines and repeats the direct-settlement/no-take-rate idea that appears again in the hero footnote and later sections.

Recommendation: Shorten “Verified partners, recorded quotes, and live request tracking from submission to delivery — while settlement moves directly between businesses. PhenoFarm never takes a cut.” to “Verified partners, recorded quotes, and live request tracking — while settlement stays direct. PhenoFarm takes no cut.”

Pass verification: Pass 2 rechecked the hero at mobile width; the paragraph remains the same five-line block and no clipping occurs.

Evidence: [`screenshots/pass1/home-mobile.png`](screenshots/pass1/home-mobile.png), [`screenshots/pass2/home-mobile.png`](screenshots/pass2/home-mobile.png)

### PUB-004 · P3 · `/help` · 1440x1000 and 390x844 · Help intro repeats the page purpose

The “HELP CENTER” eyebrow, “Practical answers for licensed marketplace teams.” heading, and explanatory paragraph all communicate the same page purpose before the question groups begin.

Recommendation: Use “Marketplace help” as the heading and “Verification, requests, quotes, settlement, and subscriptions.” as the intro, or keep the current heading and remove the eyebrow. This trims the opening copy without removing context.

Pass verification: Pass 1 and Pass 2 show the same three-layer intro at both widths; opened disclosures still retain clear context.

Evidence: [`screenshots/pass1/help-desktop.png`](screenshots/pass1/help-desktop.png), [`screenshots/pass1/help-mobile.png`](screenshots/pass1/help-mobile.png), [`screenshots/pass2/help-desktop.png`](screenshots/pass2/help-desktop.png), [`screenshots/pass2/help-mobile.png`](screenshots/pass2/help-mobile.png)

### PUB-005 · P2 · `/contact` · 390x844 · Mobile contact form starts below a long preamble

The mobile title wraps to three lines, followed by a four-line intro and three information cards before the form begins at roughly y=843px. The form is usable, but the primary contact action is pushed below a long preamble.

Recommendation: Shorten the title to “Talk about wholesale workflows” and move the email contact card beside or immediately below the intro, before the location and policy cards. Keep the full form lower on the page.

Pass verification: Pass 2 confirmed the same 1,670px page height and form start position; no horizontal overflow or control clipping was found.

Evidence: [`screenshots/pass1/contact-mobile.png`](screenshots/pass1/contact-mobile.png), [`screenshots/pass2/contact-mobile.png`](screenshots/pass2/contact-mobile.png)

### PUB-006 · P3 · `/contact` · 1440x1000 and 390x844 · Contact helper copy is longer than needed

The form helper text “Your draft will include these details so support can route the conversation quickly.” is longer than needed and repeats the surrounding support-routing context.

Recommendation: Use “These details help support route your request.”

Pass verification: Pass 1 and Pass 2 show the same helper copy in both layouts; field labels and the email-draft action remain clear.

Evidence: [`screenshots/pass1/contact-desktop.png`](screenshots/pass1/contact-desktop.png), [`screenshots/pass1/contact-mobile.png`](screenshots/pass1/contact-mobile.png), [`screenshots/pass2/contact-desktop.png`](screenshots/pass2/contact-desktop.png), [`screenshots/pass2/contact-mobile.png`](screenshots/pass2/contact-mobile.png)

### PUB-007 · P2 · `/legal/privacy` · 1440x1000 and 390x844 · Privacy draft status is duplicated

The hero warning identifies a pre-launch draft pending counsel review, then the first body card repeats the same draft-status message before substantive policy content. On mobile this adds a full card before “Information we collect.”

Recommendation: Keep one concise hero warning, such as “Pre-launch draft for counsel review.”, and remove the duplicate Draft status body card so Contents leads directly to “Information we collect.”

Pass verification: Pass 2 rechecked the top and lower sections at both widths; legal sections remain readable and the duplicate is still present.

Evidence: [`screenshots/pass1/privacy-desktop.png`](screenshots/pass1/privacy-desktop.png), [`screenshots/pass1/privacy-mobile.png`](screenshots/pass1/privacy-mobile.png), [`screenshots/pass2/privacy-desktop-bottom.png`](screenshots/pass2/privacy-desktop-bottom.png), [`screenshots/pass2/privacy-mobile-bottom.png`](screenshots/pass2/privacy-mobile-bottom.png)

### PUB-008 · P2 · `/legal/terms` · 1440x1000 and 390x844 · Terms draft status is duplicated

The hero warning and the first Draft status card repeat the pre-launch/counsel-review message before “Eligible users.” The repetition adds vertical weight to an already long mobile legal page.

Recommendation: Keep the warning once in the hero, shorten it to “Pre-launch draft for counsel review.”, and remove the duplicate Draft status card.

Pass verification: Pass 2 rechecked the complete document and bottom sections at both widths; no readability or overflow issue was found beyond the redundant status block.

Evidence: [`screenshots/pass1/terms-desktop.png`](screenshots/pass1/terms-desktop.png), [`screenshots/pass1/terms-mobile.png`](screenshots/pass1/terms-mobile.png), [`screenshots/pass2/terms-desktop-bottom.png`](screenshots/pass2/terms-desktop-bottom.png), [`screenshots/pass2/terms-mobile-bottom.png`](screenshots/pass2/terms-mobile-bottom.png)

### PUB-009 · P2 · `/legal/cookies` · 1440x1000 and 390x844 · Cookie draft status is duplicated

The hero warning and first Draft status card repeat the same pre-launch/counsel-review state before the cookie content starts. The mobile version is 3,188px tall, so the duplicate has a noticeable scroll cost.

Recommendation: Keep one concise hero warning, remove the duplicate Draft status card, and let Contents lead into “Cookies and storage.”

Pass verification: Pass 2 rechecked the top and bottom sections at both widths; the duplicate remains, while all legal content stays readable.

Evidence: [`screenshots/pass1/cookies-desktop.png`](screenshots/pass1/cookies-desktop.png), [`screenshots/pass1/cookies-mobile.png`](screenshots/pass1/cookies-mobile.png), [`screenshots/pass2/cookies-desktop-bottom.png`](screenshots/pass2/cookies-desktop-bottom.png), [`screenshots/pass2/cookies-mobile-bottom.png`](screenshots/pass2/cookies-mobile-bottom.png)

### PUB-010 · P3 · `/legal/cookies` · 1440x1000 and 390x844 · Cookie section heading is wordy

The section heading “What cookies and storage are” reads like a question fragment and is longer than the neighboring noun-based section headings.

Recommendation: Rename it to “Cookies and storage.”

Pass verification: Pass 1 and Pass 2 show the same heading at both widths; the section body remains legible.

Evidence: [`screenshots/pass1/cookies-desktop.png`](screenshots/pass1/cookies-desktop.png), [`screenshots/pass1/cookies-mobile.png`](screenshots/pass1/cookies-mobile.png), [`screenshots/pass2/cookies-desktop.png`](screenshots/pass2/cookies-desktop.png), [`screenshots/pass2/cookies-mobile.png`](screenshots/pass2/cookies-mobile.png)

### PUB-011 · P3 · `/auth/sign_in` · 1440x1000 · Sign-in marketing panel is overlong

The desktop marketing panel uses a long three-line headline, “Wholesale cannabis workflows without payment confusion.”, while the adjacent form already establishes sign-in context and the supporting paragraph repeats workflow/payment language.

Recommendation: Shorten the marketing headline to “Wholesale workflows, without payment confusion.” and trim the paragraph to one sentence. Keep the marketing panel hidden on mobile as it is today.

Pass verification: Pass 2 rechecked the desktop form and password-visibility state; controls remain aligned and the mobile form remains focused without the marketing panel.

Evidence: [`screenshots/pass1/sign-in-desktop.png`](screenshots/pass1/sign-in-desktop.png), [`screenshots/pass2/sign-in-desktop.png`](screenshots/pass2/sign-in-desktop.png)

### PUB-012 · P3 · `/auth/sign_up` · 1440x1000 · Sign-up marketing panel repeats the form promise

The desktop marketing panel headline “Build a verified marketplace profile in one pass.” and the paragraph beginning “Create one account...” repeat the same account-creation promise already shown by the form heading.

Recommendation: Use “Build your verified profile.” for the marketing headline and keep the paragraph focused on the two workflows: “One account covers grower catalog or dispensary buying workflows.”

Pass verification: Pass 2 rechecked the desktop role selection and password visibility state; the form remains readable and the additional dispensary guidance fits.

Evidence: [`screenshots/pass1/sign-up-desktop.png`](screenshots/pass1/sign-up-desktop.png), [`screenshots/pass2/sign-up-desktop.png`](screenshots/pass2/sign-up-desktop.png), [`screenshots/pass2/sign-up-desktop-dispensary-password-visible.png`](screenshots/pass2/sign-up-desktop-dispensary-password-visible.png)

### PUB-013 · P3 · `/auth/sign_up` · 390x844 · Mobile sign-up disclosure wraps awkwardly

The mobile legal disclosure wraps into two centered lines with a large gap created by the line break: “By signing up, you agree to our Terms of Service” followed by “and Privacy Policy.”

Recommendation: Shorten the copy to “By signing up, you agree to the Terms and Privacy Policy.” while retaining both links inline.

Pass verification: Pass 2 rechecked the default grower and selected dispensary states; the disclosure remains readable and does not overflow.

Evidence: [`screenshots/pass1/sign-up-mobile.png`](screenshots/pass1/sign-up-mobile.png), [`screenshots/pass2/sign-up-mobile.png`](screenshots/pass2/sign-up-mobile.png), [`screenshots/pass2/sign-up-mobile-dispensary-password-visible.png`](screenshots/pass2/sign-up-mobile-dispensary-password-visible.png)

### PUB-014 · P3 · `/auth/error?error=Configuration` · 1440x1000 · Configuration error repeats marketing copy

Both desktop error states reuse the same long marketing panel (“Get back into your marketplace workspace.”), the same two-sentence support explanation, and the same three bullets. The right card correctly distinguishes this state, so the repeated left panel is the remaining copy weight.

Recommendation: Use a shorter shared panel such as “Need access? We can help.” with one concise support line, leaving the specific error title and red message on the right.

Pass verification: Pass 2 rechecked this error state and its back-to-sign-in/contact-support actions; the mobile card remains concise and clear.

Evidence: [`screenshots/pass1/error-configuration-desktop.png`](screenshots/pass1/error-configuration-desktop.png), [`screenshots/pass2/error-configuration-desktop.png`](screenshots/pass2/error-configuration-desktop.png)

### PUB-015 · P3 · `/auth/error?error=CredentialsSignin` · 1440x1000 · Credentials error repeats marketing copy

Both desktop error states reuse the same long marketing panel (“Get back into your marketplace workspace.”), the same two-sentence support explanation, and the same three bullets. The right card correctly distinguishes this state, so the repeated left panel is the remaining copy weight.

Recommendation: Use a shorter shared panel such as “Need access? We can help.” with one concise support line, leaving the specific error title and red message on the right.

Pass verification: Pass 2 rechecked this error state and its back-to-sign-in/contact-support actions; the mobile card remains concise and clear.

Evidence: [`screenshots/pass1/error-credentials-desktop.png`](screenshots/pass1/error-credentials-desktop.png), [`screenshots/pass2/error-credentials-desktop.png`](screenshots/pass2/error-credentials-desktop.png)

### PUB-016 · P3 · `/` · 1440x1000 and 390x844 · Testimonial-to-pricing transition has excess vertical space

After the final testimonial cards and the “Illustrative customer scenarios.” disclaimer, the Pricing eyebrow sits after a low-content transition of roughly 300px on desktop and 240px on mobile. The content is fully rendered; the issue is the repeated section padding at this boundary.

Recommendation: Reduce the shared bottom padding after testimonials or top padding before pricing by roughly 25–35%, keeping a deliberate but shorter transition before the pricing heading.

Pass verification: Pass 1 and Pass 2 show the same settled transition at both widths; all testimonials and the pricing heading are visible, so this replaces the withdrawn missing-content gap claim with a narrower spacing observation.

Evidence: [`screenshots/settled/pass1/desktop/y04200.png`](screenshots/settled/pass1/desktop/y04200.png), [`screenshots/settled/pass2/desktop/y04200.png`](screenshots/settled/pass2/desktop/y04200.png), [`screenshots/settled/pass1/mobile/y05664.png`](screenshots/settled/pass1/mobile/y05664.png), [`screenshots/settled/pass2/mobile/y05664.png`](screenshots/settled/pass2/mobile/y05664.png)

### PUB-017 · P3 · `/` · 390x844 · Mobile footer repeats Privacy and Terms links

The mobile footer stacks the Growers, Dispensaries, and Company groups into a long single column. Company includes “Privacy policy” and “Terms of service”, then the bottom legal row repeats those destinations as “Privacy” and “Terms” alongside “Cookies”.

Recommendation: Keep Contact and Help center in the Company group, remove the duplicate Privacy policy and Terms of service entries there, and retain one compact bottom row for Privacy, Terms, and Cookies.

Pass verification: Pass 1 and Pass 2 show the same one-column footer density and repeated policy destinations at 390x844.

Evidence: [`screenshots/settled/pass1/mobile/y09912.png`](screenshots/settled/pass1/mobile/y09912.png), [`screenshots/settled/pass1/mobile/y10319.png`](screenshots/settled/pass1/mobile/y10319.png), [`screenshots/settled/pass2/mobile/y09912.png`](screenshots/settled/pass2/mobile/y09912.png), [`screenshots/settled/pass2/mobile/y10319.png`](screenshots/settled/pass2/mobile/y10319.png)

## Withdrawn after settled scroll verification

PUB-001 (mobile homepage gaps) and PUB-002 (desktop homepage gaps) are withdrawn. The initial full-page captures jumped over Framer Motion `whileInView` reveal triggers, so they made rendered sections look absent or low-density. Two fresh viewport-scroll passes used instant scroll positions and a 1.1-second settle at each position; every homepage section rendered at both widths, including metrics, money flow, the platform tour, personas, testimonials, pricing, FAQ, CTA, and the full footer. No broad missing-content or dead-space finding remains from that screenshot artifact; PUB-016 records the narrower settled transition gap above.

Evidence: [`screenshots/settled/pass1/desktop/y00000.png`](screenshots/settled/pass1/desktop/y00000.png), [`screenshots/settled/pass1/desktop/y05040.png`](screenshots/settled/pass1/desktop/y05040.png), [`screenshots/settled/pass1/desktop/y06720.png`](screenshots/settled/pass1/desktop/y06720.png), [`screenshots/settled/pass1/mobile/y00000.png`](screenshots/settled/pass1/mobile/y00000.png), [`screenshots/settled/pass1/mobile/y07080.png`](screenshots/settled/pass1/mobile/y07080.png), [`screenshots/settled/pass1/mobile/y09204.png`](screenshots/settled/pass1/mobile/y09204.png), [`screenshots/settled/pass2/desktop/y06720.png`](screenshots/settled/pass2/desktop/y06720.png), [`screenshots/settled/pass2/mobile/y09204.png`](screenshots/settled/pass2/mobile/y09204.png).

The narrow source scan found the homepage and `/contact` reveal hooks; the settled contact captures show the form after the mobile scroll and the complete desktop layout in both passes. The help, legal, and auth pages have no reveal hooks in the reviewed source paths, and their existing baseline plus lower-page captures remain valid.

## Coverage and no-finding screens

All 20 baseline screen captures were revisited in Pass 2. The interaction states listed below were also opened and inspected. They had no additional actionable layout or copy finding:

Baseline screens with no finding in this pass: `/auth/sign_in` at 390×844, `/auth/error?error=Configuration` at 390×844, and `/auth/error?error=CredentialsSignin` at 390×844.

- `/help`: grower disclosure at mobile and dispensary payment disclosure at desktop.
- `/auth/sign_in`: password visibility at desktop and mobile.
- `/auth/sign_up`: dispensary role selection plus password visibility at desktop and mobile.
- `/auth/error?error=Configuration` and `/auth/error?error=CredentialsSignin`: desktop and mobile cards, back-to-sign-in, and contact-support actions.
- Bottom sections and contact cards on all three legal pages at desktop and mobile.

Legal body text was kept at its readable size during review; findings target duplication and wording rather than shrinking legal copy.

See [`coverage.json`](coverage.json) for the complete route/viewport matrix and [`findings.json`](findings.json) for machine-readable findings.
