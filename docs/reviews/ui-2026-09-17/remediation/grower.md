# Grower UI remediation

57 of 57 findings are closed.

G01–G57 cover 22 grower operational pages. METRC findings are excluded. Validation uses the isolated local clone `phenofarm_ui_fixes_20260917`; no production deployment, commit or push is claimed.

Evidence contains 44 base-page captures (1440×1000 desktop and 390×844 mobile) plus 29 state and narrow-screen captures. Every screenshot was inspected, with its AX snapshot and geometry file saved alongside it. Products, batches, requests, history, statements and the request item editor also have 360px checks. The checked pages have no horizontal overflow.

The focused lab-value, harvest-date and legacy-unit regressions passed in the parent-run stable production-build suite. Focused lint passed on changed grower files. The parent final aggregate verification passed after all source corrections. The combined report records the final affected regression rerun.

Manual interaction review opened secondary actions, help, setup, progress/history and an unsaved item/terpene row. No browser form, deletion or status change was submitted. Shared timeline simplification was provided by the parent agent.

[Coverage manifest](grower-coverage.json) · [Machine-readable item ledger](grower.json)

## G01 · Put pending work before the setup checklist

**fixed** — `/grower/dashboard`

Daily attention comes before a collapsed Setup count; completed setup items share one compact line.

