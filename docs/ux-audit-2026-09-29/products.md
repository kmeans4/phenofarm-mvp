# Products, imports, strains and batches — UX audit implementation

Date: September 29, 2026. Source: the supplied `ux-audit-2026-09-29.md`.

This ledger covers GP1–GP28, GI1–GI9 and GS1–GS12, plus relevant shared standards and section-4 cleanup. Implementation and checks are local. This document does not establish a production release.

## Product and inventory findings

| ID | Implemented behavior and evidence |
| --- | --- |
| GP1 | Products has URL-backed search, status and Name/Price/Stock/Newest sorting. Inventory redirects preserve query parameters. Marketplace preview has search and sorting. `products/page.tsx`, `lib/grower-products.ts`, `marketplace/page.tsx`. |
| GP2 | Inline prices accept normal currency typing; bulk Set price, Change by %, Show price and Price on request are available. Spreadsheet imports update existing products. Price changes invoke buyer alert evaluation without making a successful save fail if notifications fail. |
| GP3 | New/duplicated stock starts empty and is required before publishing. Zero-stock saves explicitly say “Saved but hidden: no stock.” Readback/UI workflow passed. |
| GP4 | Products contains inline stock steppers and visibility switches. Inventory and Update stock redirect to Products; obsolete `InventoryClient.tsx` removed. |
| GP5 | Quick add uses `ProductTypeSelector`. Canonical matching handles case/plurals/common aliases, including Flowers and Vape. |
| GP6 | One Add product control opens inline entry with Save and More details. Spreadsheet import is adjacent. More details carries entered fields forward. |
| GP7 | Row and bulk Mark sold out save immediately with Undo. |
| GP8 | Visibility is editable directly in each product row. Draft/no-stock feedback explains why an item cannot become live. |
| GP9 | Edit/add carry a safe grower Products return URL; save restores the search, status, sort, page and edited-row anchor. UI readback passed. |
| GP10 | Removed duplicate grouping chips and page-only grouping. The single status select supplies filtering. |
| GP11 | Drafts is a separate API/list filter. Drafts are excluded from Hidden and Sold out. |
| GP12 | Bulk responses return actual updated/skipped counts with draft/no-stock/not-found reasons. API test verified one update and two skips. |
| GP13 | Default selling units follow type: Flower/Plant Material → lb, Bulk Extract → g, packaged products → unit. Last-used units are remembered per type and account. |
| GP14 | Adopted the audit's explicit explanation alternative: stock remains whole selling units. Forms explain using oz/g and pricing that unit for partial pounds; fractional input is rejected instead of truncated. Inventory/order schema remains integer. |
| GP15 | Low-stock thresholds are shared by units: lb ≤1, oz/half-oz ≤8, remaining units ≤10. List badges, API filters/counts and the grower dashboard use the same rule. |
| GP16 | Photos are visible in Basics with a drop zone; up to six photos, 4MB each. Uploads use individual multipart requests. UI test saved six images, including a 1.2MB image. |
| GP17 | Choosing a batch sets strain and copies THC/CBD and harvest date, with visible provenance guidance. Creating a product from the batch success page also prefills these values. Mobile test passed. |
| GP18 | Strain/batch selectors offer search for larger lists, loading states, retryable load errors and accurate empty messages. |
| GP19 | Unit aliases map to canonical values, including lbs/ounces/eighth/3.5g; unsupported units are rejected. Display uses short unit labels. |
| GP20 | Grower-owned single-product preview is linked from the list and Edit; it includes drafts, photos and lab downloads. Authorization remains grower scoped. |
| GP21 | Marketplace preview distinguishes an empty catalog from existing drafts/hidden/sold-out products and links to Review. |
| GP22 | Product money, quantities, units and batch dates use shared formatters. Prices include two decimals and separators. |
| GP23 | Draft status is determined before stock status and uses neutral styling rather than Sold out. |
| GP24 | Duplicates retain the name, clear SKU/stock and receive a separate draft-storage key. |
| GP25 | Product APIs return error arrays; the form maps and displays all field errors, expands hidden details as needed and focuses the first invalid input. |
| GP26 | Bulk outcomes appear beside the bottom action bar; pagination appears below the product list. |
| GP27 | Add/Edit share form and navigation behavior, retryable load errors and common headers. Edit includes Preview, Duplicate and Delete with Undo. |
| GP28 | Preview shows no strain type when it is unknown; it never invents Hybrid. The draft preview UI test verified this. |

