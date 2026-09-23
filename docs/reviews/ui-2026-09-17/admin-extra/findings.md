# admin-extra findings

22 findings. Main screens reviewed in two fresh passes at 1440 px and 390 px; extra states and widths have their own evidence.

## E01 — Shorten report headings and repeated range wording
**Low · /grower/reports · Desktop and mobile**

Analytics & Reports repeats the navigation label; four KPI helpers repeat the selected date range, plus settlement and export explanations.

**Recommendation:** Use Reports, Delivered value and Avg. delivered value; state the date range once and omit routine export/settlement reminders. Preserve the distinction between delivered value and paid revenue.

Evidence: [p1-reports-desktop](../admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](../admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](../admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](../admin-extra/p2-reports-mobile.png)

## E02 — Compact mobile exports and date presets
**Medium · /grower/reports · Mobile**

Two full-width export buttons, a helper line and a two-row date-range card precede the metrics.

**Recommendation:** Use one Export menu or inline PDF/CSV; use 30 d,90 d,12 mo,All with full accessible names.

Evidence: [p1-reports-desktop](../admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](../admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](../admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](../admin-extra/p2-reports-mobile.png)

## E03 — Remove the orphan KPI half-row
**Medium · /grower/reports · Mobile**

The first metric spans the full row; the next three create an empty lower-right half-row. The trend starts around y 887.

**Recommendation:** Use a consistent 2×2 mobile grid, with subtle highlighting instead of forcing the first metric full-width.

Evidence: [p1-reports-desktop](../admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](../admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](../admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](../admin-extra/p2-reports-mobile.png)

## E04 — Right-size a one-period chart and empty statuses
**Medium · /grower/reports · Desktop and mobile**

The one-period chart has a 490 px-wide bar and roughly 200 px unused space below it. Four of six status rows contain zero in the sampled 90 day view.

**Recommendation:** Constrain bar width and chart height for sparse data; present zero statuses compactly or under a reveal control. Preserve access to every status.

Evidence: [p1-reports-desktop](../admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](../admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](../admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](../admin-extra/p2-reports-mobile.png)

## E05 — Correct the month displayed on the trend
**High · /grower/reports · Desktop and mobile**

September sample request value is labeled Aug 26 in both passes and the 30 day view. The month formatter parses a UTC month-start date then displays it in local time.

**Recommendation:** Format year/month as a calendar month without timezone shifting; verify September remains September across timezones.

Evidence: [p1-reports-desktop](../admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](../admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](../admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](../admin-extra/p2-reports-mobile.png)

## E06 — Use singular count wording
**Low · /grower/reports · Desktop and mobile**

The sample renders “1 delivered requests” and “1 orders”.

**Recommendation:** Use “1 delivered request” and “1 order”.

Evidence: [p1-reports-desktop](../admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](../admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](../admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](../admin-extra/p2-reports-mobile.png)

## E07 — Preserve customer context in the compact mobile list
**Medium · /grower/reports · Mobile**

Recent Requests hides customer and date, leaving cryptic IDs, status and value.

**Recommendation:** Make customer the primary row label, with a short date/ID metadata line; keep status and value alongside.

Evidence: [p1-reports-desktop](../admin-extra/p1-reports-desktop.png) · [p1-reports-mobile](../admin-extra/p1-reports-mobile.png) · [p2-reports-desktop](../admin-extra/p2-reports-desktop.png) · [p2-reports-mobile](../admin-extra/p2-reports-mobile.png)

## E08 — Reduce the plan-page preamble
**Medium · /grower/pricing · Desktop and mobile**

The first plan begins around y 825 on mobile. A two-line title, long disclosure and large current-plan panel repeat information before comparisons.

**Recommendation:** Use Plans; one short subscription/settlement disclosure; a compact “Current plan: Free” line. Preserve price and billing terms.

Evidence: [p1-pricing-desktop](../admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](../admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](../admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](../admin-extra/p2-pricing-mobile.png)

## E09 — Show useful unavailable-upgrade copy
**Medium · /grower/pricing · Desktop and mobile**

The local unavailable state tells growers to add STRIPE_PRO_PRICE_ID or STRIPE_BUSINESS_PRICE_ID.

**Recommendation:** Show “Paid upgrades are unavailable. Contact support.” Put configuration steps in the admin view. This is not a claim about production billing.

Evidence: [p1-pricing-desktop](../admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](../admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](../admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](../admin-extra/p2-pricing-mobile.png)

## E10 — Remove repeated plan labels and features
**Low · /grower/pricing · Desktop and mobile**

Free/current plan is repeated across the summary, badge and button; Pro lists priority support twice; some Free entitlements overlap vaguely.

**Recommendation:** Keep one current-plan badge, one support benefit and distinct concise entitlements. Make the Free status badge fit-content on mobile.

Evidence: [p1-pricing-desktop](../admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](../admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](../admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](../admin-extra/p2-pricing-mobile.png)

## E11 — Make mobile plan comparison less scroll-heavy
**Medium · /grower/pricing · Mobile**

The three plans require over 2200 px of page height; Pro starts around y 1287.

**Recommendation:** Use compact plan summaries with optional feature expansion or a concise comparison. Keep actual prices, annual terms and primary actions visible.

Evidence: [p1-pricing-desktop](../admin-extra/p1-pricing-desktop.png) · [p1-pricing-mobile](../admin-extra/p1-pricing-mobile.png) · [p2-pricing-desktop](../admin-extra/p2-pricing-desktop.png) · [p2-pricing-mobile](../admin-extra/p2-pricing-mobile.png)

