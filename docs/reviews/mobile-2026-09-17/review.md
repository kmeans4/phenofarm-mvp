# PhenoFarm mobile UI review

Fresh review and fixes for mobile density, visibility, wording, typography and spacing. METRC excluded. Local verification only; no publication or deployment.

63 fixes across 48 mapped pages, plus navigation, dialogs and form states.

63 findings addressed. Lint, TypeScript and production build passed. All 57 distinct workflow regressions, 4 customer interaction checks and 5 redirects passed. 48 pages checked at 360, 390, 430 and 1440 pixels with no page overflow or runtime errors; 12 affected pages repeated after final corrections.

## M-S01 — Excess space below mobile navigation

Found: Content began 31px below the 65px mobile header.
Fixed: Removed 16px of excess top offset; desktop offsets remain unchanged.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-S02 — Oversized mobile page headers

Found: Default 32px titles and stacked full-width actions pushed content down.
Fixed: Default 28px headings, 12px gaps and an optional title/action row for short labels.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-S03 — Overpadded shared cards

Found: Cards used 24px padding on narrow phones; conflicting utility classes could defeat local padding.
Fixed: Use 16px mobile/24px desktop defaults and merge padding overrides correctly.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-S04 — Tall mobile navigation

Found: Group gaps and row padding pushed Settings to the bottom of the grower drawer.
Fixed: Tighter group/header/footer spacing; 40px nav links and 40px Close retained.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-S05 — Large search input

Found: The 18px search field occupied excess width beside Search and Close.
Fixed: Use 16px on mobile and allow flex shrinking; preserve 18px desktop.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-S06 — Small chat navigation targets

Found: Back/Close were 20px icons with no 40px touch box; template select used 14px text.
Fixed: 40px icon buttons, tighter surrounding header padding and 16px mobile select.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-S07 — Small date filter text

Found: The shared native select used 14px at phone widths.
Fixed: 16px mobile input text with 40px minimum control height;14px desktop.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R01 — Stacked report header and padded metrics

Found: Description, title and full-width exports used three rows before the date range.
Fixed: Place PDF/CSV beside the title, remove the redundant description, and tighten metric padding.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R02 — Tall recent-request rows

Found: A 40px customer link sat above separate date/ID metadata, inflating every row.
Fixed: Put metadata inside the same accessible request link and shorten empty-status disclosure.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R03 — Repeated optional markers and long profile form

Found: Optional markers repeated the required-field convention;16px row gaps and a three-row description added scroll.
Fixed: Keep required stars, remove repeated optional markers, use 12px mobile gaps and a two-row description.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R04 — Logo control width and whitespace

Found: 96px logo +24px gap left little room for Change and Remove together.
Fixed: 80px mobile preview,12px gap and wrapping upload/remove controls.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R05 — Verbose commercial term labels

Found: Repeated Fulfillment and long payment/response labels used unnecessary space.
Fixed: Shorter labels,16px section title and 12px mobile field gaps; terms and field values preserved.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R06 — Verbose plan cards and empty action spacing

Found: Long plan descriptions,30px prices and an empty current-plan action margin inflated cards.
Fixed: Shortened copy,24px mobile prices, smaller gaps and removed empty current-plan action spacing; rates/billing terms retained.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R07 — Tall preview cards

Found: Large missing-image placeholders and separate price/action/footer rows added repeated dead space.
Fixed: Shorter mobile heading with inline Add product action, 64px thumbnails beside product identity, price/Add row, 12px card padding and combined lab/edit footer. Desktop keeps full product images.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-R08 — Sparse monthly chart leaves unused mobile space

Found: One month of data still used a 160px plotting area, with a large empty area beside the single bar.
Fixed: Use compact labeled value/bar rows for up to three months on phones; keep the full chart on desktop and for longer ranges.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-S08 — Floating messages covers mobile content

Found: The fixed bottom-right messages button overlapped stock text, report values and card actions at the viewport edge.
Fixed: Moved the same messages trigger into a reserved mobile header slot. Kept 40px controls and a compact wordmark; preserved the desktop floating trigger and chat behavior. Notification panels now hide floating triggers, including keyboard focus targets, like the other overlays.
Verification: Header controls measured 40px at 320/360/430; visual order matches keyboard order. Chat/search/notifications workflow tests passed on final production build. Mobile sticky Save remains unobstructed and desktop floating Messages stays in place. The new final regression confirms Escape restores the Messages trigger for both roles; notification-only hiding also passes.

