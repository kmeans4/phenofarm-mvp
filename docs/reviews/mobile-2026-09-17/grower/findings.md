# Grower mobile review and fixes

All 21 findings are fixed and verified locally. All 18 owned pages were inspected at 360×800, including below the fold; four wider-mobile and four desktop screenshots were also inspected. The four customer pages have root-owned fixes and final checks.

All 56 selected workflow regressions, lint, TypeScript and the final production build passed. Automated checks at 360, 390, 430 and 1440px found no page overflow, runtime errors or phone inputs below 16px. See [verification](../verification.json), [page/state coverage](coverage.json) and the [detailed finding ledger](findings.json).

| Finding | Result | Evidence |
| --- | --- | --- |
| M-G01 — Attention panel repeats counts and oversized spacing | Fixed and verified | [Before](before/01-dashboard-360.png) · [After](after/01-dashboard-setup-360.png) |
| M-G02 — Catalog navigation delays useful health checks | Fixed and verified | [Before](before/02-catalog-360.png) · [After](after/02-catalog-expanded-360.png) |
| M-G03 — Product filters consume most of the first screen | Fixed and verified | [Before](before/03-products-360.png) · [After](after/03-products-selection-360.png) |
| M-G04 — Product creation needs excessive scrolling | Fixed and verified | [Before](before/04-product-add-360.png) · [After](after/04-product-add-details-360.png) |
| M-G05 — Product editing repeats large form gaps | Fixed and verified | [Before](before/05-product-edit-360.png) · [After](after/05-product-new-batch-bottom-360.png) |
| M-G06 — Inventory cards repeat stock and labels | Fixed and verified | [Before](before/06-inventory-360.png) · [After](after/06-inventory-filter-360.png) |
| M-G07 — Stock update helper and gaps add noise | Fixed and verified | [Before](before/07-stock-update-360.png) · [After](../final-pages/_grower_inventory_add-360.png) |
| M-G08 — Strain cards leave space above their actions | Fixed and verified | [Before](before/08-strains-360.png) · [After](../final-pages/_grower_strains-360.png) |
| M-G09 — Strain creation puts save too far down | Fixed and verified | [Before](before/09-strain-add-360.png) · [After](after/09-strain-help-360.png) |
| M-G10 — Strain editing repeats oversized form spacing | Fixed and verified | [Before](before/10-strain-edit-360.png) · [After](../final-pages/_grower_strains__id__edit-360.png) |
| M-G11 — Batch cards repeat labels across too many rows | Fixed and verified | [Before](before/11-batches-360.png) · [After](../final-pages/_grower_batches-360.png) |
| M-G12 — Batch creation spreads short fields across a long form | Fixed and verified | [Before](before/12-batch-add-360.png) · [After](../final-pages/_grower_batches_add-360.png) |
| M-G13 — Batch editing repeats tall lab and upload sections | Fixed and verified | [Before](before/13-batch-edit-360.png) · [After](after/13-batch-edit-terpenes-360.png) |
| M-G14 — Request filters and cards push records below the fold | Fixed and verified | [Before](before/14-orders-360.png) · [After](after/14-orders-bottom-360.png) |
| M-G15 — Request history repeats labels and stacked controls | Fixed and verified | [Before](before/15-order-history-360.png) · [After](../final-pages/_grower_orders_history-360.png) |
| M-G16 — Direct request form uses a large empty-state box | Fixed and verified | [Before](before/16-order-add-360.png) · [After](after/16-order-buyer-options-360.png) |
| M-G17 — Request detail header and metadata use excess height | Fixed and verified | [Before](before/17-order-detail-360.png) · [After](after/17-order-confirmation-360.png) |
| M-G18 — Request edit status and footer occupy separate rows | Fixed and verified | [Before](before/18-order-edit-360.png) · [After](after/18-order-remove-confirmation-360.png) |
| M-G19 — Inline strain form uses small fields and a tiny close target | Fixed and verified | [Before](before/05-product-new-strain-fields-360.png) · [After](after/05-product-new-strain-360.png) |
| M-G20 — Batch dialog is long and its header is covered | Fixed and verified | [Before](before/05-product-new-batch-top-360.png) · [After](after/05-product-new-batch-bottom-360.png) |
| M-G21 — Strain List rows grow around stacked offscreen actions | Fixed and verified | [Before](before/08-strains-list-pre-correction-360.png) · [After](after/08-strains-list-actions-360.png) |

Selected 360px full-page changes: product creation 1962→1526px; inventory 1415→979px; dashboard 1717→1397px; request detail 1668→1277px. The alternate strain List rows fell from 152 to 57px. Shared shell improvements contribute to full-page changes.

Chrome viewport emulation and an isolated local database were used; physical devices and a deployed release were not tested. Root-run regression fixtures and calendar dates changed some counts between captures. No production database writes, migration, commit, push or deployment. METRC was excluded.
