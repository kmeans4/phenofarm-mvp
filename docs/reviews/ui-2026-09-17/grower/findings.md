# Grower UI review — September 17, 2026

Completed **two full passes** across **22 pages**, **one redirect**, and **11 supplemental states**. Both passes include desktop **1440 × 1000** and mobile **390 × 844**; Products also has a **360 × 844** check. All **137 accepted screenshots** were inspected. The parent independently inspected the 18 second-pass screenshots for Requests and Customers.

**63 findings:** 3 high, 41 medium, 19 low. No app fixes were made during this review.

## Main opportunities

- Put useful lists and next actions earlier on mobile by compressing metric cards, setup checklists, repeated instructions, and secondary actions.
- Replace mobile desktop-style tables with compact rows that keep price/value, status, stock, and the main action visible.
- Use consistent plain labels: Requests, Catalog, Add product, Save changes, Qty, and familiar units. Keep essential tax, payment, and stock-replacement explanations concise.
- Address the reproduced batch render failure and the visible harvest-date, product-unit, and address inconsistencies before polishing copy.
- Simplify quote/message controls while preserving persistent labels and product/unit context.

## Scope and limits

- Local Chrome audit at http://localhost:3144 against the disposable phenofarm_ui_review_20260917 database clone; this is not a production verification.
- No app source edits, submitted business actions, messages, quotes, uploads, or original-database changes. Existing message read receipts were mocked. Only unsaved local UI state and read-only searches were exercised.
- The parent adjusted only the synthetic batch THC/CBD values in the clone to inspect the working list and independently reproduce the numeric-value failure. These are separate evidence states.
- Full-page captures are used for actual pages; viewport captures are used for dialogs/drawers. Fixed elements may appear mid-image in a full-page capture, and that capture artifact is not treated as a defect.
- Existing/synthetic record density limits empty-state and scale conclusions. Mobile dimensions describe a 390×844 viewport, with an additional 360×844 product-list check.
- METRC-specific findings are excluded. Reports, pricing, settings, and marketplace grower routes are reviewed separately by the parent under admin-extra and are not counted here.

The accepted evidence contains a full-page or viewport PNG, fresh accessibility snapshot, and DOM geometry JSON for every capture. [Coverage inventory](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/coverage.json>) and [Structured findings](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/findings.json>) contain exact routes and evidence paths.

## Coverage