## M-C01 — Repeated customer labels and tall card metadata

Found: Each phone card repeated Email, Phone and Location labels and stacked request date/value. The page introduction repeated the title.
Fixed: Kept accessible labels, shortened visual metadata, combined date/value, reduced card gaps and placed Add beside the title. All four actions remain visible.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-C02 — Optional contact details pushed Add below the first screen

Found: Address and license fields expanded the form even when unused.
Fixed: Grouped optional address/license fields in a disclosure, used full available width, and tightened mobile gaps while retaining every input and value.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-C03 — Empty website and description fields lengthened customer editing

Found: Empty optional fields added roughly 250px; section spacing and a separate More row added further scrolling.
Fixed: Website/description disclosure starts open for saved values and exposes a correction prompt for invalid fields. Smaller section gaps, two-row description, full-width form and one wrapping action row preserve access to editing and deletion.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-C04 — Statement export and bottom spacing consumed unnecessary height

Found: CSV export sat under a short title; the page added 96px bottom padding inside an already-padded portal.
Fixed: Placed CSV next to the title and reduced local bottom padding, retaining date fields, amounts and direct-settlement context. Date fields retain 16px phone text to avoid focus zoom.
Verification: Verified on the isolated production build: 360/390/430px and desktop 1440px, with no page overflow or runtime errors. Fresh phone screenshots inspected; affected interactive states checked.

## M-C05 — Valid customer edits left Save disabled

Found: Blurring a valid field left an undefined value in the error object. Counting its keys incorrectly disabled Save changes.
Fixed: Count actual error messages; valid edits can save and invalid fields still block submission.
Verification: Customer interaction checks passed; valid cleared errors allow saving, hidden optional values remain in payload, and invalid fields keep a visible correction prompt. Persistent regression passed with a real local customer update, and all 56 selected workflows passed.

## M-G01 — Attention panel repeats counts and oversized spacing

Found: 32px title, stacked metrics and 581px attention panel push recent activity below 1300px. Zero-count attention tiles and repeated Review/request wording use space. No horizontal overflow; chart recent-data position and key actions work.
Fixed: Paired count labels/values on mobile; shortened repeated request copy, removed duplicate badges, tightened cards and setup disclosure; preserved review/message actions with 40px targets. Removed duplicate phone-only bottom padding while preserving shell clearance.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Closed and expanded Setup screenshots inspected on the final build; task links remain visible. Removed duplicate mobile page bottom padding; shell spacing remains.; 360px full-page height: 1717 to 1397px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G02 — Catalog navigation delays useful health checks

Found: Four navigation cards repeat explanatory copy, consuming 363px. A separate keep-current banner repeats the Listings destination. Catalog health actions remain available with no overflow.
Fixed: Condensed mobile navigation cards to titles and metrics, omitted the generic keep-current prompt when no stock alert exists, compacted health and advanced disclosures. Removed duplicate phone-only bottom padding.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; All checks and Strains, batches & customers disclosures opened and inspected; all links fit. Removed duplicate mobile page bottom padding.; 360px closed full-page height: 1242 to 800px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G03 — Product filters consume most of the first screen

Found: First product starts at y679; the 233px chip filter and wrapped add actions consume the first screen. Product actions already meet 40px and mobile cards retain price/stock. The shared floating message control overlaps long stock text near the viewport edge. Quick-add input text is 14px; pair Type and Unit and preserve 16px mobile form text. More dialog fits 360px.
Fixed: Placed Add product beside the title, replaced mobile filter chips with a 16px selector, grouped Type/Unit in quick-add, and condensed product stock/action rows. Wrapped each mobile selection checkbox in a 40 by 40px label without changing its accessible name or handler.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Quote-only filter selects the expected listing; reset to All. Quick add and More menu inspected and dismissed without submission.; Final selection checkbox labels measure 40 by 40px; checked and cleared one selection. Bulk actions remain visible and no action was submitted.; First product appears about 280px earlier; full-page height: 1379 to 1063px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G04 — Product creation needs excessive scrolling