## E12 — Explain settlement once
**Medium · /grower/settings · Desktop and mobile**

The subscription panel, separate Wholesale Settlement panel and Commercial terms note repeat the payment boundary.

**Recommendation:** Keep one concise disclosure near the relevant subscription/terms action and remove the separate repeated explanation.

Evidence: [p1-settings-desktop](../admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](../admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](../admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](../admin-extra/p2-settings-mobile.png)

## E13 — Rebalance profile and logo space
**Medium · /grower/settings · Desktop**

The business form occupies a single narrow column while the short logo card leaves a large unused column below it. The app sidebar plus section sidebar further compress the form.

**Recommendation:** Put logo in a compact profile header, arrange short fields in two columns on desktop and consider horizontal section navigation.

Evidence: [p1-settings-desktop](../admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](../admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](../admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](../admin-extra/p2-settings-mobile.png)

## E14 — Restore mobile section navigation
**Medium · /grower/settings · Mobile**

The page is 3606 px tall, Business profile starts at y 1902, and the desktop section navigation disappears on mobile.

**Recommendation:** Add a compact section chooser or anchored tabs so users can reach Profile, Terms and Branding directly.

Evidence: [p1-settings-desktop](../admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](../admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](../admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](../admin-extra/p2-settings-mobile.png)

## E15 — Reduce the persistent save strip and clarify its scope
**Medium · /grower/settings · Mobile**

An untouched page reserves 92 px at the bottom for Save settings and a draft note. Commercial terms simultaneously has its own Save terms control.

**Recommendation:** Show a compact save strip when relevant/dirty; label its scope “Save profile” if it only saves profile fields. Keep Save terms distinct.

Evidence: [p1-settings-desktop](../admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](../admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](../admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](../admin-extra/p2-settings-mobile.png)

## E16 — Replace repeated form instructions with targeted guidance
**Low · /grower/settings · Desktop and mobile**

Required-first prose lists fields already marked required; Business prefixes repeat within the profile; title/nav names vary between Business Information and Business profile.

**Recommendation:** Use Settings, Business profile, Name/Email/Phone/Address, Logo and Upload. Show one short required-field key or only the missing required items.

Evidence: [p1-settings-desktop](../admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](../admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](../admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](../admin-extra/p2-settings-mobile.png)

## E17 — Keep the contact note readable
**Medium · /grower/settings · Mobile**

The single-line Contact note input clips the end of its default sentence on mobile.

**Recommendation:** Use a concise default such as “Message before confirming fulfillment” or a compact two-line field when longer content is needed.

Evidence: [p1-settings-desktop](../admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](../admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](../admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](../admin-extra/p2-settings-mobile.png)

## E18 — Remove the redundant desktop sign-out card
**Low · /grower/settings · Desktop**

An Account card repeats the sign-out action already in the sidebar.

**Recommendation:** Use one consistent account action; retain a clear mobile route to sign out.

Evidence: [p1-settings-desktop](../admin-extra/p1-settings-desktop.png) · [p1-settings-mobile](../admin-extra/p1-settings-mobile.png) · [p2-settings-desktop](../admin-extra/p2-settings-desktop.png) · [p2-settings-mobile](../admin-extra/p2-settings-mobile.png)

## E19 — State the preview purpose once
**Medium · /grower/marketplace · Desktop and mobile**

Page title/intro, Buyer preview heading/subtitle and a green banner repeat the same purpose.

**Recommendation:** Use Marketplace preview and one sentence: “How buyers see your listings.” Use Add product for the primary action.

Evidence: [p1-marketplace-desktop](../admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](../admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](../admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](../admin-extra/p2-marketplace-mobile.png)

## E20 — Replace four stacked preamble cards
**Medium · /grower/marketplace · Mobile**

Two counts and two standing instructions get equally large cards; the mobile preview heading starts at y 739.

**Recommendation:** Use compact Active and Quote required counts, then one Terms link and a short relevant policy note.

Evidence: [p1-marketplace-desktop](../admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](../admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](../admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](../admin-extra/p2-marketplace-mobile.png)

## E21 — Remove nested mobile card padding
**Medium · /grower/marketplace · Mobile**

The preview panel and product cards both add borders/padding, leaving about 278 px for content inside a 390 px screen.

**Recommendation:** Use a single product-card shell on mobile and remove the outer preview padding.

Evidence: [p1-marketplace-desktop](../admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](../admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](../admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](../admin-extra/p2-marketplace-mobile.png)

## E22 — Simplify shared product-card repetition
**Medium · /grower/marketplace · Desktop and mobile**

Large placeholder art repeats category; cards repeat stock status/quantity, unit and long lab-availability text. Three products make the mobile page 3011 px tall.

**Recommendation:** Shrink placeholder-only art, use category once, condense stock/unit and use “Lab results: request”. Coordinate with the buyer catalog so preview stays accurate. Preserve supplied photos and safety-relevant lab facts.

Evidence: [p1-marketplace-desktop](../admin-extra/p1-marketplace-desktop.png) · [p1-marketplace-mobile](../admin-extra/p1-marketplace-mobile.png) · [p2-marketplace-desktop](../admin-extra/p2-marketplace-desktop.png) · [p2-marketplace-mobile](../admin-extra/p2-marketplace-mobile.png)

## E23 — Give missing pages a recovery action

The default 404 has no recovery link. Use “Page not found” plus Home/Back to dashboard with normal brand treatment. Both desktop/mobile states rechecked in two passes. Blank error-page space does not need filler.
