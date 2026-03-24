# PhenoFarm Grower Portal — Mobile UI Execution Checklist (Manual, No Cron)

_Last updated: 2026-03-23_

## Operating mode
- Manual execution only (all cron jobs removed)
- One page at a time
- Each page gets one focused, high-value mobile improvement
- Commit and push after each page-level fix

## Strict process (for every page)
1. Open page at 320x568, 390x844, 430x932
2. Check for:
   - horizontal overflow
   - clipped/overlapping text
   - unusable/tiny controls
   - broken form interactions
   - poor action placement/stacking
3. Implement one highest-impact fix first
4. Run lint/type check for touched files
5. Commit with page-specific message
6. Update this checklist status + notes

## Mobile acceptance criteria (must pass)
- No horizontal scrolling
- Primary action is visible and easy to tap
- Critical forms are usable without zoom
- Status/info text remains readable at 320px
- No desktop regression from the mobile fix

## Page queue and status

| Order | Page | Status | Notes |
|---|---|---|---|
| 1 | `/grower` | DONE | Header now stacks/wraps on mobile; long grower business names no longer crowd title row. Cards/panels use tighter mobile padding for better readability. |
| 2 | `/grower/dashboard` | DONE | Added top spacing and mobile stacking for Recent Activity date filter so dropdown is no longer tight against separator/header line. |
| 3 | `/grower/products` | DONE | Product-card action buttons now stack for mobile usability; Delete is a full-width labeled action instead of a tiny icon-only control. |
| 4 | `/grower/products/add` | DONE | Product form action bar now stacks full-width primary/secondary/cancel buttons on mobile for easier tapping and fewer misclicks. |
| 5 | `/grower/products/[id]/edit` | DONE | Added a clear mobile back affordance (“Back to Products”) and reduced heading scale for cleaner top-of-form hierarchy on small screens. |
| 6 | `/grower/strains` | DONE | Made page header mobile-friendly (smaller title scale) and changed Add Strain CTA to full-width on mobile; view toggle now aligns left on mobile for easier reach. |
| 7 | `/grower/strains/add` | DONE | Improved mobile hierarchy (smaller heading scale) and stacked Create/Cancel actions full-width for easier thumb use. |
| 8 | `/grower/strains/[id]/edit` | DONE | Updated mobile page hierarchy and stacked Save/Cancel controls full-width for better touch reliability on edit form. |
| 9 | `/grower/batches` | DONE | Added mobile-first batch cards (replacing cramped table at small screens), plus full-width mobile actions for Edit/+Product. |
| 10 | `/grower/batches/add` | DONE | Improved mobile heading hierarchy and stacked Create/Cancel buttons full-width for easier touch interactions. |
| 11 | `/grower/batches/[id]/edit` | DONE | Improved mobile heading hierarchy and stacked Save/Cancel buttons full-width for better edit-form usability. |
| 12 | `/grower/orders` | DONE | Header actions now stack vertically on small screens so View History / New Order remain full-width and easy to tap. |
| 13 | `/grower/orders/add` | DONE | Order-create header actions and line-item editor now stack for mobile to prevent cramped controls and accidental taps. |
| 14 | `/grower/orders/[id]` | TODO | Partial only: print action now uses a visible mobile label/full-width behavior, but full page pass still pending. |
| 15 | `/grower/orders/[id]/edit` | DONE | Added mobile back affordance and hid desktop breadcrumb on small screens to reduce top-of-form clutter. |
| 16 | `/grower/orders/history` | DONE | Improved mobile header hierarchy and made “Back to Active Orders” CTA full-width for easier reach/tap. |
| 17 | `/grower/customers` | DONE | Added mobile customer-card view to replace cramped table at small widths, with full-width edit actions. |
| 18 | `/grower/customers/add` | DONE | Fixed mobile layout for City/State/ZIP and stacked Add/Cancel actions for reliable one-thumb use. |
| 19 | `/grower/customers/[id]/edit` | DONE | Improved mobile hierarchy and converted footer actions to full-width stacked controls (Delete/Cancel/Save). |
| 20 | `/grower/inventory` | DONE | Updated mobile header/CTA hierarchy and tightened stat cards for better readability and tap comfort on small screens. |
| 21 | `/grower/inventory/add` | DONE | Converted quantity/date rows to single-column mobile stacks and made footer actions full-width for easier submission flow. |
| 22 | `/grower/marketplace` | DONE | Updated mobile header scale and made primary listing CTA full-width to improve top-of-page action reachability. |
| 23 | `/grower/reports` | DONE | Export actions now stack full-width on mobile instead of cramped side-by-side controls. |
| 24 | `/grower/settings` | DONE | Verified page already mobile-compliant with responsive spacing/actions; no additional layout patch required in this pass. |
| 25 | `/grower/pricing` | DONE | Mobile header and create actions now use full-width CTA behavior for clearer tap targets. |
| 26 | `/grower/metrc-sync` | DONE | Header CTA now full-width on mobile and sync-frequency control stacks with full-width select to prevent crowding. |