Found: The defaults row leaves a large gap before Basics; essential fields extend past the first screen. Repeated card padding and 20–24px field gaps make a 1962px form. Primary sticky actions remain usable; mobile inputs are already 16px. Strain placeholder is clipped and narrow SKU/brand fields use long placeholders. Expanded details are 2617px tall; nested card padding and repeated upload notes can be tightened.
Fixed: Reduced local section/field gaps and mobile padding, paired defaults controls, shortened placeholders, removed inactive subtype/batch placeholders on phones, and tightened optional details and summary.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Details & photos expanded; cannabinoid, harvest date, upload and notes fields inspected through the bottom of the form.; 360px full-page height: 1962 to 1526px; 430px and desktop screenshots inspected.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G05 — Product editing repeats large form gaps

Found: Edit form inherits large field/card gaps and a separate back-link row. Details and photos are expanded for populated data; all content remains reachable. The batch placeholder clips before optional; unit and saved lab values remain correct.
Fixed: Applied the compact form layout, shortened strain/batch choices, gave availability a40px target, and ensured the edit wrapper fills the available width; saved profile fields remain visible.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Full edit form and existing data inspected at 360px; inline creation forms separately checked.; 360px full-page height: 2731 to 2427px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G06 — Inventory cards repeat stock and labels

Found: Inventory cards use 256px per product and repeat quantity beneath the stock control. Type/Price/Inventory labels and two-row filters push the first editor to y643. All inline controls remain visible without overflow.
Fixed: Replaced phone filter chips with a select, combined type/price, removed duplicate quantity output, placed Edit beside stock controls; enlarged the stepper to 40px and numeric input to 16px.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Low-stock filter displays the empty state; reset to All. Stock controls inspected without changing auto-saved stock.; 360px full-page height: 1415 to 979px; 430px screenshot inspected.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G07 — Stock update helper and gaps add noise

Found: The complete stock update flow fits within one screen with readable 16px inputs. The replacement-stock helper wraps twice; footer spacing can be tightened.
Fixed: Shortened replacement-stock guidance, reduced local form/card gaps, and kept the product link a40px target.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Full stock replacement form fits at 360px; helper still explains replacement semantics and all controls remain visible.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G08 — Strain cards leave space above their actions

Found: Each short strain card is 178–198px with unused space above the actions. Add strain consumes a full row, and the view toggle has a separate tall row. Actions fit 360px with 40px targets and clear labels.
Fixed: Inlined Add strain, reduced mobile card and action gaps, and increased view/count links to 40px targets.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; All four cards inspected through the bottom at 360px; view buttons and Edit/Add product/More actions remain visible. Cards restored after inspecting List.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G09 — Strain creation puts save too far down

Found: 24px card padding and large field gaps push submit below 780px. Growing notes is taller than the description although both start empty. About strain types has a small text-only hit area.
Fixed: Tightened field gaps and mobile padding, reduced empty growing-notes height, kept 16px fields and expanded the help disclosure hit area to 40px.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; About strain types expanded and read; no form submitted.; 360px full-page height: 946 to 868px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G10 — Strain editing repeats oversized form spacing

Found: Edit repeats the same large note field and 24px padding as Add. Saved name/type and the complete form render correctly.
Fixed: Applied the same compact spacing and notes height while preserving saved values and strain-type help.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Existing strain name, genetics, description and form actions inspected; no form submitted.; 360px full-page height: 946 to 868px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G11 — Batch cards repeat labels across too many rows

Found: Batch card repeats Batch, Strain and Products labels across six rows. One populated batch fits the screen, but card height is 270px. Numeric lab values and harvest date are correct, and actions fit.
Fixed: Inlined Add batch, combined THC/CBD and product/document information, and removed redundant labels while retaining harvest year, decimal potency, lot and actions.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Batch card preserves THC 24.8%, CBD 0.6%, harvest year and document count; data-format regressions passed in the root-coordinated run.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G12 — Batch creation spreads short fields across a long form