## Spreadsheet findings

| ID | Implemented behavior and evidence |
| --- | --- |
| GI1 | Shared strict numeric parsing accepts `$1,200.00`, comma groups, percentages and recognized unit suffixes, rejects malformed/partial values and rejects fractional stock. Parser test covers these cases. |
| GI2 | Preview separates Create/Update/Skip; good rows can be imported despite bad rows. Failed rows download with errors. Matching uses case-insensitive SKU then name; ambiguous/repeated matches are rejected. Grower-scoped transaction locking prevents concurrent retries creating duplicates. Successful imports clear the selected file and disable resubmission. Concurrent import test passed and omitted existing fields were preserved. |
| GI3 | Unknown product types produce a row error listing valid types. |
| GI4 | Human-readable template headers and common aliases are supported; missing Stock defaults to zero and Unit defaults by type. |
| GI5 | Errors name the field/problem directly. Original spreadsheet row positions are retained, including blank rows. |
| GI6 | Import validation has guarded response parsing and try/catch/finally; failures clear pending state and preserve the file for retry. Browser network-failure/retry test passed. |
| GI7 | CSV, TSV and XLSX files are supported independently of unreliable MIME labels. CSV delimiter detection handles comma, semicolon and tab; content/size validation rejects malformed input. Oversized selections fail locally before sending a request that exceeds deployment limits. XLSX has ZIP expansion, row and column limits. Excel import test passed. |
| GI8 | Free growers can import 25 rows per file, within the existing free listing limit. Paid plan checks retain higher import limits. The UI states the free allowance. |
| GI9 | Import supports THC/CBD ranges, batch, harvest date and Draft/Live/Hidden status. Strain/batch matching is case-insensitive; existing batch identity supplies the strain. Regression checks cover explicit Hidden→Live→Draft and Available=yes while omitting Stock; prior quantity is preserved and visibility intent is correctly applied. |

## Strain, batch and lab findings

| ID | Implemented behavior and evidence |
| --- | --- |
| GS1 | Strain type is optional in add/edit and inline creation. Stored type remains null when unspecified. Mobile creation/readback test passed. |
| GS2 | Add suggests a batch number using local calendar helpers and checks existing numbers. It does not overwrite a typed value. Edit has no Generate control. |
| GS3 | Strain row Add batch passes `strainId`; batch forms honor it. |
| GS4 | Saving a strain offers Add batch/Add product; saving a batch offers Add product from this batch with preselection. End-to-end mobile creation passed. |
| GS5 | Full COA is the primary PDF slot and satisfies the complete report status; separate reports remain optional. Limit increased to 4MB; uploads show progress, errors and View. UI/API test saved a 2.5MB report and downloaded matching bytes from draft preview. Legacy combined-COA download fallback was integrated by the buyer workstream. |
| GS6 | Shared strain/batch forms show errors at fields, focus the first invalid control and keep Submit available until actually saving/uploading. Upload errors remain beside the uploader. |
| GS7 | New-batch dialog ignores backdrop clicks; dirty Escape cannot dismiss it. Explicit close uses the shared unsaved dialog. CSV dialogs preserve pending selection and ignore backdrop dismissal. Browser checks passed. |
| GS8 | Strain/batch page forms use the shared unsaved guard and await Cancel confirmation. Return URLs preserve the origin. Inline stock has debounced, serialized saves and visible recovery. |
| GS9 | Used strains/batches display usage counts and View links in place of Delete. Deletable unused records have Undo. Undo recreates the unused record with its saved data and a new identity; used records cannot take this path. |
| GS10 | Add/edit/inline batch use `BatchForm`, including the same terpene editor. Cannabinoid fields stack on mobile and use three columns at larger widths. Nested strain selectors have distinct input IDs. |
| GS11 | Strain/batch lists have search and distinct loading/error/empty states. Edit pages distinguish 404 from server/network errors and provide Retry. |
| GS12 | Stock taps coalesce after 600ms and share one toast per product. Saves serialize; server conflicts refresh the latest quantity and ask the user to edit again. Three taps produced one write in the browser test; conflict refresh and subsequent save also passed. |

