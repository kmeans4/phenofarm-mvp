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
| 9 | `/grower/batches` | TODO | — |
| 10 | `/grower/batches/add` | TODO | — |
| 11 | `/grower/batches/[id]/edit` | TODO | — |
| 12 | `/grower/orders` | TODO | — |
| 13 | `/grower/orders/add` | TODO | — |
| 14 | `/grower/orders/[id]` | TODO | — |
| 15 | `/grower/orders/[id]/edit` | TODO | — |
| 16 | `/grower/orders/history` | TODO | — |
| 17 | `/grower/customers` | TODO | — |
| 18 | `/grower/customers/add` | TODO | — |
| 19 | `/grower/customers/[id]/edit` | TODO | — |
| 20 | `/grower/inventory` | TODO | — |
| 21 | `/grower/inventory/add` | TODO | — |
| 22 | `/grower/marketplace` | TODO | — |
| 23 | `/grower/reports` | TODO | — |
| 24 | `/grower/settings` | TODO | — |
| 25 | `/grower/pricing` | TODO | — |
| 26 | `/grower/metrc-sync` | TODO | — |