Found: 24px card padding and field/section gaps stretch this form beyond 1300px. The three short lab values already share a row, with legible 16px inputs. PDF upload actions are 40px inside tall rows.
Fixed: Reduced mobile section gaps and upload-row padding, shortened Batch/Lot labels, and retained the three-column 16px potency fields.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; All fields and upload controls inspected at 360px, including below the fold; no upload submitted.; 360px full-page height: 1311 to 1153px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G13 — Batch editing repeats tall lab and upload sections

Found: Edit repeats add-form padding/gaps and places Add terpene on a separate tall block. Saved date, 24.8 THC, 0.6 CBD and 27.2 total remain correct. The terpene remove control sits near the floating launcher; keep sufficient right-side space.
Fixed: Applied compact batch form spacing and upload rows; preserved date, potency, optional terpenes and all saved data.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Added and removed a blank unsaved terpene row to inspect its layout. Existing lab values and harvest date remain correct.; 360px full-page height: 1370 to 1210px; desktop screenshot inspected.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G14 — Request filters and cards push records below the fold

Found: Five status chips wrap to three rows; first request appears below the initial screen controls. Eighteen request cards create a 4012px page; status/date/value/actions can share fewer rows.
Fixed: Used a mobile status selector with the same choices, placed short header actions inline, tightened cards and summaries, and retained 40px selection/view controls.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Accepted filter displays the expected record; reset to All. Selection toolbar fits and selection was cleared without a bulk action. First and last cards inspected.; 360px full-page height: 4012 to 3593px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G15 — Request history repeats labels and stacked controls

Found: A full-width Active requests action, four summary cells and wrapped filter chips push the first record to y517. Record cards have repeated request wording on View buttons.
Fixed: Used a short History heading and inline Active action on phones, compacted existing status chips and cards, and shortened View request to View.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; History cards retain dates with years and record actions; all content fits the phone width.; 360px full-page height: 970 to 800px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G16 — Direct request form uses a large empty-state box

Found: Empty items use a 136px box with two repeated instructions. Card gaps and a long buyer placeholder add space to an otherwise compact form. Item editor uses a separate Remove row and repeated nested padding; compact the row without shrinking quantity or price inputs.
Fixed: Reduced the empty-state instructions, tightened sections, placed Remove beside item availability on mobile, kept 16px fields and40px actions, and condensed shipping/notes.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Unsaved item, shipping/notes and buyer options inspected; form discarded without submission.; 360px empty form height: 824 to 800px; 390px screenshot inspected.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G17 — Request detail header and metadata use excess height

Found: Back link/header/status/actions occupy 238px before the next-action panel. Item/customer cards have large internal padding; request details use three stacked label/value groups. Progress and history are correctly collapsed and address line breaks remain intact.
Fixed: Separated the short heading/actions from compact request identity, placed the mobile status with metadata, anchored Actions inside the right edge, shortened timestamps/unit display, and tightened cards/disclosures. Removed duplicate phone-only bottom padding while preserving shell clearance.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Actions, Progress and Request history inspected separately; first Accept request click showed confirmation, then Cancel dismissed it without submission.; Final closed screenshot inspected after removing duplicate mobile bottom padding; full-page height: 1668 to 1277px.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G18 — Request edit status and footer occupy separate rows

Found: Two status-choice buttons each take a row, and header/status context is repeated. Footer Save and Cancel occupy two full-width rows. All numeric fields are readable, values and transitions remain correct.
Fixed: Paired status choices and Save/Cancel, tightened cards and item controls, shortened unit display, and retained minimum 40px targets and 16px fields.
Verification: fixed_verified; Scoped ESLint passed.; Reviewed task-only source diff; existing API payloads, domain values and workflow handlers retained.; Remove-item confirmation inspected and dismissed with Escape; no item removed or request saved.; 360px full-page height: 1686 to 1344px; desktop screenshot inspected.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G19 — Inline strain form uses small fields and a tiny close target

Found: The inline form adds a tall panel, uses 14px fields and a small × close target. The long optional select prompt clips.
Fixed: Shortened the strain prompt/title, reduced padding, made fields 16px and close 40px with a clear accessible label.
Verification: fixed_verified; Scoped ESLint passed.; Creation payload and same strain-selection callback retained.; Final 360px inline strain screenshot inspected: fields read at 16px and close control is 40px; form closed without creating a strain.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G20 — Batch dialog is long and its header is covered

