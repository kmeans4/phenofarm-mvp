# PhenoFarm — Full-App UI Polish Prompt (round 2)

**Date:** 2026-06-11 (re-audit) · **Method:** every route re-screenshotted and mechanically checked at 1440 / 768 / 390 px across all three roles (135 route×breakpoint audits), plus every popup/drawer/sheet/menu reopened.

**State of the app:** the previous round's fixes verified clean — zero horizontal overflow on any route at any breakpoint, zero console errors, admin mobile card layouts, FAB overlay-hiding, branded product-image placeholders, grouped dashboard attention center, cart review modal dedupe, chat composer restructure, and the contact/order-page overflows are all confirmed fixed. What remains below is a much shorter, sharper list. Copy the block into Codex as one task.

---

```
You are working in /Users/sam/dev/phenofarm-mvp (Next.js 16 App Router + Tailwind v4 + Prisma). PhenoFarm is a B2B cannabis marketplace with grower / dispensary / admin roles (demo logins grower@vtnurseries.com, dispensary@greenvermont.com, admin@phenofarm.com — password `password123`; dev server `npm run dev -- -p 3011`). The current design language — dark forest-green sidebar, cream canvas, serif editorial page titles, stacked clock/chat floating buttons — is correct and recently polished. This task is a final refinement pass from a fresh 3-breakpoint screenshot audit; make ONLY the changes below, inside the existing design language. Run `npm run verify` at the end.

━━━━━━━━ A. GLOBAL ━━━━━━━━

A1. Remaining sub-40px tap targets (everything else was already fixed — extend the same `inline-flex min-h-10 items-center` treatment used in app/landing/footer.tsx to these last spots, without changing visual size):
   - /legal/privacy and /legal/terms: the support@phenofarm.com link (18px).
   - /grower/marketplace: the three "Edit listing" links (18px).
   - /grower/orders/history: the row "View" link (16px).
   - /grower/orders/[id]: the customer-name link in the Customer card (23px).
   - /dispensary/catalog, /dispensary/saved, /dispensary/favorites, /dispensary/price-alerts: the "Vermont Nurseries" grower-name links on product cards (18px).
   - /admin/users: the linked business names (18px).

A2. On /grower/dashboard (and check /dispensary/dashboard) at 1440px, the stacked clock/chat floating buttons sit directly over the setup checklist's right-aligned action buttons ("Set terms", the "Complete" chips) at the initial scroll position. The FABs already hide for overlays; for resting-page collisions, shrink the FAB stack to 44px buttons anchored tight to the corner (right-3 bottom-3) AND give the setup-checklist card `lg:pr-16` (or move its action column in from the right edge) so its buttons never start underneath the stack.

━━━━━━━━ B. GROWER PORTAL ━━━━━━━━

B1. /grower/orders/[id] — Fulfillment Timeline polish (the overflow itself is fixed; now it's cramped):
   - Step labels nearly touch ("Submitted" and "Accepted" run together) and "Ready / In transit" wraps to two lines while every other label is one. Rename the step label to "Ready" in the horizontal timeline (keep the long form in tooltips/help text), and give steps an even fixed basis (e.g. grid-cols-5 or flex-1 with min gap) so labels are evenly spaced.
   - The card subtitle "Order request #ORD-…" duplicates the page H1 right above it. Replace the subtitle with something useful ("5 stages · updated Jun 11, 12:44 PM") or remove it.
   - In the Requested Items card, the totals block (Estimated item value / Estimated request value) renders as a full-width cream band with an awkward empty left half. Constrain the totals block to the right (max-w-sm ml-auto) or give the left half content (e.g. the settlement note), so there's no dead band.

B2. /grower/products — Quick add panel silently restores a previous draft (it reopened pre-filled with "Blueberries NF" / 45.00 with no explanation). When a saved draft prefills the panel, show a small inline notice: "Draft restored · Clear" (Clear resets to catalog defaults). No notice when the panel opens empty.

B3. /grower/marketplace — the "Buyer preview" cards render fully live-looking buyer controls: Qty steppers, "+ Add to Request", "Message Grower", and "Request Pricing" buttons. For a grower this is a preview, not a shop — make everything except "Edit listing" non-interactive: wrap the buyer-action area in a `pointer-events-none opacity-80` container (aria-hidden) and rely on the existing "This is how your listings appear to verified dispensaries" banner. Keep "Edit listing" fully interactive.

B4. /grower/settings — two leftovers:
   - The sticky save bar renders an empty washed-out pill next to "Save settings" when there is no draft-status message. Make DraftAutosaveStatus (app/components/ux/DraftAutosaveStatus.tsx) return null when it has nothing to show, so the slot collapses.
   - Confirm the "Sections" side nav (Subscription / Commercial terms / Business profile / Branding) is `sticky top-6 self-start` on lg+ so it stays visible while scrolling this long page; it currently scrolls away with the page. Keep the active-section highlight it already has.

━━━━━━━━ C. DISPENSARY PORTAL ━━━━━━━━

C1. /dispensary/orders/[id] at 390px — the sticky bottom action bar shows "Buyer actions" plus a second, clipped element on its left that renders as a truncated white chip reading "…ers" (unusable). Find the sticky bar's contents in app/dispensary/orders/[id]/ (OrderDetailActions + StickyMobileActionBar): either give both actions a two-column grid with room to render fully, or drop the secondary slot from the sticky bar on this page. Nothing in the bar may truncate to an unreadable stub.

C2. /dispensary/orders/[id] at 390px — the Requested Items table clips its last column: the header shows "LI VAL" (cut off from "LINE VALUE") and values render as "$25." Cut mid-number. Below `sm`, replace the 4-column table with stacked item rows: product name + "(strain)" on line one, "qty × unit price" left and line value right on line two. Keep the table at sm+.

C3. Chat drawer (both roles) — the conversation pane's content touches/exceeds the drawer's right edge at lg (drawer is `lg:w-[760px]` with a 300px list): incoming message bubbles run flush to the edge and get visually cut, and the quick-action chip row extends past the drawer edge (the last chips are unreachable). In app/components/messaging/ChatDrawer.tsx: add right padding (pr-4/pr-5) + `min-w-0` to the message pane and its bubble container, and make the quick-chip row a single line with `overflow-x-auto` inside the pane width (it must scroll, not overflow). Verify at 1280px viewport with a long message body containing an unbroken order id (add break-words on bubbles).

━━━━━━━━ D. VERIFICATION ━━━━━━━━

1. `npm run verify` passes with 0 errors.
2. At 390px: /dispensary/orders/[id] sticky bar shows all actions un-truncated; Requested Items shows stacked rows with full values.
3. At 1280px: open the chat drawer as grower, select the conversation, confirm no bubble or chip touches the drawer's right edge and the chip row scrolls horizontally.
4. At 1440px on /grower/dashboard: the setup checklist's right-edge buttons are fully visible and clickable with the FAB stack at rest.
5. /grower/marketplace preview cards: buyer controls inert, "Edit listing" still works.
6. Re-run a quick overflow check (document.documentElement.scrollWidth <= innerWidth) at 390/768 on: /grower/orders/[id], /dispensary/orders/[id], /grower/settings — must remain zero-overflow.
```
