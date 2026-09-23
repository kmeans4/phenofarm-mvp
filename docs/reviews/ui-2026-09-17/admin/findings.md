# admin findings

23 findings. Main screens reviewed in two fresh passes at 1440 px and 390 px; extra states and widths have their own evidence.

## A01 — Shorten page headings and introductions
**Low · /admin/users · Desktop and mobile**

User Management, Cultivator Management and Dispensary Management repeat what the navigation already establishes; their subtitles add one to three lines.

**Recommendation:** Use Users, Growers and Dispensaries. Keep only necessary context, such as “View accounts and verification.” Use a consistent mobile heading size around 26–28 px instead of 32 px.

Evidence: [p1-users-desktop](../admin/p1-users-desktop.png) · [p1-users-mobile](../admin/p1-users-mobile.png) · [p2-users-desktop](../admin/p2-users-desktop.png) · [p2-users-mobile](../admin/p2-users-mobile.png)

## A02 — Standardize business-role names
**Medium · /admin/dashboard · Desktop and mobile**

Growers/Cultivators and Buyers/Dispensaries vary between navigation, headings and buttons on the same screen.

**Recommendation:** Choose one visible term per role; retain alternative legal wording only where needed.

Evidence: [p1-dashboard-desktop](../admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](../admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](../admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](../admin/p2-dashboard-mobile.png)

## A03 — Search placeholders clip on desktop
**Low · /admin/users · Desktop and mobile**

The small desktop input visibly cuts “Search email or business”; the business directories similarly cut their longer placeholder.

**Recommendation:** Use “Email or business” and a concise visible label; size business/license search fields to their content.

Evidence: [p1-users-desktop](../admin/p1-users-desktop.png) · [p1-users-mobile](../admin/p1-users-mobile.png) · [p2-users-desktop](../admin/p2-users-desktop.png) · [p2-users-mobile](../admin/p2-users-mobile.png)

## A04 — Mobile directory controls consume too many rows
**Medium · /admin/growers · Mobile**

Growers and Dispensaries use a 160 px three-row form; Users uses a 113 px two-row form. The first records start around y 413–425.

**Recommendation:** Keep search field and Search button together; put status and result count on a compact second row. Preserve usable tap targets.

Evidence: [p1-growers-desktop](../admin/p1-growers-desktop.png) · [p1-growers-mobile](../admin/p1-growers-mobile.png) · [p2-growers-desktop](../admin/p2-growers-desktop.png) · [p2-growers-mobile](../admin/p2-growers-mobile.png)

## A05 — Simplify directory result counts
**Low · /admin/users · Desktop and mobile**

“Showing 3 of 3 users” and “Showing 1 of 1 cultivators” use a full mobile row even when unfiltered.

**Recommendation:** Use “3 users” or “1 grower” in the unfiltered state, and place counts beside the heading/filter. Keep filtered totals when useful.

Evidence: [p1-users-desktop](../admin/p1-users-desktop.png) · [p1-users-mobile](../admin/p1-users-mobile.png) · [p2-users-desktop](../admin/p2-users-desktop.png) · [p2-users-mobile](../admin/p2-users-mobile.png)

## A06 — Reduce navigation grouping and empty notification controls
**Low · /admin/settings · Desktop and mobile**

Five admin destinations are divided under three group headings. Empty notifications still show 0 unread and Mark all read.

**Recommendation:** Use a simpler five-item navigation list; hide irrelevant unread/action controls when notifications are empty.

Evidence: [p1-menu-mobile-viewport](../admin/p1-menu-mobile-viewport.png) · [p1-notifications-mobile](../admin/p1-notifications-mobile.png)

## A07 — Make confirmation wording specific
**Medium · /admin/dispensaries · Desktop and mobile**

The verification dialog uses generic “Confirm admin action” and “Confirm”; its alert background stretches into a tall pill beside wrapped text.

**Recommendation:** Use “Remove verification?” and “Remove verification”; keep the alert icon square and aligned at the top.

Evidence: [p2-unverify-dialog-mobile](../admin/p2-unverify-dialog-mobile.png)

## A08 — Compact the mobile metric cards
**Medium · /admin/dashboard · Mobile**

Three one-column cards consume roughly 395 px before any checklist action. Helpers repeat already-understood verification context.

**Recommendation:** Use compact count cards/row and “1 verified” / “0 pending” helpers.