Found: The dialog stacks three small potency fields, repeats explanatory copy, and the fixed mobile header covers its title/close control.
Fixed: Portaled the existing dialog above the shell, compacted title/padding/field gaps, grouped potency fields in one row, shortened copy, and kept 16px fields with 40px close/upload controls.
Verification: fixed_verified; Scoped ESLint passed.; Existing focus trap, scroll locking and creation handlers retained.; Final 360px dialog top and bottom screenshots inspected: title and close are visible above the mobile shell, 16px fields, grouped potency row and reachable footer.; Escape closes the dialog and returns focus to + New; no batch or upload was submitted.; Full 360px screenshot inspected, including content below the fold; mobile field sizes remain 16px.; Root-coordinated geometry/runtime checks passed at 360, 390, 430 and 1440px: no page overflow, runtime errors or phone fields below 16px.; Aggregate lint, TypeScript and production build passed; all 56 selected workflow regressions passed, including grower, data and profile suites.

## M-G21 — Strain List rows grow around stacked offscreen actions

Found: At 360px, the alternate List view used 152px rows because Edit, Add product and More stacked vertically in the horizontally scrollable Actions column. The visible name/count columns inherited that unused row height.
Fixed: Kept the three actions in one horizontal row at phone widths, used 12px metadata and retained 40px action height. Row height is now 57px. The table remains horizontally scrollable so every column is reachable.
Verification: fixed_verified; Focused ESLint passed after the correction.; On the final production build, measured all four rows at 57px, compared with 152px before the correction.; Inspected left-hand columns and horizontally scrolled Actions at 360px. All actions remain visible, the document has no horizontal overflow, and Card View was restored.; Root final production build, repeated route checks and all 56 selected workflows passed.

## M-B01 — Stacked buyer headings consumed the first screen

Found: Repeated introductory text and full-width catalog actions pushed useful information downward.
Fixed: Removed redundant introduction text, used compact inline actions on short headings, and kept the business-name dashboard heading readable.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Inspected all affected base pages at360/390/430/1440; compact headers and actions fit.

## M-B02 — Request cards repeated a separate date row

Found: Each request used three rows and large outer gaps, reducing visible history.
Fixed: Placed abbreviated date with the request number, kept year visible, allowed long grower names to wrap, and tightened rows and Recent requests header.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Inspected both request lists at four widths and filtered Cancelled status on360: one matching result.

## M-B03 — Catalog cards and quantity controls were too tall

Found: Full-width product images and separate quantity/Add rows repeated vertically on every product.
Fixed: Used phone thumbnails beside identity, compact fact badges, and quantity/Add on one row. Kept 40px stepper targets and 16px numeric inputs; retained full accessible Add label.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Final catalog quantity increased, manually entered4, and Add produced7 from the existing3; cart manually edited back to3.; Parent sixth-case layout suite passed; no quantity/Add clipping.

## M-B04 — Catalog controls clipped labels and nested padding narrowed products

Found: The default grouping label clipped in the phone select; grower sections nested large padding around narrow cards.
Fixed: Shortened sort labels, kept select text at 16px on phones, reduced mobile group/card inset, and shortened Shop action.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Desktop comparison caught flex-child whitespace loss in View Shop; explicit responsive margin added and linted.; Catalog filters open/apply/dismiss checked at360×640; sort/view controls and final four-width base pages inspected.

## M-B05 — Comparison actions displaced the attributes being compared

Found: Repeated product-action rows appeared before the attribute matrix and the unit warning used two lines with large padding.
Fixed: Moved full-width action rows after the attribute matrix, shortened the warning, and tightened matrix spacing while preserving scroll and separate accessible action rows.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Three-product compare inspected at360×800; all eight attribute rows visible before actions; below-fold Add/message controls reachable; Escape dismissed.

## M-B06 — Price-alert and saved-filter dialogs nested padding twice