Files: `app/grower/dashboard/page.tsx`, `app/grower/dashboard/GrowerAttentionPanel.tsx`, `app/grower/dashboard/ActivityFeed.tsx`, `app/grower/dashboard/DeliveredValueChartFrame.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [dashboard-desktop](grower/dashboard-desktop.png), [dashboard-mobile](grower/dashboard-mobile.png), [dashboard-setup-desktop](grower/dashboard-setup-desktop.png), [dashboard-setup-mobile](grower/dashboard-setup-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G02 · Remove repeated dashboard headings

**fixed** — `/grower/dashboard`

Uses one Needs attention heading, one Recent activity heading and concise linked metrics.

Files: `app/grower/dashboard/page.tsx`, `app/grower/dashboard/GrowerAttentionPanel.tsx`, `app/grower/dashboard/ActivityFeed.tsx`, `app/grower/dashboard/DeliveredValueChartFrame.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [dashboard-desktop](grower/dashboard-desktop.png), [dashboard-mobile](grower/dashboard-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G03 · Show recent chart data first

**fixed** — `/grower/dashboard`

Shorter chart defaults to recent days, preserves horizontal access to earlier days and shows its date range.

Files: `app/grower/dashboard/page.tsx`, `app/grower/dashboard/GrowerAttentionPanel.tsx`, `app/grower/dashboard/ActivityFeed.tsx`, `app/grower/dashboard/DeliveredValueChartFrame.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [dashboard-desktop](grower/dashboard-desktop.png), [dashboard-mobile](grower/dashboard-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G04 · Use plain subscription and terms copy

**fixed** — `/grower/dashboard`

Subscription and commercial terms use plain business copy without exposing provider setup details.

Files: `app/grower/dashboard/page.tsx`, `app/grower/dashboard/GrowerAttentionPanel.tsx`, `app/grower/dashboard/ActivityFeed.tsx`, `app/grower/dashboard/DeliveredValueChartFrame.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [dashboard-desktop](grower/dashboard-desktop.png), [dashboard-mobile](grower/dashboard-mobile.png), [dashboard-setup-desktop](grower/dashboard-setup-desktop.png), [dashboard-setup-mobile](grower/dashboard-setup-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G05 · Make the catalog overview concise

**fixed** — `/grower/catalog`

Catalog overview uses concise destinations and one actionable issue prompt instead of repeated explanations.

Files: `app/grower/catalog/page.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [catalog-desktop](grower/catalog-desktop.png), [catalog-mobile](grower/catalog-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G06 · Shorten multi-line status badges

**fixed** — `/grower/catalog`

Destination badges use short, unbroken counts such as 3 live and 1 quote-only.

Files: `app/grower/catalog/page.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [catalog-desktop](grower/catalog-desktop.png), [catalog-mobile](grower/catalog-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G07 · Compact catalog health checks

**fixed** — `/grower/catalog`

Health issues use compact linked rows; zero-count details sit under All checks.

Files: `app/grower/catalog/page.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [catalog-desktop](grower/catalog-desktop.png), [catalog-mobile](grower/catalog-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G08 · Bring products into the first mobile screen

**fixed** — `/grower/products`

Compact metrics and toolbars bring the first mobile product into the initial viewport; bulk controls appear after selection.

Files: `app/grower/products/page.tsx`, `app/grower/products/ProductCsvImportDialog.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [products-desktop](grower/products-desktop.png), [products-mobile](grower/products-mobile.png), [products-selected-mobile](grower/products-selected-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G09 · Simplify product toolbar labels

**fixed** — `/grower/products`

Short filter/group labels replace workflow explanations and the ungrouped All Products heading.

Files: `app/grower/products/page.tsx`, `app/grower/products/ProductCsvImportDialog.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [products-desktop](grower/products-desktop.png), [products-mobile](grower/products-mobile.png), [products-selected-mobile](grower/products-selected-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G10 · Keep product price, stock, and actions visible

**fixed** — `/grower/products`

Mobile product cards show identity, price, stock and Edit/Hide/More without horizontal table scrolling.

Files: `app/grower/products/page.tsx`, `app/grower/products/ProductCsvImportDialog.tsx`, `app/grower/components/OperationsSummary.tsx`, `app/grower/components/RecordActions.tsx`.

Evidence: [products-desktop](grower/products-desktop.png), [products-mobile](grower/products-mobile.png), [products-narrow](grower/products-narrow.png), [products-more-mobile](grower/products-more-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G11 · Make Quick add quick to scan

**fixed** — `/grower/products`

Quick add has one heading with Close beside it, concise defaults, and paired mobile price/stock inputs.

Files: `app/grower/products/page.tsx`, `app/grower/products/ProductCsvImportDialog.tsx`.

Evidence: [products-desktop](grower/products-desktop.png), [products-mobile](grower/products-mobile.png), [products-quick-desktop](grower/products-quick-desktop.png), [products-quick-mobile](grower/products-quick-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G12 · Reduce product setup guidance

**fixed** — `/grower/products/add`

Product creation starts with compact section links and core fields instead of a five-step guide.

Files: `app/grower/products/components/ProductForm.tsx`, `app/grower/products/add/page.tsx`, `app/grower/products/[id]/edit/components/EditProductPageClient.tsx`, `app/grower/components/BatchSelector.tsx`, `lib/product-display.ts`, `tests/ui-grower-data-regressions.spec.ts`.

Evidence: [product-add-desktop](grower/product-add-desktop.png), [product-add-mobile](grower/product-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G13 · Use one consistent publish action

**fixed** — `/grower/products/add`

Publish product is consistent; mobile uses one sticky primary action, one draft action and a compact summary.

Files: `app/grower/products/components/ProductForm.tsx`, `app/grower/products/add/page.tsx`, `app/grower/products/[id]/edit/components/EditProductPageClient.tsx`, `app/grower/components/BatchSelector.tsx`, `lib/product-display.ts`, `tests/ui-grower-data-regressions.spec.ts`.

Evidence: [product-add-desktop](grower/product-add-desktop.png), [product-add-mobile](grower/product-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G14 · Shorten product field labels

**fixed** — `/grower/products/add`

Core labels read Starting stock, Available and Show price/Quote only with one visibility explanation.

Files: `app/grower/products/components/ProductForm.tsx`, `app/grower/products/add/page.tsx`, `app/grower/products/[id]/edit/components/EditProductPageClient.tsx`, `app/grower/components/BatchSelector.tsx`, `lib/product-display.ts`, `tests/ui-grower-data-regressions.spec.ts`.

Evidence: [product-add-desktop](grower/product-add-desktop.png), [product-add-mobile](grower/product-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G15 · Remove repeated optional and upload wording

**fixed** — `/grower/products/add`

Optional details and photo requirements appear once with concise labels and actual upload status.

Files: `app/grower/products/components/ProductForm.tsx`, `app/grower/products/add/page.tsx`, `app/grower/products/[id]/edit/components/EditProductPageClient.tsx`, `app/grower/components/BatchSelector.tsx`, `lib/product-display.ts`, `tests/ui-grower-data-regressions.spec.ts`.

Evidence: [product-add-desktop](grower/product-add-desktop.png), [product-add-mobile](grower/product-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G16 · Show the saved unit in the edit form

**fixed** — `/grower/products/product-001/edit`

Legacy product units normalize into the selected option; editing preserves price, stock, labs and harvest date.

Files: `app/grower/products/components/ProductForm.tsx`, `app/grower/products/add/page.tsx`, `app/grower/products/[id]/edit/components/EditProductPageClient.tsx`, `app/grower/components/BatchSelector.tsx`, `lib/product-display.ts`, `tests/ui-grower-data-regressions.spec.ts`.

Evidence: [product-edit-desktop](grower/product-edit-desktop.png), [product-edit-mobile](grower/product-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Three meaningful data regressions cover decimal/zero/missing labs, harvest dates in Los Angeles and Tokyo at 1440/390/360px, and saving a legacy lowercase unit without altering stock, price, labs or harvest day; all passed in the root stable-build run.
- Parent final npm run verify passed after all source corrections.

## G17 · Use a focused product-edit layout

**fixed** — `/grower/products/product-001/edit`

Editing uses compact navigation, wider fields, Stock wording and one Save changes action per viewport.

Files: `app/grower/products/components/ProductForm.tsx`, `app/grower/products/add/page.tsx`, `app/grower/products/[id]/edit/components/EditProductPageClient.tsx`, `app/grower/components/BatchSelector.tsx`, `lib/product-display.ts`, `tests/ui-grower-data-regressions.spec.ts`.

Evidence: [product-edit-desktop](grower/product-edit-desktop.png), [product-edit-mobile](grower/product-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G18 · Hide irrelevant batch-detail guidance

**fixed** — `/grower/products/product-001/edit`

Batch details links appear only for a matching selected batch; empty guidance is concise.

Files: `app/grower/products/components/ProductForm.tsx`, `app/grower/products/add/page.tsx`, `app/grower/products/[id]/edit/components/EditProductPageClient.tsx`, `app/grower/components/BatchSelector.tsx`, `lib/product-display.ts`, `tests/ui-grower-data-regressions.spec.ts`.

Evidence: [product-edit-desktop](grower/product-edit-desktop.png), [product-edit-mobile](grower/product-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G19 · Compact inventory summaries

**fixed** — `/grower/inventory`

Inventory has one heading, compact metrics and inline actions; its first product is visible sooner on mobile.

Files: `app/grower/inventory/InventoryClient.tsx`, `app/grower/inventory/page.tsx`, `lib/product-display.ts`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [inventory-desktop](grower/inventory-desktop.png), [inventory-mobile](grower/inventory-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G20 · Format values and units consistently

**fixed** — `/grower/inventory`

Stock value uses grouped currency and familiar unit abbreviations such as g while package names remain explicit.

Files: `app/grower/inventory/InventoryClient.tsx`, `app/grower/inventory/page.tsx`, `lib/product-display.ts`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [inventory-desktop](grower/inventory-desktop.png), [inventory-mobile](grower/inventory-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G21 · Explain stock edits in plain language

**fixed** — `/grower/inventory`

Stock instructions explain entering the current total and automatic saving in ordinary language.

Files: `app/grower/inventory/InventoryClient.tsx`, `app/grower/inventory/page.tsx`, `lib/product-display.ts`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [inventory-desktop](grower/inventory-desktop.png), [inventory-mobile](grower/inventory-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G22 · Keep stock updates focused

**fixed** — `/grower/inventory/add`

Stock update has a bounded, full-width form, two core fields, paired actions and secondary Add a new product.

Files: `app/grower/inventory/add/page.tsx`.

Evidence: [stock-update-desktop](grower/stock-update-desktop.png), [stock-update-mobile](grower/stock-update-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G23 · Use denser strain cards and counts

**fixed** — `/grower/strains`

Strain metrics share one row and cards have concise counts, genetics when present and a compact action row.

Files: `app/grower/strains/page.tsx`, `app/grower/components/RecordActions.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [strains-desktop](grower/strains-desktop.png), [strains-mobile](grower/strains-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G24 · Clarify strain actions

**fixed** — `/grower/strains`

Strain cards use Add product and keep Delete inside More actions.

Files: `app/grower/strains/page.tsx`, `app/grower/components/RecordActions.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [strains-desktop](grower/strains-desktop.png), [strains-mobile](grower/strains-mobile.png), [strain-more-desktop](grower/strain-more-desktop.png), [strain-more-mobile](grower/strain-more-mobile.png), [strain-delete-confirm-mobile](grower/strain-delete-confirm-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Opened More and Delete confirmation, then cancelled; no deletion was submitted.
- Parent final npm run verify passed after all source corrections.

## G25 · Show strain-type help on demand

**fixed** — `/grower/strains/add`

Strain-type definitions sit behind About strain types rather than filling every new form.

Files: `app/grower/strains/add/page.tsx`, `app/grower/strains/[id]/edit/page.tsx`.

Evidence: [strain-add-desktop](grower/strain-add-desktop.png), [strain-add-mobile](grower/strain-add-mobile.png), [strain-help-desktop](grower/strain-help-desktop.png), [strain-help-mobile](grower/strain-help-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Expanded the shared strain-type help content and verified it remains readable at both widths.
- Parent final npm run verify passed after all source corrections.

## G26 · Shorten strain-form copy

**fixed** — `/grower/strains/add`

Add strain has one heading, brief examples, and distinct description/growing-notes prompts.

Files: `app/grower/strains/add/page.tsx`, `app/grower/strains/[id]/edit/page.tsx`.

Evidence: [strain-add-desktop](grower/strain-add-desktop.png), [strain-add-mobile](grower/strain-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G27 · Remove repeated help from strain editing

**fixed** — `/grower/strains/0e0cc401-8c6d-4447-b60b-49cfb65c0258/edit`

Edit strain shares the concise form and on-demand type help while retaining populated values.

Files: `app/grower/strains/add/page.tsx`, `app/grower/strains/[id]/edit/page.tsx`.

Evidence: [strain-edit-desktop](grower/strain-edit-desktop.png), [strain-edit-mobile](grower/strain-edit-mobile.png), [strain-help-desktop](grower/strain-help-desktop.png), [strain-help-mobile](grower/strain-help-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Expanded the shared strain-type help content and verified it remains readable at both widths.
- Parent final npm run verify passed after all source corrections.

## G28 · Repair the batch list render failure

**fixed** — `/grower/batches`

Batch API lab values normalize before formatting; decimal strings and zeroes render, invalid or absent values show a dash.

Files: `app/grower/batches/page.tsx`, `lib/batch-utils.ts`, `tests/ui-grower-data-regressions.spec.ts`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [batches-desktop](grower/batches-desktop.png), [batches-mobile](grower/batches-mobile.png), [batches-narrow](grower/batches-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Three meaningful data regressions cover decimal/zero/missing labs, harvest dates in Los Angeles and Tokyo at 1440/390/360px, and saving a legacy lowercase unit without altering stock, price, labs or harvest day; all passed in the root stable-build run.
- Parent final npm run verify passed after all source corrections.

## G29 · Keep harvest dates consistent

**fixed** — `/grower/batches`

Harvest dates use the same UTC calendar day in list and edit views across time zones.

Files: `app/grower/batches/page.tsx`, `lib/batch-utils.ts`, `tests/ui-grower-data-regressions.spec.ts`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [batches-desktop](grower/batches-desktop.png), [batches-mobile](grower/batches-mobile.png), [batches-narrow](grower/batches-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Three meaningful data regressions cover decimal/zero/missing labs, harvest dates in Los Angeles and Tokyo at 1440/390/360px, and saving a legacy lowercase unit without altering stock, price, labs or harvest day; all passed in the root stable-build run.
- Parent final npm run verify passed after all source corrections.

## G30 · Compact mobile batch actions

**fixed** — `/grower/batches`

Batches use compact metrics and one Edit/Add product/More action row; destructive work is secondary.

Files: `app/grower/batches/page.tsx`, `lib/batch-utils.ts`, `tests/ui-grower-data-regressions.spec.ts`, `app/grower/components/OperationsSummary.tsx`, `app/grower/components/RecordActions.tsx`.

Evidence: [batches-desktop](grower/batches-desktop.png), [batches-mobile](grower/batches-mobile.png), [batches-narrow](grower/batches-narrow.png), [batch-more-desktop](grower/batch-more-desktop.png), [batch-more-mobile](grower/batch-more-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Opened the batch More menu at both widths and dismissed it with Escape without submitting a delete.
- Parent final npm run verify passed after all source corrections.

## G31 · Use compact lab-document rows

**fixed** — `/grower/batches/add`

Lab PDFs use three concise rows with one PDF/2MB limit note and no untouched Missing badges.

Files: `app/grower/batches/add/page.tsx`, `app/grower/components/BatchLabDocumentUploaders.tsx`.

Evidence: [batch-add-desktop](grower/batch-add-desktop.png), [batch-add-mobile](grower/batch-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G32 · Pair short lab fields

**fixed** — `/grower/batches/add`

Add batch has one title, one batch-ID example and a compact THC/CBD/Total numeric row.

Files: `app/grower/batches/add/page.tsx`, `app/grower/components/BatchLabDocumentUploaders.tsx`.

Evidence: [batch-add-desktop](grower/batch-add-desktop.png), [batch-add-mobile](grower/batch-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G33 · Replace the raw JSON terpene editor

**fixed** — `/grower/batches/ui-review-batch/edit`

Batch terpenes use name/percentage rows with Add/remove controls, retaining existing data unless intentionally edited.

Files: `app/grower/batches/[id]/edit/page.tsx`, `app/grower/components/BatchLabDocumentUploaders.tsx`.

Evidence: [batch-edit-desktop](grower/batch-edit-desktop.png), [batch-edit-mobile](grower/batch-edit-mobile.png), [batch-terpenes-desktop](grower/batch-terpenes-desktop.png), [batch-terpenes-mobile](grower/batch-terpenes-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Added an unsaved terpene row; name, percent and remove control remain visible on mobile and desktop.
- Parent final npm run verify passed after all source corrections.

## G34 · Reduce repeated batch-edit content

**fixed** — `/grower/batches/ui-review-batch/edit`

Batch editing uses one heading, paired short lab fields and compact document upload rows.

Files: `app/grower/batches/[id]/edit/page.tsx`, `app/grower/components/BatchLabDocumentUploaders.tsx`.

Evidence: [batch-edit-desktop](grower/batch-edit-desktop.png), [batch-edit-mobile](grower/batch-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G35 · Clarify the batch-number example

**fixed** — `/grower/batches/ui-review-batch/edit`

Edit mode removes the misleading expected-format hint beside existing batch numbers.

Files: `app/grower/batches/[id]/edit/page.tsx`, `app/grower/components/BatchLabDocumentUploaders.tsx`.

Evidence: [batch-edit-desktop](grower/batch-edit-desktop.png), [batch-edit-mobile](grower/batch-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G36 · Keep request status, value, and View visible

**fixed** — `/grower/orders`

Mobile requests show buyer/reference, status, value and View request in cards without horizontal scrolling.

Files: `app/grower/orders/page.tsx`, `app/grower/orders/components/OrdersList.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [orders-desktop](grower/orders-desktop.png), [orders-mobile](grower/orders-mobile.png), [orders-narrow](grower/orders-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G37 · Move requests above summary clutter

**fixed** — `/grower/orders`

Compact metrics and status filters bring active requests into the first mobile screen.

Files: `app/grower/orders/page.tsx`, `app/grower/orders/components/OrdersList.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [orders-desktop](grower/orders-desktop.png), [orders-mobile](grower/orders-mobile.png), [orders-narrow](grower/orders-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G38 · Replace request workflow jargon

**fixed** — `/grower/orders`

Request headings and filters use plain language, with one relevant direct-payment note.

Files: `app/grower/orders/page.tsx`, `app/grower/orders/components/OrdersList.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [orders-desktop](grower/orders-desktop.png), [orders-mobile](grower/orders-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G39 · Keep history values and actions visible

**fixed** — `/grower/orders/history`

Mobile history cards expose buyer/reference, closed date, value, status and View request together.

Files: `app/grower/orders/history/page.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [order-history-desktop](grower/order-history-desktop.png), [order-history-mobile](grower/order-history-mobile.png), [order-history-narrow](grower/order-history-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G40 · Compact history summaries

**fixed** — `/grower/orders/history`

Request history uses compact metrics and one concise heading with Active requests navigation.

Files: `app/grower/orders/history/page.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [order-history-desktop](grower/order-history-desktop.png), [order-history-mobile](grower/order-history-mobile.png), [order-history-narrow](grower/order-history-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G41 · Use plain record-request copy

**fixed** — `/grower/orders/add`

Record request explains the direct agreement once and uses one buyer search prompt.

Files: `app/grower/orders/add/page.tsx`.

Evidence: [order-add-desktop](grower/order-add-desktop.png), [order-add-mobile](grower/order-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G42 · Put items before optional request details

**fixed** — `/grower/orders/add`

The form runs Buyer, Items, then optional Shipping/notes, with one save action at the end.

Files: `app/grower/orders/add/page.tsx`.

Evidence: [order-add-desktop](grower/order-add-desktop.png), [order-add-mobile](grower/order-add-mobile.png), [order-add-item-desktop](grower/order-add-item-desktop.png), [order-add-item-mobile](grower/order-add-item-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G43 · Keep the message launcher clear of Add item

**fixed** — `/grower/orders/add`

Add item is left-aligned with reserved trailing space, clear of the floating message launcher at mobile widths.

Files: `app/grower/orders/add/page.tsx`.

Evidence: [order-add-desktop](grower/order-add-desktop.png), [order-add-mobile](grower/order-add-mobile.png), [order-add-item-mobile](grower/order-add-item-mobile.png), [order-add-item-narrow](grower/order-add-item-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G44 · Remove repeated item prices and stock

**fixed** — `/grower/orders/add`

Items select by product name, pair quantity and agreed price, show availability once, and use concise totals.

Files: `app/grower/orders/add/page.tsx`.

Evidence: [order-add-desktop](grower/order-add-desktop.png), [order-add-mobile](grower/order-add-mobile.png), [order-add-item-desktop](grower/order-add-item-desktop.png), [order-add-item-mobile](grower/order-add-item-mobile.png), [order-add-item-narrow](grower/order-add-item-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G45 · Prioritize the next request action

**fixed** — `/grower/orders/cmre7ky2400aaekhl0qlnwhqd`

Request detail has one back link, a small reference, secondary Actions disclosure and the next status action above items.

Files: `app/grower/orders/[id]/page.tsx`, `app/grower/orders/[id]/components/QuickStatusUpdate.tsx`.

Evidence: [order-detail-desktop](grower/order-detail-desktop.png), [order-detail-mobile](grower/order-detail-mobile.png), [order-actions-desktop](grower/order-actions-desktop.png), [order-actions-mobile](grower/order-actions-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.
- Parent final npm run verify passed after all source corrections.

## G46 · Consolidate repeated request status

**fixed** — `/grower/orders/cmre7ky2400aaekhl0qlnwhqd`

One current-status badge remains prominent; Progress and Request history are collapsed but accessible.

Files: `app/grower/orders/[id]/page.tsx`, `app/grower/orders/[id]/components/QuickStatusUpdate.tsx`, `app/components/ui/OrderTimeline.tsx`.

Evidence: [order-detail-desktop](grower/order-detail-desktop.png), [order-detail-mobile](grower/order-detail-mobile.png), [order-progress-desktop](grower/order-progress-desktop.png), [order-progress-mobile](grower/order-progress-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Depends on root-owned shared timeline simplification; local Progress/history disclosures retain access.
- Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.
- Parent final npm run verify passed after all source corrections.

## G47 · Shorten request totals copy

**fixed** — `/grower/orders/cmre7ky2400aaekhl0qlnwhqd`

Request items and totals use Items, Subtotal and Est. total with one direct-payment note.

Files: `app/grower/orders/[id]/page.tsx`, `app/grower/orders/[id]/components/QuickStatusUpdate.tsx`.

Evidence: [order-detail-desktop](grower/order-detail-desktop.png), [order-detail-mobile](grower/order-detail-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.
- Parent final npm run verify passed after all source corrections.

## G48 · Separate street and city in addresses

**fixed** — `/grower/orders/cmre7ky2400aaekhl0qlnwhqd`

Customer street and city keep a visible line break on mobile and desktop.

Files: `app/grower/orders/[id]/page.tsx`, `app/grower/orders/[id]/components/QuickStatusUpdate.tsx`.

Evidence: [order-detail-desktop](grower/order-detail-desktop.png), [order-detail-mobile](grower/order-detail-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Fresh final production-build screenshots inspected at both widths after the detail width and Progress spacing correction. Actions, Progress and Request history open correctly; the page remains within the viewport.
- Parent final npm run verify passed after all source corrections.

## G49 · Use one request status panel

**fixed** — `/grower/orders/cmre7ky2400aaekhl0qlnwhqd/edit`

Edit request uses one compact current-status area and clear next-status choices.

Files: `app/grower/orders/[id]/edit/components/EditOrderForm.tsx`.

Evidence: [order-edit-desktop](grower/order-edit-desktop.png), [order-edit-mobile](grower/order-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G50 · Compact short request fields

**fixed** — `/grower/orders/cmre7ky2400aaekhl0qlnwhqd/edit`

Shipping/tax share a row, retain the invoice-only tax explanation and use concise Notes/Summary headings.

Files: `app/grower/orders/[id]/edit/components/EditOrderForm.tsx`.

Evidence: [order-edit-desktop](grower/order-edit-desktop.png), [order-edit-mobile](grower/order-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G51 · Expose supported customer-management actions

**fixed** — `/grower/customers`

Customer directory exposes Add customer, Statement and eligible Edit contact links while platform records remain read-only.

Files: `app/grower/customers/page.tsx`, `app/grower/customers/components/CustomersList.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [customers-desktop](grower/customers-desktop.png), [customers-mobile](grower/customers-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G52 · Compact customer summaries and metadata

**fixed** — `/grower/customers`

Customer metrics are compact, duplicate business/contact names are omitted and request terminology is consistent.

Files: `app/grower/customers/page.tsx`, `app/grower/customers/components/CustomersList.tsx`, `app/grower/components/OperationsSummary.tsx`.

Evidence: [customers-desktop](grower/customers-desktop.png), [customers-mobile](grower/customers-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G53 · Trim repeated customer-form context

**fixed** — `/grower/customers/add`

Add customer has one heading, paired State/ZIP fields and paired footer actions.

Files: `app/grower/customers/add/page.tsx`.

Evidence: [customer-add-desktop](grower/customer-add-desktop.png), [customer-add-mobile](grower/customer-add-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G54 · Combine the customer-edit header rows

**fixed** — `/grower/customers/ui-review-customer/edit`

Customer edit combines back and Statement links in one row above one title.

Files: `app/grower/customers/[id]/edit/page.tsx`, `app/grower/customers/[id]/edit/components/EditCustomerForm.tsx`.

Evidence: [customer-edit-desktop](grower/customer-edit-desktop.png), [customer-edit-mobile](grower/customer-edit-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G55 · Tighten customer-edit form spacing

**fixed** — `/grower/customers/ui-review-customer/edit`

Customer edit uses tighter cards, paired State/ZIP and Cancel/Save; Delete is in a compact More control.

Files: `app/grower/customers/[id]/edit/page.tsx`, `app/grower/customers/[id]/edit/components/EditCustomerForm.tsx`, `app/grower/components/RecordActions.tsx`.

Evidence: [customer-edit-desktop](grower/customer-edit-desktop.png), [customer-edit-mobile](grower/customer-edit-mobile.png), [customer-more-desktop](grower/customer-more-desktop.png), [customer-more-mobile](grower/customer-more-mobile.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Opened More and dismissed it with Escape; the form remained unchanged.
- Parent final npm run verify passed after all source corrections.

## G56 · Keep statement values visible on mobile

**fixed** — `/grower/customers/ui-review-customer/statement`

Mobile statements use rows with visible reference/date, item summary and value without horizontal scrolling.

Files: `app/grower/customers/[id]/statement/page.tsx`.

Evidence: [customer-statement-desktop](grower/customer-statement-desktop.png), [customer-statement-mobile](grower/customer-statement-mobile.png), [customer-statement-narrow](grower/customer-statement-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.

## G57 · Shorten statement copy and fix singular counts

**fixed** — `/grower/customers/ui-review-customer/statement`

Statements have a short title with customer subtitle, Customer back link, singular-aware counts and one settlement note.

Files: `app/grower/customers/[id]/statement/page.tsx`.

Evidence: [customer-statement-desktop](grower/customer-statement-desktop.png), [customer-statement-mobile](grower/customer-statement-mobile.png), [customer-statement-narrow](grower/customer-statement-narrow.png).

- Focused ESLint passed on changed grower components.
- Reviewed the data, authorization and action paths; validation and request payloads remain intact.
- Desktop 1440×1000 and mobile 390×844 screenshots were inspected; page geometry has no horizontal overflow.
- Parent final npm run verify passed after all source corrections.