| Page / state | Exact route | Pass 1 | Pass 2 | Findings |
|---|---|---|---|---|
| Dashboard (page) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-mobile.png>) | G01, G02, G03, G04 |
| Catalog overview (page) | `/grower/catalog` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-mobile.png>) | G05, G06, G07 |
| Products (page) | `/grower/products` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-mobile.png>) · [360 px](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-narrow.png>) | G08, G09, G10 |
| Quick add product (supplemental state) | `/grower/products` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03a-quick-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03a-quick-add-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03a-quick-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03a-quick-add-mobile.png>) | G11 |
| Add product (page) | `/grower/products/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-mobile.png>) | G12, G13, G14 |
| Expanded product details (supplemental state) | `/grower/products/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04a-product-details-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04a-product-details-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04a-product-details-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04a-product-details-mobile.png>) | G15 |
| Edit product (page) | `/grower/products/product-001/edit` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-mobile.png>) | G16, G17, G18 |
| Inventory (page) | `/grower/inventory` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-mobile.png>) | G19, G20, G21 |
| Update stock (page) | `/grower/inventory/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/07-inventory-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/07-inventory-add-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/07-inventory-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/07-inventory-add-mobile.png>) | G22 |
| Strains (page) | `/grower/strains` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-mobile.png>) | G23, G24 |
| Add strain (page) | `/grower/strains/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-mobile.png>) | G25, G26 |
| Edit strain (page) | `/grower/strains/0e0cc401-8c6d-4447-b60b-49cfb65c0258/edit` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/10-strain-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/10-strain-edit-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/10-strain-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/10-strain-edit-mobile.png>) | G27 |
| Batches: numeric-lab error (supplemental state) | `/grower/batches` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11-batches-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11-batches-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11-batches-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11-batches-mobile.png>) | G28 |
| Batches: rendered list (page) | `/grower/batches` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11b-batches-ready-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11b-batches-ready-mobile.png>) · [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11b-batches-ready-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11b-batches-ready-mobile.png>) · [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png>) | G29, G30 |
| Add batch (page) | `/grower/batches/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/12-batch-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/12-batch-add-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/12-batch-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/12-batch-add-mobile.png>) | G31, G32 |
| Edit batch (page) | `/grower/batches/ui-review-batch/edit` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png>) | G33, G34, G35 |
| Requests (page) | `/grower/orders` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-mobile.png>) | G36, G37, G38 |
| Request history (page) | `/grower/orders/history` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/15-order-history-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/15-order-history-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/15-order-history-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/15-order-history-mobile.png>) | G39, G40 |
| Record request (page) | `/grower/orders/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-mobile.png>) | G41, G42, G43 |
| Unsaved request item row (supplemental state) | `/grower/orders/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16a-product-picker-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16a-product-picker-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16a-product-picker-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16a-product-picker-mobile.png>) | G44 |
| Request detail (page) | `/grower/orders/cmre7ky2400aaekhl0qlnwhqd` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-mobile.png>) | G45, G46, G47, G48 |
| Edit request (page) | `/grower/orders/cmre7ky2400aaekhl0qlnwhqd/edit` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/18-order-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/18-order-edit-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/18-order-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/18-order-edit-mobile.png>) | G49, G50 |
| Customers (page) | `/grower/customers` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/19-customers-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/19-customers-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/19-customers-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/19-customers-mobile.png>) | G51, G52 |
| Add customer (page) | `/grower/customers/add` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/20-customer-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/20-customer-add-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/20-customer-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/20-customer-add-mobile.png>) | G53 |
| Edit customer (page) | `/grower/customers/ui-review-customer/edit` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/21-customer-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/21-customer-edit-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/21-customer-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/21-customer-edit-mobile.png>) | G54, G55 |
| Customer statement (page) | `/grower/customers/ui-review-customer/statement` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/22-customer-statement-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/22-customer-statement-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/22-customer-statement-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/22-customer-statement-mobile.png>) | G56, G57 |
| Grower redirect (redirect) | `/grower` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/23-grower-redirect-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/23-grower-redirect-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/23-grower-redirect-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/23-grower-redirect-mobile.png>) | No new issue |
| Navigation (supplemental state) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/24-navigation-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/24-navigation-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/24-navigation-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/24-navigation-mobile.png>) | G58 |
| Search: empty state (supplemental state) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25-search-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25-search-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25-search-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25-search-mobile.png>) | G59 |
| Search: results (supplemental state) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25a-search-results-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25a-search-results-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25a-search-results-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25a-search-results-mobile.png>) | No new issue |
| Messages: conversation list (supplemental state) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26-messages-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26-messages-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26-messages-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26-messages-mobile.png>) | G60 |
| Messages: existing conversation (supplemental state) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26a-message-thread-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26a-message-thread-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26a-message-thread-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26a-message-thread-mobile.png>) | G61 |
| Messages: quote form (supplemental state) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26b-quote-form-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26b-quote-form-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26b-quote-form-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26b-quote-form-mobile.png>) | G62 |
| Notifications (supplemental state) | `/grower/dashboard` | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/27-notifications-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/27-notifications-mobile.png>) | [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/27-notifications-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/27-notifications-mobile.png>) | G63 |

## Findings by page and state

### Dashboard

Route: `/grower/dashboard`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/01-dashboard-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/01-dashboard-mobile.png>)

What works: Clear account identity and actionable request count; mobile cards reflow without page overflow.

#### G01 · Put pending work before the setup checklist

**Priority:** Medium · **Viewport:** desktop and mobile

A six-row readiness checklist and setup pitch appear before daily attention items. On mobile, attention begins at y=1700 after an approximately 1100px setup block; completed items each keep explanation and Complete badge.

**Suggested change:** Put pending requests first; collapse completed setup items into ‘Setup · 3 left’. Use ‘Review 17 requests’ and remove ‘Pending requests are the fastest path to keeping buyers moving.’

#### G02 · Remove repeated dashboard headings

**Priority:** Medium · **Viewport:** desktop and mobile

‘ATTENTION CENTER’ repeats ‘What needs your attention’; ‘Activity Feed’ and ‘Recent Activity’ create two headings for one list plus instructional subtitles. KPI helper text repeats linked destinations.

**Suggested change:** Use one ‘Needs attention’ heading and one ‘Recent activity’ heading; remove generic subtitles. Shorten KPIs to ‘Requests’, ‘Delivered value’, ‘Customers’, ‘Products’. Keep one concise settlement qualifier near value.

#### G03 · Show recent chart data first

**Priority:** Medium · **Viewport:** desktop and mobile

Delivered-value chart shows mostly empty space and oldest days first; the only visible $450 bar is outside the initial horizontal window. Desktop card is approximately 340px tall; mobile swipe view initially looks empty.

**Suggested change:** Default to the most recent days or a seven-day mobile view; use ‘Delivered value · 30 days’, reduce chart height, and make date range visible.

#### G04 · Use plain subscription and terms copy

**Priority:** Low · **Viewport:** desktop and mobile

Subscription readiness text exposes ‘when Stripe Billing is ready’, while commercial terms lists five implementation concepts.

**Suggested change:** Use ‘Choose a plan to activate your account’ only when available, otherwise ‘Billing is not available yet’; use ‘Set order and delivery defaults’.

**Second-pass review:** Fresh desktop/mobile revisit confirms3168px mobile length, attention at y=1700, duplicated activity headings and oldest-first chart window. No additional issue; retain both useful KPI links and readable two-column mobile cards.

**Limits:** No setup, billing, or request action submitted. Development toolbar excluded from recommendations.

### Catalog overview

Route: `/grower/catalog`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/02-catalog-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/02-catalog-mobile.png>)

What works: Four overview metrics and a clear Add Product action; all content fits width.

#### G05 · Make the catalog overview concise

**Priority:** Medium · **Viewport:** desktop and mobile

Overview navigation opens ‘Catalog Workspace’; the page describes managing listings in the subtitle, next-action banner, Listings card, and Catalog health area. Four navigation cards repeat sidebar destinations with explanatory paragraphs.

**Suggested change:** Use ‘Catalog overview’. Replace the generic banner with one actionable issue count. Compress destinations into ‘Listings · 3’, ‘Inventory’, ‘Buyer preview’, and ‘Price visibility’, with one-line helper text only where needed.

#### G06 · Shorten multi-line status badges

**Priority:** Medium · **Viewport:** desktop and mobile

The status pills on four destination cards are narrow enough to wrap ‘3 buyer-visible listings’ or ‘1 quote-only listing’ over three or four lines; mobile cards consume about 450px before health details.

**Suggested change:** Use short badges ‘3 live’, ‘1 quote-only’, ‘0 low stock’; keep counts beside titles or use a secondary line rather than circular multi-line pills.

#### G07 · Compact catalog health checks

**Priority:** Medium · **Viewport:** mobile

Catalog health begins at y=1211 and shows four tall cards with instructional copy even when three counts are zero; page reaches 1,977px for a summary screen.

**Suggested change:** Show only issues by default with compact rows, ‘Images missing · 0’, ‘Type missing · 0’, ‘Quote only · 1’, ‘Low stock · 0’; hide zero-count details behind ‘All checks’.

**Second-pass review:** Revisited both widths. Catalog health remains below1211px mobile and status pills still wrap over several lines. Refined priority: compact navigation cards and zero-count checks first; keep the useful two-by-two metric layout. No new issue.

**Limits:** No advanced-setup panel or destination writes used.

### Products

Route: `/grower/products`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03-products-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-mobile.png>) · [360 px](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03-products-narrow.png>)

What works: Useful saved issue counts; columns align on desktop and no page-level horizontal overflow.

#### G08 · Bring products into the first mobile screen

**Priority:** Medium · **Viewport:** mobile

Three full-width actions, three stacked KPI cards, a views panel, grouping/display panel, and bulk instructions push the first product to y=1295. Most of the first screen contains repeated catalog context rather than products.

**Suggested change:** Keep one Add action with Quick add/Import in its menu. Put three metrics in one compact row; combine filters, grouping, and display in a compact toolbar. Show bulk controls after selection. Aim for the first product within the initial screen.

#### G09 · Simplify product toolbar labels

**Priority:** Medium · **Viewport:** desktop and mobile

‘Saved workflow views’ plus ‘Use these before grouping…’ explains basic controls; ‘Select products for bulk cleanup’ is followed by another cleanup sentence. ‘All’ appears in saved views, grouping, and an All Products section header.

**Suggested change:** Use ‘Filters’, ‘Low stock’, ‘Missing photos’, ‘Hidden’; label grouping as ‘Group by’. Remove both bulk instruction sentences and the All Products divider when ungrouped. Shorten quote badge to ‘Quote only’ with a tooltip explaining price visibility.

#### G10 · Keep product price, stock, and actions visible

**Priority:** Medium · **Viewport:** mobile

The table retains desktop columns. At 390px, price is partly offscreen and stock plus Edit/actions are outside the initial view; horizontal scrolling is required to reach them. At 360px even more of the price is hidden. There is no explicit horizontal-scroll cue, and the long quote-only pill forms a tall narrow stack.

**Suggested change:** Use compact mobile product rows showing name, status, price, stock and an always-visible action menu. If the table remains, pin product/actions and add an explicit horizontal-scroll cue; use ‘g’ and ‘ea’ only where unit meaning is clear.

**Second-pass review:** Second desktop/mobile pass confirms the first product is below the fold and stock/actions are hidden inside horizontal table scrolling. Additional360px capture worsens clipping: Price is nearly entirely offscreen and filter chips gain another row. Keep high priority for mobile list composition; no distinct new issue.

**Limits:** No selection, edit, or bulk mutation performed.

### Quick add product

Route: `/grower/products` · Quick add expanded

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03a-quick-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/03a-quick-add-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03a-quick-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/03a-quick-add-mobile.png>)

What works: Only essential product fields are required; an existing draft is visibly indicated.

#### G11 · Make Quick add quick to scan

**Priority:** Medium · **Viewport:** desktop and mobile

Quick add expands a panel with ‘QUICK PRODUCT CREATION’, ‘Create the basic listing now’, and a 20-word explanation; on mobile its header/defaults/draft controls consume about 250px before the first field.

**Suggested change:** Use one ‘Quick add’ heading and ‘Add details later’ helper. Put Close in the heading row and make defaults a compact ‘Flower · g’ control; pair price and stock fields when space permits.

**Second-pass review:** Reopened Quick add after a fresh Products navigation at both widths. Same expanded form and existing draft indication; repeated header/defaults copy remains the main space opportunity. No added issue; no input changed.

**Limits:** Existing draft only viewed; no field typed, draft cleared, defaults changed, or listing created.

### Add product

Route: `/grower/products/add`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04-product-add-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04-product-add-mobile.png>)

What works: Required basics are separated from optional profile details; desktop review panel keeps summary near save controls.

#### G12 · Reduce product setup guidance

**Priority:** Medium · **Viewport:** mobile

Title/subtitle, five-step setup block and its paragraph, defaults panel, then Step 1 description consume nearly the first mobile screen before editing. Each later section also explains its heading; default form totals 3,223px.

**Suggested change:** Use ‘Add product’; replace setup block with compact section links ‘Basics · Pricing · Stock · Details’. Put reusable defaults beside the Type field. Remove instructions such as ‘so mobile setup stays easier to scan’, ‘Name the product…’ and ‘Add the starting quantity…’.

#### G13 · Use one consistent publish action

**Priority:** Medium · **Viewport:** desktop and mobile

Mobile has sticky ‘Publish product’ plus bottom ‘Create Product’, separate Cancel buttons, a five-card save summary, and repeated browser-autosave text; primary labels disagree for the same action. Desktop draft helper is a narrow five-line paragraph.

**Suggested change:** Use one action label ‘Publish product’ across widths. Keep draft as a secondary action, show a compact one- or two-line review summary and one ‘Draft saved on this device’ note; avoid repeating the full footer behind the sticky action bar.

#### G14 · Shorten product field labels

**Priority:** Low · **Viewport:** desktop and mobile

‘Initial Inventory Quantity’, ‘Availability Status’, and nested ‘Pricing Display’ repeat context already supplied by their sections; price visibility options each include near-synonymous helper copy.

**Suggested change:** Use ‘Starting stock’, ‘Available’, and ‘Show price / Quote only’, with a single explanation ‘Quote-only listings hide the price’. Shorten ‘Optional profile, compliance, and images’ to ‘More details & photos’.

**Second-pass review:** Fresh second pass confirms the same3223px mobile form, duplicated summaries/actions and Publish/Create naming mismatch. Keep optional details collapsed by default but remove the guide paragraphs; no extra issue found.

**Limits:** No values changed and no save/publish/draft action used.

### Expanded product details

Route: `/grower/products/add` · Optional details expanded

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04a-product-details-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/04a-product-details-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04a-product-details-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/04a-product-details-mobile.png>)

What works: THC/CBD min/max fields remain a readable two-column grid on mobile; optional fields stay grouped.

#### G15 · Remove repeated optional and upload wording

**Priority:** Low · **Viewport:** desktop and mobile

Optional appears in the section title, badge and ‘Cannabinoid Profile (Optional)’. Image helper includes the implementation detail ‘Images upload separately before you save the product.’

**Suggested change:** Use ‘Cannabinoids’ inside the already optional section. Keep the upload helper to ‘Up to 2 photos · JPG, PNG, WebP · 1MB each’ and show actual upload status only when needed.

**Second-pass review:** Fresh desktop and mobile expanded-details captures confirm repetitive optional labels and technical image-upload helper text. The mobile sticky action uses Publish product while the footer uses Create Product. Both captures reset scroll before capture; the fixed action bar position in a full-page screenshot is not a separate defect.

**Limits:** Expanded by clicking heading; no fields changed. Fullpage fixed-header position reflects the scroll position at capture, not an asserted sticky-header defect.

### Edit product

Route: `/grower/products/product-001/edit`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/05-product-edit-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/05-product-edit-mobile.png>)

What works: Existing values and optional profile details are visible together; desktop summary provides a cross-check.

#### G16 · Show the saved unit in the edit form

**Priority:** High · **Viewport:** desktop and mobile

Unit is a required select showing ‘Select a unit’ while the same form summary says ‘$25/gram’ and ‘240 gram’. The screen does not clearly indicate the current unit.

**Suggested change:** Normalize existing units to the available options and show the selected value. Use ‘g’ consistently in summary after a labeled ‘Unit’ control; verify unchanged edits preserve the unit.

#### G17 · Use a focused product-edit layout

**Priority:** Medium · **Viewport:** desktop and mobile

The five-step new-listing guide and creation-oriented sentences remain on Edit Product. Mobile reaches 3,982px; the summary repeats five values in separate cards. Desktop main form occupies a narrow column with a large empty right side below the sticky summary.

**Suggested change:** For edit mode use ‘Edit product’ plus compact section links, remove the creation guide, and use ‘Stock’ rather than ‘Initial Inventory Quantity’. Keep one ‘Save changes’ label across sticky and standard actions. Compact the summary into rows; give editable fields more desktop width.

#### G18 · Hide irrelevant batch-detail guidance

**Priority:** Low · **Viewport:** desktop and mobile

Batch area has ‘No batches available yet…’, a ‘View batch details’ link, and ‘Link to a harvest batch for lab results’ together even though no batch is selected.

**Suggested change:** Use ‘No batches for this strain’ beside a ‘New batch’ action; hide ‘View batch details’ until a batch is selected. Remove the extra linkage explanation.

**Second-pass review:** Fresh desktop/mobile revisits confirm the required Unit select displays Select a unit while the summary shows $25/gram and 240 gram. The unlinked batch still presents View batch details. New-listing guidance and repeated save labels remain in edit mode; no fields were changed and no save attempted. Sample-data limitations apply to the unit/batch mismatch.

**Limits:** Viewed existing record only; no field or data changed. Gray thumbnail may be synthetic fixture imagery and is not treated as a production defect.

### Inventory

Route: `/grower/inventory`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/06-inventory-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/06-inventory-mobile.png>)

What works: Mobile switches to usable product cards with visible stock controls and Edit link; no sideways table scrolling.

#### G19 · Compact inventory summaries

**Priority:** Medium · **Viewport:** mobile

Two full-width actions and three stacked metric cards push the first product below the 844px initial viewport. ‘Inventory’ is followed by ‘Product Inventory’ plus two similar explanations.

**Suggested change:** Use a compact metrics row and one Add action; move ‘Update stock’ next to filters or label it ‘Stock update’. Remove the second heading and use one short helper ‘Enter current stock’.

#### G20 · Format values and units consistently

**Priority:** Low · **Viewport:** desktop and mobile

The value is ‘$10000.00’ here versus ‘$10,000.00’ in Products; rows repeat the quantity beneath the stock input and spell out ‘gram’ in prices.

**Suggested change:** Format value as ‘$10,000’ when cents are zero. Put units beside stock inputs and use ‘$25/g’, ‘240 g’ consistently, keeping less familiar package units written out.

#### G21 · Explain stock edits in plain language

**Priority:** Low · **Viewport:** desktop and mobile

‘Changes save as absolute quantities’ describes implementation rather than the user's action.

**Suggested change:** Use ‘Set the amount currently in stock’ or ‘Enter current stock; changes save automatically’.

**Second-pass review:** Fresh desktop/mobile captures confirm the three stacked mobile metrics and repeated inventory introduction place the first product below the 844px fold. Inventory cards themselves remain readable with visible quantity controls. Total Value still renders $10000.00 without grouping. No stock controls were used.

**Limits:** Stock controls and Update Stock not activated; no inventory changes.

### Update stock

Route: `/grower/inventory/add`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/07-inventory-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/07-inventory-add-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/07-inventory-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/07-inventory-add-mobile.png>)

What works: Single-purpose form is short; the replacement-stock warning is useful and should remain; current stock is visible beside each product.

#### G22 · Keep stock updates focused

**Priority:** Low · **Viewport:** desktop and mobile

The top Add Product action competes with the stock task. The subtitle's second sentence and search helper repeat obvious context, while ‘Stock Details’ adds another heading for two fields. Desktop input spans nearly 1,100px.

**Suggested change:** Use subtitle ‘Set a product’s current stock’. Move ‘New product’ beside search or into the empty state. Label fields ‘Product’ and ‘New stock’; retain ‘Replaces current stock’. Constrain desktop form width and place Cancel/Save side by side on mobile.

**Second-pass review:** Fresh desktop/mobile revisits confirm the form is short and readable; only the secondary Add Product action, repeated search instruction, and wide desktop fields add avoidable space. Keep the stock-replacement warning because it prevents a meaningful mistake. No product was selected and no stock update was submitted.

**Limits:** No product selected and no stock submitted.

### Strains

Route: `/grower/strains`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/08-strains-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/08-strains-mobile.png>)

What works: Strain names, batch/product counts and primary actions are easy to recognize; empty metadata does not introduce placeholder prose.

#### G23 · Use denser strain cards and counts

**Priority:** Medium · **Viewport:** desktop and mobile

Four sparse strain cards have a large gap between counts and buttons. On mobile the three metric cards alone consume 300px and the first strain starts at y=626; four strains extend the page to 1,537px.

**Suggested change:** Use ‘Strains’ as the title and remove the generic subtitle. Put counts in a compact summary row. Use shorter strain rows/cards with counts beside the name and Edit/Add product in a small action row; reserve card height for actual genetics details.

#### G24 · Clarify strain actions

**Priority:** Low · **Viewport:** desktop and mobile

The green ‘+ Product’ action is shorter than other create labels but does not clearly say it creates a product from this strain; delete icons receive strong red emphasis on every card.

**Suggested change:** Use ‘Add product’ consistently and move destructive actions into an overflow menu, keeping Edit most prominent for library maintenance.

**Second-pass review:** Fresh desktop/mobile captures confirm three stacked metric cards and the verbose Strain Management title. The sparse card bodies reserve substantial vertical space, while Add Product is abbreviated to + Product inconsistently. No view preference or record action was changed.

**Limits:** No view preference changed and no create/delete action used.

### Add strain

Route: `/grower/strains/add`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/09-strain-add-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/09-strain-add-mobile.png>)

What works: Centered desktop form stays readable; required name/type and optional text fields are clearly separated.

#### G25 · Show strain-type help on demand

**Priority:** Medium · **Viewport:** desktop and mobile

All five strain-type definitions are displayed below the select. They mostly restate the option name and take 216px on mobile before Lineage.

**Suggested change:** Show help only for the selected option or behind ‘About strain types’. Use compact options ‘Indica’, ‘Sativa’, ‘Hybrid’, ‘Sativa dominant’, ‘Indica dominant’ and remove generic buyer-positioning wording.

#### G26 · Shorten strain-form copy

**Priority:** Low · **Viewport:** desktop and mobile

‘Add New Strain’, ‘Create a new cannabis genetics entry’, and ‘Strain Details’ repeat the same task; placeholders list several long examples and truncate on mobile. Description and Grower Notes do not explain their distinct purposes.

**Suggested change:** Use ‘Add strain’, omit the subtitle or inner title, and shorten labels to ‘Name’, ‘Type’, ‘Lineage’. Use one brief example per placeholder. Clarify the audience/purpose of Description versus Grower notes instead of overlapping generic examples.

**Second-pass review:** Fresh desktop/mobile captures confirm all five strain definitions remain visible below the selector and occupy about 216px on mobile. The header repeats Add New Strain, Create a new cannabis genetics entry, and Strain Details. Long example placeholders clip while the form labels remain readable. No form values were entered.

**Limits:** No form inputs modified or submitted.

### Edit strain

Route: `/grower/strains/0e0cc401-8c6d-4447-b60b-49cfb65c0258/edit`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/10-strain-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/10-strain-edit-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/10-strain-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/10-strain-edit-mobile.png>)

What works: Name/type are prefilled and Save Changes is concise; desktop width is appropriate for reading/editing.

#### G27 · Remove repeated help from strain editing

**Priority:** Medium · **Viewport:** desktop and mobile

Editing an existing Hybrid still displays all five definitions and three levels of repeated ‘strain details’ wording. The help block consumes 216px on mobile and pushes optional fields below the fold.

**Suggested change:** Apply the add-form simplification here: ‘Edit strain’, then fields without another details heading; show only selected-type help on demand. Use ‘Name’, ‘Type’, ‘Lineage’ and define the different purposes of description and notes.

**Second-pass review:** Fresh desktop/mobile revisits confirm the same five-definition helper block is displayed even with Hybrid selected, adding about 216px on mobile. The selected value and form labels remain readable. No edit or save occurred.

**Limits:** No values edited or save submitted; sparse optional fields reflect the synthetic fixture.

### Batches: numeric-lab error

Route: `/grower/batches`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11-batches-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11-batches-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11-batches-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11-batches-mobile.png>)

#### G28 · Repair the batch list render failure

**Priority:** High · **Viewport:** desktop and mobile

The Batches page fails before rendering its list: runtime TypeError ‘batch.thc.toFixed is not a function’. Both fresh navigations show the application error overlay.

**Suggested change:** Normalize batch lab values before numeric formatting and show a recoverable error state when data is invalid. The normal list layout has separate two-pass findings under 11b-batches-ready.

**Second-pass review:** Independent second reproduction after root temporarily restored the synthetic clone batch to THC 24.8 and CBD 0.6: both desktop and mobile again fail with batch.thc.toFixed is not a function at app/grower/batches/page.tsx:187. Both fresh error screenshots were inspected. Root was asked to restore only the clone fixture labs to null afterward; normal UI has separate completed two-pass evidence under 11b-batches-ready.

**Limits:** Observed locally in the disposable clone using one synthetic batch with numeric THC/CBD values; not a production claim. The error screen does not support layout conclusions. The same route was also reviewed successfully in both passes with null lab fields; see 11b-batches-ready. No app source fix was made.

### Batches: rendered list

Route: `/grower/batches` · Synthetic batch THC/CBD empty so list renders

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11b-batches-ready-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/11b-batches-ready-mobile.png>) · [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11b-batches-ready-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/11b-batches-ready-mobile.png>) · [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png>)

What works: Mobile batch card exposes lab-document status, strain and actions without horizontal scrolling; desktop table is compact.

#### G29 · Keep harvest dates consistent

**Priority:** High · **Viewport:** desktop and mobile

The same batch lists ‘Sep 11, 2026’ here but edit form shows harvest date 09/12/2026. A date-only field appears to shift by one day between views.

**Suggested change:** Use the same date-only formatting in list and edit views so harvest dates agree; verify across time zones without altering the stored harvest day.

Cross-check: [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png>) (edit, pass 1); [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png>) (edit, pass 2).

#### G30 · Compact mobile batch actions

**Priority:** Medium · **Viewport:** mobile

Three stacked metrics push the first batch to y=558; the batch's three actions each consume a full row, and Delete is the largest bright-red emphasis.

**Suggested change:** Use ‘Batches’, compact metrics, and a single action row with ‘Edit’, ‘Add product’ and an overflow menu for Delete. Shorten ‘+ Product from batch’ to ‘Add product’; the batch context already supplies the relationship.

**Second-pass review:** Fresh desktop/mobile successful-list captures use the disposable fixture with THC/CBD null, separate from the original numeric-lab render failure. Three stacked metrics and three full-width mobile actions remain prominent. The list shows Sep 11, 2026; the edit form is cross-checked separately. No action was clicked.

**Limits:** Parent changed only synthetic batch THC/CBD to null in disposable audit clone to unlock visual coverage. No app fix performed; numeric-value failure remains an independent finding. Empty averages are fixture-limited.

### Add batch

Route: `/grower/batches/add`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/12-batch-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/12-batch-add-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/12-batch-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/12-batch-add-mobile.png>)

What works: Clear required batch identity/harvest fields; lab uploads are separated by test type and size limit is explicit.

#### G31 · Use compact lab-document rows

**Priority:** Medium · **Viewport:** desktop and mobile

Three upload cards each repeat the test name in a sentence, display a Missing badge and a separate Upload PDF button. On mobile these occupy roughly 560px; the introductory upload paragraph adds another 80px.

**Suggested change:** Use ‘Lab PDFs · up to 2 MB each’ once, then compact rows ‘Potency’, ‘Pesticides’, ‘Microbials’ with status and Upload. Reserve explanation for help or an error. Avoid ‘Missing’ warning styling on a brand-new untouched form unless required.

#### G32 · Pair short lab fields

**Priority:** Low · **Viewport:** mobile

THC, CBD and total cannabinoids each occupy a full-width row despite short numeric values; Add New Batch/subtitle/Batch Details repeat the task, and the batch-number example is shown twice.

**Suggested change:** Use ‘Add batch’, one ‘Batch ID’ example and a ‘Generate’ control. Pair THC/CBD in a grid with total below or use a compact three-column lab row if labels remain readable; use ‘Total (%)’ inside Lab results.

**Second-pass review:** Fresh desktop/mobile captures confirm the three upload cards repeat the same instruction and Missing status, while the three compact numeric lab fields become full-width rows on mobile. The sample format hint repeats the placeholder. Upload limits remain useful and should be preserved in a concise shared line. No files or values were entered.

**Limits:** No generated batch number, files, or form values submitted.

### Edit batch

Route: `/grower/batches/ui-review-batch/edit`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/13-batch-edit-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/13-batch-edit-mobile.png>)

What works: Batch, lot, harvest date, strain and notes are prefilled; lab upload status is explicit.

#### G33 · Replace the raw JSON terpene editor

**Priority:** Medium · **Viewport:** desktop and mobile

The edit form asks growers to enter ‘Terpenes (JSON)’ in a code-style textarea. On mobile the example wraps as raw braces, quoted keys and numeric values.

**Suggested change:** Replace raw JSON with repeatable ‘Terpene’ and ‘%’ fields plus ‘Add terpene’. Put an advanced import option behind disclosure only if technical users need it.

#### G34 · Reduce repeated batch-edit content

**Priority:** Medium · **Viewport:** desktop and mobile

As on Add Batch, three lab-document cards repeat headings in their descriptions, and three numeric lab fields stack full-width on mobile. The Edit Batch/Update batch details/Batch Details trio repeats context.

**Suggested change:** Use one ‘Edit batch’ heading, a compact lab-results grid and document rows labeled ‘Potency’, ‘Pesticides’, ‘Microbials’. State ‘PDF · 2 MB max’ once and use a concise Upload/Replace action per row.

#### G35 · Clarify the batch-number example

**Priority:** Low · **Viewport:** desktop and mobile

‘Expected format: BATCH-YYYYMMDD-XX…’ remains beside an existing VN-2026-0912 ID, implying the existing record is invalid without showing a validation error.

**Suggested change:** If it is only guidance, label it ‘Example: BATCH-20260917-01’ or omit it in edit mode. If mandatory, show a specific validation message rather than generic expected-format copy.

**Second-pass review:** Fresh desktop/mobile captures confirm the raw Terpenes (JSON) editor and repeated upload-card copy. Harvest Date displays 09/12/2026 while the same batch list displays Sep 11, 2026, reproducing the date inconsistency in both passes. The suggested batch format also differs from this synthetic existing record. No values or files were changed. Priority refined to medium for the JSON input: editing difficulty is visible, but no failed save or data loss was tested.

**Limits:** No edits or uploads submitted. Parent nulled only synthetic fixture THC/CBD in disposable clone before this capture to allow list coverage; total cannabinoids remains27.2. Original failure evidence retained.

### Requests

Route: `/grower/orders`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/14-orders-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/14-orders-mobile.png>)

What works: Desktop request rows and colored statuses are scannable; saved status filters show counts.

#### G36 · Keep request status, value, and View visible

**Priority:** Medium · **Viewport:** mobile

At 390px the initial table view shows selection, a long request ID, and dispensary. Date, value, status, and View are offscreen and require horizontal scrolling. The identifier wraps over multiple lines while decision-making fields remain outside the initial view, with no clear scroll cue.

**Suggested change:** Use compact mobile request cards/rows with buyer, short request reference, value, status and a visible View action. Keep full ID available in details or copy action. If retaining table scrolling, pin identifier/action and add a clear scroll hint.

#### G37 · Move requests above summary clutter

**Priority:** Medium · **Viewport:** mobile

Four full-width metric cards and the saved-view explanation push Active Requests below y=1000; the first actual request is beyond the first screen. Active and Needs Review counts are repeated in cards, filters and section heading.

**Suggested change:** Combine metrics into a compact two-by-two or single summary strip, use a short status filter row, and put Record request/History in one compact header row. Show ‘18 active ·17 need review’ once near the list.

#### G38 · Replace request workflow jargon

**Priority:** Medium · **Viewport:** desktop and mobile

‘Saved workflow views’, ‘Start with the next request state before selecting batch actions’, and the heading subtitle's ‘without in-app payment settlement’ add administrative wording before the core list.

**Suggested change:** Use title ‘Requests’, filters labeled by status, and no instructional sentence. Keep the payment model as a concise contextual note ‘Payment is arranged directly’ where order value/payment decisions are shown.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed the mobile table hides value, status and View; tall summaries delay the request list. Status tabs and counts repeat context. Desktop rows remain readable. No actions were submitted.

**Limits:** No status, density preference, selection, batch action, or request data changed. Long historical IDs are local fixture data, but clipping is measured in this viewport.

### Request history

Route: `/grower/orders/history`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/15-order-history-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/15-order-history-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/15-order-history-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/15-order-history-mobile.png>)

What works: Delivered/cancelled separation is explicit and the desktop history table is concise.

#### G39 · Keep history values and actions visible

**Priority:** Medium · **Viewport:** mobile

The history table requires horizontal scrolling to reveal estimated value, status, and View actions on mobile. Long request IDs wrap to three or four lines and dominate the initial view while buyer, value, status, and action information is harder to scan.

**Suggested change:** Use mobile history rows with customer, shortened reference, closed date, value and status plus a visible open action. Preserve complete references in the detail page or copy control.

#### G40 · Compact history summaries

**Priority:** Medium · **Viewport:** mobile

Four full-width metrics occupy about 490px; the two-row history list begins near y=930. ‘Historical Requests’, ‘Delivered & Cancelled Requests’ and filter counts repeat the same summary.

**Suggested change:** Use ‘History’ with a compact ‘2 requests ·1 delivered ·1 cancelled’ summary and delivered value beside it. Shorten navigation to ‘Active requests’; remove the second long list heading.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed nearly 500px of stacked mobile metrics and long wrapped IDs; value, status and actions remain offscreen. Sparse desktop space is record density, not a defect.

**Limits:** No request opened from table or status changed; current records are local fixture history.

### Record request

Route: `/grower/orders/add`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16-order-add-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16-order-add-mobile.png>)

What works: Buyer selection is required before recording; empty Items area makes the next step understandable.

#### G41 · Use plain record-request copy

**Priority:** Medium · **Viewport:** desktop and mobile

‘Record Direct Request’ repeats in title and button; subtitle uses ‘outside PhenoFarm payment rails’. Search placeholder and helper both describe filtering by business/city.

**Suggested change:** Use ‘Record request’, with one clear note ‘For orders arranged directly with a buyer. Payment is handled outside PhenoFarm.’ Keep a single search placeholder ‘Search buyers by name or city’ and remove the duplicate helper.

#### G42 · Put items before optional request details

**Priority:** Medium · **Viewport:** mobile

Two stacked action buttons and an instruction precede the form, while Notes and a full-width shipping field come before Items. The empty Items panel starts at y=769, and its Add button is near the floating message launcher.

**Suggested change:** Order the form Buyer → Items → shipping/notes. Use ‘Add item’ inside a compact empty state instead of a separate header button plus two explanatory lines; keep a single save action at the end or in a compact sticky footer.

#### G43 · Keep the message launcher clear of Add item

**Priority:** Medium · **Viewport:** mobile

The floating message button partly overlaps Add item at the initial mobile viewport: launcher x334–378/y=788–832; Add x289–357/y=769–809. This competes with the next required form action.

**Suggested change:** Reserve space around the floating launcher or move it away from form action rows. Keep Add item fully visible and tappable.

This observation was separated during the second-pass review; both screen captures are retained.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed verbose request/payment copy and optional fields placed before Items. It also identified the floating message launcher partly overlapping Add item on mobile. No row was added by the independent reviewer; the separate 16a state covers the unsaved row.

**Limits:** No buyer, products, fields, or request submitted.

### Unsaved request item row

Route: `/grower/orders/add` · One unsaved item row

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16a-product-picker-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/16a-product-picker-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16a-product-picker-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/16a-product-picker-mobile.png>)

What works: Quantity and agreed unit price are editable together; the estimate updates immediately and includes a payment-model note.

#### G44 · Remove repeated item prices and stock

**Priority:** Medium · **Viewport:** desktop and mobile

One item repeats its price in the product option, next to ‘Agreed price’, and in the input. Stock appears both in the option and an ‘Available now’ badge. Mobile row is about 350px; its long select text truncates. Desktop price column is narrow enough to wrap its help over three lines while product select is very wide.

**Suggested change:** Select by product name, show ‘25 available · List $40/eighth’ once below, pair Qty and Unit price, and place Remove in the row corner. Use ‘Subtotal’, ‘Shipping’, ‘Est. total’ and one concise ‘Payment arranged directly’ note.

**Second-pass review:** Fresh unsaved item-row captures confirm repeated price and availability values, narrow desktop price-help wrapping, and a tall mobile item card. The floating message launcher partly overlaps Add on mobile, matching the independent base-form second-pass observation. Only the local + Add row action was used; no request was submitted.

**Limits:** Clicked Add to reveal a local unsaved row only; no request submitted, quantity or price changed, or data saved.

### Request detail

Route: `/grower/orders/cmre7ky2400aaekhl0qlnwhqd`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/17-order-detail-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/17-order-detail-mobile.png>)

What works: Requested item and value are clear; direct settlement is distinguished from the recorded estimate; customer contact details are available.

#### G45 · Prioritize the next request action

**Priority:** Medium · **Viewport:** mobile

Long32px request heading plus four stacked navigation/edit/print/export actions precede the item. The primary fulfillment decision Accept/Cancel is far lower on the page, while sticky footer repeats All orders and Edit request rather than the next action.

**Suggested change:** Use ‘Request’ with a smaller reference line; put back navigation once, keep the next status action near the summary, and move Edit/Print/Export into an overflow menu. Use ‘Requests’ consistently instead of ‘All orders’.

#### G46 · Consolidate repeated request status

**Priority:** Medium · **Viewport:** desktop and mobile

Submitted appears in the title area, Update Status badge, timeline, ‘Currently: Submitted’ callout and History. Timeline lists four future stages with Pending; mobile stretches it into a tall block, followed by a near-duplicate History card.

**Suggested change:** Use one current-status chip and one compact progress/history area. Collapse future stages; remove ‘5 stages’, ‘Quick actions to move fulfillment forward’ and the duplicate current-status callout.

#### G47 · Shorten request totals copy

**Priority:** Low · **Viewport:** desktop and mobile

‘Requested Items’, ‘Estimated item value’, ‘Estimated request value’ and repeated direct-payment wording lengthen a one-item request.

**Suggested change:** Use ‘Items’, ‘Subtotal’, ‘Est. total’ and one payment note ‘Payment arranged directly’.

#### G48 · Separate street and city in addresses

**Priority:** Medium · **Viewport:** mobile

The customer address joins street and city as “456 Market StreetBurlington, VT 05401” with no separator. It was visible in both passes and independently confirmed in the second.

**Suggested change:** Preserve a line break or insert a comma between street and city in compact address layouts.

This observation was separated during the second-pass review; both screen captures are retained.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed oversized request ID, duplicated navigation and status, a low placement of Accept, and a concatenated mobile address. Desktop right-column stacking leaves a large lower-left gap. No request was edited or accepted.

**Limits:** No status, edit, print, export or Message buyer action activated; only existing request read.

### Edit request

Route: `/grower/orders/cmre7ky2400aaekhl0qlnwhqd/edit`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/18-order-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/18-order-edit-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/18-order-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/18-order-edit-mobile.png>)

What works: Request reference is already smaller than the heading; item quantity controls remain visible on mobile; tax guidance clearly separates recorded tax from automatic calculation.

#### G49 · Use one request status panel

**Priority:** Medium · **Viewport:** desktop and mobile

Submitted is shown beside the page heading and again in a full tinted Current Status box. ‘Order Status’ disagrees with request terminology and ‘Choose a valid next status’ adds procedural wording. Mobile status area is nearly 310px before the item.

**Suggested change:** Use one ‘Status · Submitted’ header with compact next-state choices beneath it; remove the second badge, large Current status panel and ‘valid’ wording. Use ‘Request’ consistently.

#### G50 · Compact short request fields

**Priority:** Low · **Viewport:** mobile

Shipping and recorded tax fields each use a full row with help text, followed by a large Notes field and separate Summary card. One item produces a 1,920px page.

**Suggested change:** Pair Shipping/Tax where readable, use ‘Shipping ($)’ and ‘Tax ($, optional)’, preserve the essential ‘Only if included on your invoice’ note, and shorten ‘Request Notes/Request Summary’ to ‘Notes/Summary’. Keep current readable item controls.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed duplicated status presentation and short numeric fields using separate mobile rows. The compact heading/reference and quantity control fit well. The maximum quantity of 241 is expected: one reserved unit plus 240 available. No save occurred.

**Limits:** No status selected, items changed, fields edited or save submitted.

### Customers

Route: `/grower/customers`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/19-customers-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/19-customers-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/19-customers-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/19-customers-mobile.png>)

What works: Mobile uses readable customer cards, visible contact details and two clear relationship actions.

#### G51 · Expose supported customer-management actions

**Priority:** Medium · **Viewport:** desktop and mobile

The customer directory exposes only View requests and Message. Add customer, edit saved contact and statement routes exist but have no visible entry point on this directory in the audited account.

**Suggested change:** If the existing Add/Edit/Statement screens are intended for everyday contact management, add an “Add customer” action and “Edit contact”/“Statement” menu entries for eligible owned contacts. Respect platform-managed restrictions.

#### G52 · Compact customer summaries and metadata

**Priority:** Medium · **Viewport:** mobile

Three summary cards push the first customer to y=583. Each card prints labeled contact/email/phone/location lines plus totals; ‘Customers’ and ‘Customer List’ repeat, and Orders terminology differs from Requests elsewhere.

**Suggested change:** Use a compact summary ‘2 customers ·2 active ·20 requests’. Remove Customer List heading and simplify subtitle to ‘Saved contacts and buyers’. Group contact details compactly, skip duplicate contact name when it equals business name, and use Requests consistently.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed stacked mobile metrics, repeated contact/business names, and missing visible Add/Edit/Statement entry points for supported contact-management screens. Existing desktop contact text is already small and should not be reduced.

**Limits:** No Message or record actions used. Availability of add/edit/statement routes verified separately; this is a discoverability finding for the visible directory.

### Add customer

Route: `/grower/customers/add`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/20-customer-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/20-customer-add-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/20-customer-add-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/20-customer-add-mobile.png>)

What works: Plain labels, no excessive field instructions, clear required fields, readable desktop grid.

#### G53 · Trim repeated customer-form context

**Priority:** Low · **Viewport:** mobile

‘Add New Customer’, ‘Add a new dispensary customer’, and ‘Customer Information’ repeat the task. State and ZIP each consume a full row despite short values, and both footer actions are full-width.

**Suggested change:** Use ‘Add customer’ and omit the duplicate subtitle/inner title. Keep State and ZIP side by side with City above; pair Cancel/Add at the bottom while retaining adequate tap sizes.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed only minor copy and spacing improvements: three repeated task labels and separate State/ZIP rows. Input text and targets remain readable; desktop grid works well.

**Limits:** No values entered or customer created; otherwise no new major issue observed.

### Edit customer

Route: `/grower/customers/ui-review-customer/edit`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/21-customer-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/21-customer-edit-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/21-customer-edit-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/21-customer-edit-mobile.png>)

What works: Business, contact and address groups are clearly separated; the statement link is available here; fields have readable values.

#### G54 · Combine the customer-edit header rows

**Priority:** Medium · **Viewport:** desktop and mobile

View statement sits alone at the top right, followed by a separate back link, then title and repeated subtitle. Mobile title starts at y=214 rather than the usual 96; the header spends over 200px before the form.

**Suggested change:** Place ‘Customers’ back link and ‘Statement’ in one compact row, followed by ‘Edit customer’. Remove ‘Update customer information’.

#### G55 · Tighten customer-edit form spacing

**Priority:** Low · **Viewport:** mobile

Large gaps/padding in three form cards plus full rows for City, State, ZIP and three footer actions make this contact form 1,862px tall. The delete action is prominently positioned above save even for a contact with request history.

**Suggested change:** Use ‘Business’, ‘Contact’, ‘Address’ headings with tighter spacing; pair State/ZIP. Put Delete in a secondary menu or explain why it is unavailable when history must be retained. Keep Cancel/Save together.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed the isolated Statement row delays the mobile heading to y=214. Repeated section names and State/ZIP stacking add height. Keep Delete separate from Save; no changes were submitted.

**Limits:** No fields changed or customer saved/deleted. The contact is synthetic and has one delivered request.

### Customer statement

Route: `/grower/customers/ui-review-customer/statement`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/22-customer-statement-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/22-customer-statement-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/22-customer-statement-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/22-customer-statement-mobile.png>)

What works: Short statement with clear date controls and overall delivered value; payment boundary is explicit.

#### G56 · Keep statement values visible on mobile

**Priority:** Medium · **Viewport:** mobile

Mobile statement shows request and delivered date but clips Items and Value to the right. The overall total is visible, but per-request details needed to reconcile the statement are hidden without a scroll hint.

**Suggested change:** Use mobile statement rows with reference/date on one line and item summary/value below; alternatively pin value and provide a clear horizontal-scroll affordance.

#### G57 · Shorten statement copy and fix singular counts

**Priority:** Low · **Viewport:** desktop and mobile

The long customer-name-plus-statement 32px title takes two mobile lines; ‘Customer relationship’ is an abstract back label; direct-settlement explanation appears in subtitle and footer, and singular count reads ‘1 delivered requests’.

**Suggested change:** Use ‘Statement’ with ‘Maple Street Market’ as a smaller subtitle, back label ‘Customer’, count ‘1 delivered request’, and one concise ‘Payments are arranged directly; PhenoFarm does not collect funds’ note.

**Second-pass review:** Independent fresh desktop/mobile inspection confirmed long title/copy, singular-count grammar, and hidden per-request values on mobile. From/To already fit a two-column row. The September 15 delivered date is the expected local conversion of a September 16 midnight-UTC instant and is not reported as a bug.

**Limits:** No date filter submitted or CSV exported; read-only view of one synthetic delivered request.

### Grower redirect

Route: `/grower`

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/23-grower-redirect-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/23-grower-redirect-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/23-grower-redirect-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/23-grower-redirect-mobile.png>)

What works: Both widths redirect to the expected dashboard.

**No new issue identified.** Redirect works; destination dashboard findings recorded under01-dashboard.

**Second-pass review:** Fresh desktop/mobile navigation to /grower redirects to /grower/dashboard. Both destination captures were inspected; no new redirect-specific issue. Dashboard observations are covered once under its own route.

**Limits:** Counted as a redirect, not an additional actual page.

### Navigation

Route: `/grower/dashboard` · Shared desktop sidebar and mobile navigation drawer

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/24-navigation-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/24-navigation-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/24-navigation-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/24-navigation-mobile.png>)

What works: Mobile navigation fits390x844, has clear touch rows and visible close/sign-out controls; desktop sections are tidy.

#### G58 · Name the catalog destination clearly

**Priority:** Low · **Viewport:** desktop and mobile

‘Dashboard’ and ‘Overview’ are adjacent destinations, but Overview opens Catalog Workspace. The shell calls the role Cultivator while the mobile drawer says Grower Portal and Grower.

**Suggested change:** Rename Overview to ‘Catalog’ or ‘Catalog overview’. Pick one user-facing role term across the shell; remove ‘Portal’ where it adds no information.

**Second-pass review:** Fresh desktop sidebar and reopened mobile menu were inspected. Mobile rows fit the viewport and remain comfortably spaced; only the Overview versus Dashboard distinction and Cultivator versus Grower naming need simplification. No navigation preference was changed.

**Limits:** Menu only opened/closed; no navigation preference or sign-out used. No desktop drawer exists; persistent sidebar is the desktop equivalent.

### Search: empty state

Route: `/grower/dashboard` · Search dialog empty

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25-search-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25-search-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25-search-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25-search-mobile.png>)

What works: Focused search field, clear close control and supported categories; restrained desktop dialog.

#### G59 · Shorten mobile search guidance

**Priority:** Low · **Viewport:** mobile

The long input placeholder truncates at 390px and uses Orders while navigation says Requests. Keyboard-only navigation hints remain in the mobile footer.

**Suggested change:** Use placeholder ‘Search PhenoFarm’ and one category hint ‘Products, requests, customers, strains’. Hide arrow/Enter/Esc instructions on touch layouts; keep them on desktop.

**Second-pass review:** Freshly reopened desktop/mobile search confirms the long placeholder clips on mobile and keyboard navigation hints remain at the bottom on touch layout. Search still calls requests Orders. The harmless recent-search chip reflects the prior read-only Purple query; no result was opened.

**Limits:** Dialog only; no result navigation or data changes.

### Search: results

Route: `/grower/dashboard` · Search query Purple

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25a-search-results-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/25a-search-results-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25a-search-results-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/25a-search-results-mobile.png>)

What works: Results are compact, readable and distinguish product from strain; price/stock context is restrained.

**No new issue identified.** No additional copy/density issue in the populated results beyond shared mobile search footer wording.

**Second-pass review:** Fresh Purple query at both widths again returns two compact, readable results. No new issue in the result rows; the shared mobile keyboard footer concern remains covered under the empty search state. No result was opened.

**Limits:** Read-only search query typed; no result action activated. Sparse result count reflects the fixture, so unused result area is not a defect.

### Messages: conversation list

Route: `/grower/dashboard` · Messages drawer, conversation list

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26-messages-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26-messages-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26-messages-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26-messages-mobile.png>)

What works: Mobile shows a simple conversation list with preview; desktop separates list and conversation area.

#### G60 · Use one conversation-selection prompt

**Priority:** Low · **Viewport:** desktop

Before a thread is selected, ‘Select a conversation’ appears in the header, an empty-state card and composer placeholder. Quote/pricing controls and settlement note still occupy the bottom.

**Suggested change:** Use one centered ‘Choose a conversation’ prompt and hide composer/quote actions until selection. The explanatory sentence about context, pricing actions and templates is unnecessary.

**Second-pass review:** Fresh desktop/mobile message drawer opens to the conversation list. Desktop repeats Select a conversation in the header, placeholder panel, and disabled composer while showing pricing actions before selection. The single conversation and blank mobile list space are fixture density, not a separate layout defect.

**Limits:** Read-only conversation list; large empty list space reflects a single fixture conversation and is not treated as a defect.

### Messages: existing conversation

Route: `/grower/dashboard` · Existing conversation open

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26a-message-thread-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26a-message-thread-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26a-message-thread-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26a-message-thread-mobile.png>)

What works: Conversation title, timestamps and message body are readable; composer stays anchored at bottom and mobile back/close actions are visible.

#### G61 · Reduce message-composer clutter

**Priority:** Medium · **Viewport:** desktop and mobile

Composer has a horizontal row of six templates, two quote/pricing buttons and a two-line role/settlement note. Settlement is already a chip beneath the conversation header; on mobile the template row clips a label at the right edge.

**Suggested change:** Keep the message box and Send primary. Put templates under ‘Templates’ and pricing actions under ‘Quote’. Show one payment note only in quote context, with concise ‘Payment arranged directly’. Use shorter template names such as ‘Follow up’, ‘Availability’, ‘Delivery’, ‘Terms’.

**Second-pass review:** Reopened existing conversation at both widths confirms the horizontally clipped template strip, two pricing actions, and repeated settlement/role text around the composer. Message bubbles remain readable. Read receipts were mocked; no template, message, quote, or pricing request was submitted.

**Limits:** Existing conversation viewed only; read receipt endpoint mocked to avoid database writes. No message typed/sent or template inserted; sparse message content is fixture-limited.

### Messages: quote form

Route: `/grower/dashboard` · Quote form expanded in existing conversation

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26b-quote-form-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/26b-quote-form-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26b-quote-form-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/26b-quote-form-mobile.png>)

What works: Quote inputs are compact and stay next to the conversation; cancellation is explicit.

#### G62 · Give quotes persistent labels and context

**Priority:** Medium · **Viewport:** desktop and mobile

The quote form uses only placeholders—‘Quote unit price’, ‘Qty (optional)’, ‘Quote terms note (optional)’—with no visible currency/unit or product context. It sits above the still-visible message composer and two other pricing controls.

**Suggested change:** Give the form a ‘Quote’ heading and persistent labels ‘Unit price ($/unit)’, ‘Qty’, ‘Terms’; show the product/unit being quoted or require a product choice if necessary. While quoting, replace the normal composer/actions with this form to avoid competing send controls.

**Second-pass review:** Reopened quote form at both widths again shows placeholder-only unit-price and quantity fields, no visible currency/unit or product context for this general conversation, and two competing send surfaces. Persistent field labels and an explicit product/unit context would be clearer. No quote values or message were entered or submitted.

**Limits:** Expanded form only; no quote fields entered, pricing request made, or quote sent. This fixture conversation has no visible product context; recommendation is based on that state.

### Notifications

Route: `/grower/dashboard` · Notifications panel

**Pass 1:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/27-notifications-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-1/27-notifications-mobile.png>)

**Pass 2:** [Desktop](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/27-notifications-desktop.png>) · [Mobile](</Users/sam/dev/phenofarm-mvp/docs/reviews/ui-2026-09-17/grower/pass-2/27-notifications-mobile.png>)

What works: Unread total and relative time are compact; list stays within the mobile viewport with clear close control.

#### G63 · Make notifications specific and concise

**Priority:** Medium · **Viewport:** desktop and mobile

Repeated ‘New order request’ and ‘New counter quote’ titles are followed by full generic sentences (‘The other party sent revised quote terms for your review’). Adjacent rows look almost identical and lack a visible request/product reference.

**Suggested change:** Use shorter, specific rows such as ‘Green Vermont · Request #XPJO3I’ or ‘Revised quote · Purple Haze’; show a concise value/status preview rather than ‘the other party’. Keep relative time and unread styling.

**Second-pass review:** Fresh desktop/mobile notification panels were reopened and inspected independently after resizing. Repeated generic New order request and New counter quote sentences still omit useful request/product context. The panel fits both widths. No notification or Mark all read action was clicked.

**Limits:** Panel opened only; no notification or Mark all read clicked. Desktop panel was reopened after viewport change and screenshot replaced because first resized capture had closed it; accepted screenshot shows correct panel.

## Suggested sequence

1. Repair the batch numeric-value rendering and reconcile harvest dates, unit selection, and address separators.
2. Make the mobile product/request/history/statement rows usable without hunting for offscreen values or actions.
3. Compact headers, metrics, setup content, and form guidance; move each page’s core task into the first screen.
4. Standardize names and units, simplify messaging/quotes, and add discoverable entry points for supported customer-management pages.
5. After any implementation, revisit the affected pages at desktop, 390 px, and 360 px with real long names and record counts.