Found: The target-price dialog had large inner padding inside shared Modal padding, narrowing the input and adding empty vertical space. The saved-filter dialog used the same nested wrapper.
Fixed: Removed nested panel padding, compacted footer spacing, and clarified the price-check helper.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Price-alert after-state inspected; Save Filter inspected at360×640 after a fresh draft Flower selection and at desktop then resized.

## M-B07 — Message templates wrapped into extra rows

Found: A Templates heading and long chips used multiple lines before the message field.
Fixed: Used Pricing, Availability, and Intro labels in one wrapping row with 40px targets; retained full accessible template names and existing message text.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Compact Pricing/Availability/Intro chips and composer inspected on360; no message submitted.

## M-B08 — Empty draft suggestions repeated category and pricing labels

Found: Favorite/Recent pills and Quote only metadata repeated information around a clear Request pricing action; navigation buttons stacked.
Fixed: Simplified Suggested products, removed repeated pills, abbreviated units, shortened copy, and placed navigation actions together.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Empty cart suggested products and both navigation actions inspected at360/390/430/1440.

## M-B09 — Filled draft items used oversized image and separate spacious controls

Found: 80px images and wide gaps inflated each item; small quantity targets were difficult on phones.
Fixed: Used 56px phone thumbnails, compact identity/unit text, and an aligned quantity/total/remove row with 40px targets and 16px input.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Final local cart plus/minus and typed quantity preserved the3×$25=$75 total; item and controls fit360.

## M-B10 — Draft forms and templates consumed unnecessary vertical space

Found: Standard terms had a separate row, four note-template chips wrapped, long placeholder copy filled the textarea, and Review appeared twice on phones.
Fixed: Placed defaults under a Templates menu, used a note-template select, shortened field copy, tightened section spacing, and kept one mobile Review action with the desktop/tablet summary action intact.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Templates menu opened and standard terms applied locally; Pickup note template populated its textarea; section navigation and lower summary remained reachable.

## M-B11 — Request review summary was unnecessarily tall

Found: Four summary cells used large outer padding and long labels; stock-check notice added more height.
Fixed: Compacted cell insets, used Growers and Terms labels, and shortened notice spacing. Preserved 40px Edit targets and fixed footer.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Final360×640 Review shows both Back and Submit request entirely inside the viewport; returned with Back without submitting.

## M-B12 — Favorites sort and grid wasted scarce phone space

Found: Recently Added was clipped and grid images took 160px before product details.
Fixed: Used Newest and short Price/THC sort labels, contained complete images in 80px phone panels, reduced mobile card inset, and kept 40px actions.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Grid/list, Price:high sort, More/Clear confirmation and dismiss, and Recent tab inspected on360; final base pages checked at four widths.

## M-B13 — Price-alert image stood alone above the item

Found: A separate image row made one active alert about 350px tall.
Fixed: Placed a 56px thumbnail beside product identity, retained paired Current/Target cards, and aligned alert actions at the edge.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Alerts card and triggered-only empty state inspected on360; current/target values, target editor and More controls reachable.

## M-B14 — Grower shop repeated tall product presentation

Found: Full-width image bands and stacked quantity controls made three products extend beyond 2200px; inline filter panel was spacious. With an active type filter, the phone sort dropdown narrowed and clipped long Price/THC direction labels.
Fixed: Used compact mobile product identity, shared inline quantity/Add controls, smaller filter inset with 40px chips, and a four-row message composer. Shortened Newest, Price, and THC sort labels while retaining their values and sort behavior.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Fresh stable-build active-filter view exposed sort-label clipping; five label-only changes applied and scoped ESLint passed.; Final shop Flower filter returned2 products in list view; pricing composer opened and cancelled without submission.; Final rebuilt360px active-filter/list view inspected: Price: high and both selected-filter chips display fully; all actions remain inside cards.

## M-B15 — Order details stacked facts and large gaps

Found: Timeline/history and request-details blocks used extra space between sections; every request detail occupied its own row.
Fixed: Tightened section gaps, kept 40px timeline/history disclosure targets, reduced mobile totals inset, and used two columns for request details.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Timeline/history and withdraw-confirmation states inspected; final lower items,total,terms and buyer action controls visible at360.