Evidence: [p1-dashboard-desktop](../admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](../admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](../admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](../admin/p2-dashboard-mobile.png)

## A09 — Collapse completed checklist items
**Medium · /admin/dashboard · Desktop and mobile**

Three completed checks remain expanded with individual buttons. The operations panel is about 728 px tall on mobile, and Open settings appears twice.

**Recommendation:** Lead with outstanding work, summarize completed checks behind “3 checks complete”, and retain only one primary settings action.

Evidence: [p1-dashboard-desktop](../admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](../admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](../admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](../admin/p2-dashboard-mobile.png)

## A10 — Shrink the clear verification queue
**Medium · /admin/dashboard · Desktop and mobile**

A large card uses both Pending verification and Newest accounts awaiting review, then says the queue is clear.

**Recommendation:** Show “No accounts awaiting review” as a short status row; expand the queue only when it contains work.

Evidence: [p1-dashboard-desktop](../admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](../admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](../admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](../admin/p2-dashboard-mobile.png)

## A11 — Move the standing business-model explanation
**Low · /admin/dashboard · Desktop and mobile**

A blue banner repeats the subscription/settlement policy on the routine dashboard, adding about 164 px on mobile.

**Recommendation:** Put the full explanation in billing/help and keep a short link here only if needed.

Evidence: [p1-dashboard-desktop](../admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](../admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](../admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](../admin/p2-dashboard-mobile.png)

## A12 — Simplify the development-only seeding panel
**Low · /admin/dashboard · Desktop and mobile**

The local-only panel repeats Demo data seeding, Seed demo accounts and Seed demo data inside nested cards. Source confirms this panel is hidden in production.

**Recommendation:** Use one collapsed developer-tools row and one action. This is development-only polish, not a production finding.

Evidence: [p1-dashboard-desktop](../admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](../admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](../admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](../admin/p2-dashboard-mobile.png)

## A13 — Make dashboard counts match their destinations
**Medium · /admin/dashboard · Desktop and mobile**

The clone shows 2 Dispensaries on the dashboard but 1 of 1 in the linked directory. The dashboard includes an off-platform contact that the directory excludes.

**Recommendation:** Count the same scope as the destination or label platform accounts and saved contacts separately. This was demonstrated with isolated sample data.

Evidence: [p1-dashboard-desktop](../admin/p1-dashboard-desktop.png) · [p1-dashboard-mobile](../admin/p1-dashboard-mobile.png) · [p2-dashboard-desktop](../admin/p2-dashboard-desktop.png) · [p2-dashboard-mobile](../admin/p2-dashboard-mobile.png)

## A14 — Tighten sparse mobile account rows
**Medium · /admin/users · Mobile**

Each record occupies about 153 px with large gaps between email, business and joined date. The admin record repeats Admin twice plus an empty business dash.

**Recommendation:** Use a compact identity/status row and metadata line. Omit inapplicable business/verification rows for administrators.

Evidence: [p1-users-desktop](../admin/p1-users-desktop.png) · [p1-users-mobile](../admin/p1-users-mobile.png) · [p2-users-desktop](../admin/p2-users-desktop.png) · [p2-users-mobile](../admin/p2-users-mobile.png)

## A15 — Use compact verification metadata
**Medium · /admin/growers · Mobile**

A single grower card is about 270 px tall; subscription uses another section despite a short Free value.

**Recommendation:** Place plan alongside verification, tighten the email-to-license gap, and preserve separate missing/expired-license warnings. Existing 12 px metadata should not be made smaller.

Evidence: [p1-growers-desktop](../admin/p1-growers-desktop.png) · [p1-growers-mobile](../admin/p1-growers-mobile.png) · [p2-growers-desktop](../admin/p2-growers-desktop.png) · [p2-growers-mobile](../admin/p2-growers-mobile.png)

## A16 — Remove repeated ordering-policy copy from rows
**Medium · /admin/dispensaries · Desktop and mobile**

Every desktop row repeats “Wholesale settlement stays direct” under ordering readiness. On mobile Ordering/Can submit requests gets a separate section.

**Recommendation:** Use a compact “Can order” status and keep the static settlement explanation in one relevant location.

Evidence: [p1-dispensaries-desktop](../admin/p1-dispensaries-desktop.png) · [p1-dispensaries-mobile](../admin/p1-dispensaries-mobile.png) · [p2-dispensaries-desktop](../admin/p2-dispensaries-desktop.png) · [p2-dispensaries-mobile](../admin/p2-dispensaries-mobile.png)