## Shared standards and cleanup

- Product pages adopt the shared money/date/quantity helpers, readable type, associated labels, strict string-based numeric entry, field errors, guarded navigation, portal loading/error/empty components and Undo patterns (X1–X3, X8–X9, X13–X18, X21, X23).
- Removed duplicate group/density/layout controls, default chips, autosave banners, jump navigation, redundant summary/helper text, the repeated top bulk toolbar, the row-action modal and legacy Inventory UI. The product action bar is visible above mobile tabs at 390px; tests assert its bottom does not overlap the navigation top.
- Per X25, reference checks found no runtime consumers for `GuidedFixPanel`, `SetupChecklist`, `RolePrimaryAction`, `app/admin/components/ClientNav.tsx` or `styles/globals.css`; these were deleted. The active grower `ClientNav` remains shared by all portals. `FilterSidebar.tsx` was removed in the buyer workstream and `OrderStatusTimeline.tsx` in the grower-order workstream. The obsolete z-index `!important` block was removed by root.
- Review of root shared UI confirmed: text-xs maps to 14px; table labels lose uppercase; strong borders are #6b8577; 44px button minimums; bordered secondary/destructive Button variants; top-center mobile toasts with Close and 8-second duration; desktop Messages host; silent autosave; skip link and portal header outside main; reduced-motion smooth-scroll reset and touch/reduced-motion tour pause.
- Shared review found an old high-specificity input rule overriding raised backgrounds, 13px MobileNav group labels and conflicting component focus rings; root corrected these. This workstream raised PageHeader eyebrow and portal-role text to 14px, retained the permitted 13px count badge, and made the MobileOrderNavBar's explicit programmatic scroll respect reduced motion. Native product photo buttons and checkbox labels now have explicit 44px targets.

## Validation and boundaries

`tests/ux-products-audit.spec.ts` uses only the explicitly isolated local database `phenofarm_auth_ux_20260929` and app port 3187. Unique fixture users/products and generated upload files are removed afterward; existing fixtures and services remain intact.

Ten focused Playwright workflows passed (latest full run: 13.9 seconds), covering strict numeric parsing, blank-row errors, CSV/XLSX/partial import, concurrent re-import, omitted-field preservation, accurate bulk results, soft-delete restoration, stock conflicts, desktop/mobile inline edits, mobile strain→batch→product, upload persistence/download bytes, zero-stock notices, return navigation and dirty dialog protection. A focused follow-up import test passed after adding client-side oversized-file rejection. The final run also verifies strain field/error association after adding instance-specific IDs for retained page instances and visible-role test selectors. Screenshots are in `/tmp/phenoshop-ux-20260929/`: `products-list-1440.png`, `products-list-390.png`, `products-mobile-form.png`, `product-draft-preview-mobile.png`, `strains-mobile.png`.

Focused ESLint passed. The added ExcelJS dependency uses a scoped UUID override; `npm audit` reported zero vulnerabilities after that update. Root coordinates the full build/typecheck, schema work from other streams and release verification. No production database, deployment or Git publication was performed by this workstream.