## M-B16 — Settings helper and account section repeated unnecessary space

Found: Address helper wrapped with unnecessary details; Account label and Sign out stacked. Shared logo controls also needed mobile treatment.
Fixed: Shortened the address helper, normalized field labels, and aligned account controls. Root owns compact shared LogoUpload and header fixes.
Verification: passed; Scoped ESLint passed; Reviewed task-only diff against pre-edit source copy; Final description field focused without editing; lower logo controls, Account/Sign out and fixed Save button visible together at360.

## M-B17 — Mobile filter trigger reported the wrong expanded state

Found: The phone filter sheet was visible, but the trigger read expanded=false and retained inactive styling because it only tracked the desktop sidebar state.
Fixed: Both aria-expanded and active styling now reflect either open filter surface.
Verification: passed; Fresh open-sheet snapshot confirmed trigger expanded=false; Scoped ESLint passed after one-line state-expression correction; Final open sheet trigger reports expanded=true, closed reportsfalse; desktop/phone transitions close hidden surface and release body scrolling.

## M-B18 — Saved filter controls were missing from the mobile filter sheet

Found: Save Current Filter and saved presets existed only in the desktop sidebar. Phone users could adjust filters but could not save, apply, or delete a saved preset. Crossing the desktop breakpoint also left the hidden filter surface marked open.
Fixed: Added saved presets with the existing apply/delete callbacks to a collapsible section, and paired Save filter with Apply filters in the fixed footer. Save uses current sheet selections before opening the existing name dialog. The hidden filter surface closes at the desktop breakpoint.
Verification: passed; Targeted ESLint passed for both source files and added regression test; Reviewed draft-state eligibility and exact existing collection callbacks; Save Filter dialog inspected at desktop then resized to 360px before the mobile entry point was added; Added intercepted collection regression: draft selection, persisted payload, existing preset apply/delete control reachability, and breakpoint cleanup without database writes; Final360×640 presets and both footer actions visible; initial Save disabled, fresh draft Flower enables it and appears in name-dialog preview.; Existing preset applies Flower, closes sheet, updates URL and sets expanded=false.; Parent ran new intercepted endpoint regression successfully: saved payload includes draft Flower and preserves existing preset; no database write.; Both resize directions remove hidden filter surface and body overflow returns visible.

## M-P01 — Contact heading wraps to three lines at the narrowest mobile width

Found: At 360px, “Talk about wholesale workflows.” occupies three lines. Together with the four-line intro and three information cards, the Email us form begins around y=886px.
Fixed: Shortened the heading to “Wholesale workflow help.” so the title uses two lines at 360px while the surrounding context and contact details remain intact.
Verification: verified-production; Fresh 360x800, 390x844, and 430x932 screenshots captured and inspected.; Rendered H1 text is “Wholesale workflow help.” and measures two 40px lines at all three widths.; agent-browser errors --json returned errors: [] after the captures.

## M-A01 — Filtered user search placeholder clips beside Clear

Found: With the Dispensary role filter active, the 142px search field shows “Email or busines…” because the Clear action shares the row.
Fixed: Shortened the page-local placeholder to “Email or name” so the prompt fits the filtered mobile row without changing search behavior or labels.
Verification: verified-production; Fresh 360x800, 390x844, and 430x932 screenshots captured and inspected with admin state loaded.; The actual search field widths are 141.875px, 171.875px, and 211.875px; placeholder is fully rendered as “Email or name”; document width matches viewport at all three widths.; agent-browser errors --json returned errors: [] after the captures.

## M-A02 — Admin mobile search controls use readable input text

Found: The grower and dispensary verification search fields and status selects, plus the users search field, rendered at 14px on mobile. That is below the 16px input baseline and can trigger iOS focus zoom.
Fixed: Set the affected input and select controls to 16px on mobile with text-base and preserve the existing 14px text-sm size from the sm breakpoint upward.
Verification: verified-production; Targeted ESLint passes for both changed files.; Production 3144 computed 16px for grower and dispensary search inputs/status selects and the users search input at 360x800, 390x844, and 430x932.; All nine post-rebuild screenshots were captured and inspected; document width matched viewport at every width with no control overflow.