## A17 — Give business and license identifiers enough room
**Medium · /admin/dispensaries · Desktop**

Eight columns make business names, licenses and normal expiry dates wrap even at 1440 px. Normal expiry dates are padded badges.

**Recommendation:** Use plain compact dates, combine closely related status fields, and reserve width for identifiers. Show badges for exceptions, not every normal date.

Evidence: [p1-dispensaries-desktop](../admin/p1-dispensaries-desktop.png) · [p1-dispensaries-mobile](../admin/p1-dispensaries-mobile.png) · [p2-dispensaries-desktop](../admin/p2-dispensaries-desktop.png) · [p2-dispensaries-mobile](../admin/p2-dispensaries-mobile.png)

## A18 — Delay the wide table/header layout at tablet widths
**Medium · /admin/dispensaries · Tablet 1024 px**

At 1024 px the title is squeezed to about 230 px beside 487 px filters. The table has 980 px content in 718 px space; actions are offscreen with little scrolling indication.

**Recommendation:** Stack header controls earlier and use cards or fewer columns until the content area is wide enough; retain a clear scroll affordance if a table must scroll.

Evidence: [p2-dispensaries-tablet](../admin/p2-dispensaries-tablet.png)

## A19 — Remove implementation commentary and obvious labels
**Low · /admin/settings · Desktop and mobile**

The intro explains avoiding controls that silently fail; section subtitles restate titles, Platform:PhenoFarm repeats the shell, and notification copy mentions a future settings store.

**Recommendation:** Use “View billing, support and policies”; remove implementation history, repeated subtitles and obvious platform identity.

Evidence: [p1-settings-desktop](../admin/p1-settings-desktop.png) · [p1-settings-mobile](../admin/p1-settings-mobile.png) · [p2-settings-desktop](../admin/p2-settings-desktop.png) · [p2-settings-mobile](../admin/p2-settings-mobile.png)

## A20 — Stop stretching the short support card
**Medium · /admin/settings · Desktop**

The Support Profile card stretches to match billing, leaving roughly 335 px of empty white panel.

**Recommendation:** Align cards to their content height or use that area for the shorter policy information.

Evidence: [p1-settings-desktop](../admin/p1-settings-desktop.png) · [p1-settings-mobile](../admin/p1-settings-mobile.png) · [p2-settings-desktop](../admin/p2-settings-desktop.png) · [p2-settings-mobile](../admin/p2-settings-mobile.png)

## A21 — Use one compact status per billing item
**Medium · /admin/settings · Desktop and mobile**

Configured plus Ready, or Needs provider setup plus Review, repeats status. On mobile the short badges become full-width colored bars.

**Recommendation:** Use one status next to the label and make badges fit their text.

Evidence: [p1-settings-desktop](../admin/p1-settings-desktop.png) · [p1-settings-mobile](../admin/p1-settings-mobile.png) · [p2-settings-desktop](../admin/p2-settings-desktop.png) · [p2-settings-mobile](../admin/p2-settings-mobile.png)

## A22 — Consolidate repeated setup and settlement guidance
**Medium · /admin/settings · Desktop and mobile**

The same provider-setup sentence appears three times; settlement is explained in the banner, support profile and billing. The bottom price-update panel repeats it again.

**Recommendation:** Keep one provider-setup link/instruction and one settlement explanation. Give any footer action a relevant destination instead of an internal dashboard link with an external-link icon.

Evidence: [p1-settings-desktop](../admin/p1-settings-desktop.png) · [p1-settings-mobile](../admin/p1-settings-mobile.png) · [p2-settings-desktop](../admin/p2-settings-desktop.png) · [p2-settings-mobile](../admin/p2-settings-mobile.png)

## A23 — Prioritize setup issues and flatten policy cards
**Medium · /admin/settings · Mobile**

Billing begins around y 865 on mobile after static information. Operational policies are cards within a card, with redundant Policy badges.

**Recommendation:** Put missing configuration first; collapse reference facts and show policies as compact rows without repeated Policy labels.

Evidence: [p1-settings-desktop](../admin/p1-settings-desktop.png) · [p1-settings-mobile](../admin/p1-settings-mobile.png) · [p2-settings-desktop](../admin/p2-settings-desktop.png) · [p2-settings-mobile](../admin/p2-settings-mobile.png)
