# Admin audit observations

## Pass 1 — Dashboard
Inspected fresh desktop 1440 and mobile 390 screenshots. No horizontal overflow at 390. Mobile page height 2076px.
- Three one-column metric cards occupy y204–599; a compact 2/3-column count row could reclaim ~240px. Shorten helper copy to “1 verified” / “0 pending”.
- Completed checklist rows remain expanded with individual action buttons; the checklist occupies ~728px on mobile. Show pending action, collapse completed checks.
- “Open settings” is duplicated in the panel header and subscription row.
- “PENDING VERIFICATION” plus “Newest accounts awaiting review” repeats one concept and takes two lines on mobile; clear queue deserves one short status row.
- Business-model explainer adds ~164px on mobile and is not an action; relocate to billing settings/help, keep settlement disclosure where relevant.
- Dashboard subtitle repeats admin scope; remove or shorten to “Verification and billing”.
- Growers/Cultivators and Buyers/Dispensaries labels vary within the same screen. Standardize visible business role terms.
- Developer demo block is 260px on mobile with three near-identical seeding labels. Confirmed source limits it to nonproduction; optional dev-only finding, not production issue.
- Main mobile heading 32px is still large relative to content; 26–28px would save space without shrinking body text.

## Pass 1 — Users desktop
Fresh screenshot accepted. Large blank area below the three users is caused by sparse demo data; do not recommend filler. Search placeholder visibly truncates “Search email or business”; shorten to “Email or business” or use visible label. “User Management” can be “Users”; description can be “View accounts and verification.” Five table columns are readable on desktop. “Showing 3 of 3 users” can be “3 users” when unfiltered.
Users mobile: first user starts y425; search form uses 113px because button sits on a second full-width row. Keep field + compact Search button inline (accessible name retained). Each card uses ~153px with sparse rows; bring business/status closer, place joined date in a compact metadata row. Admin entry displays “Admin” twice plus an empty business dash—omit inapplicable verification/business rows. Counts can share filter row/header rather than consuming their own full row.

## Pass 1 — Growers desktop
Fresh screenshot accepted. Header reads “Cultivator Management” while nav reads “Growers”; shorten/standardize to “Growers”. Search placeholder truncates at “Search business, emai”; use “Business, email or license” with adequate field width/visible label. “Showing 1 of 1 cultivators” can be “1 grower” in unfiltered view. Eight columns remain legible at1440; test tablet in pass2. Blank page below one record is data-related, not a layout defect.
Growers mobile: title still32px and long; filters occupy160px (three full-width controls), record startsy413. Combine search+button on one row, put status filter and result count together. Record270px tall for one grower; put subscription alongside verification, tighten email-to-license gap, leave action accessible but reduce unnecessary card whitespace. Do not shrink existing12px metadata further.

## Pass 1 — Dispensaries desktop
Fresh screenshot accepted. Eight columns make business name, license and expiry wrap despite1440px viewport. “Ordering readiness” cell repeats “Wholesale settlement stays direct.” for each buyer; move static rule to help/settings, shorten ready badge to “Can order”, consolidate with verification when possible. Normal expiry need not be a padded pill; compact date leaves license/business more room. “Dispensary Management” -> “Dispensaries”; same search/counter reductions as Growers.
Dispensaries mobile: same three-row160px search stack and270px record shell as growers. “Ordering / Can submit requests” occupies a full extra section; compact status “Verified · Can order” can retain meaning. No clipping/overflow at390. Existing12px metadata is already compact—reduce structure/padding before text.

## Pass 1 — Settings desktop
Fresh screenshot accepted. Support Profile card stretches to billing card height, leaving ~335px empty white card. Align cards to content height or place policy details in that space. Intro exposes implementation justification (“controls that silently fail”); replace with “View billing, support and policies. Edit billing in your provider settings.” Billing repeats “Configured” + “Ready”, or “Needs provider setup” + “Review”; use one status per row. Same provider setup sentence repeats three times; one setup note/link above missing items. Wholesale settlement explanation repeats in top banner, Support Profile and Billing; consolidate once. “Platform: PhenoFarm” is obvious from shell. Section subtitles restate titles (“Displayed policy and support facts…” etc); remove. Policy cards repeat “Policy” badges and discuss “until a durable settings store exists”; shorten to useful ownership/action. Bottom price-update panel repeats setup instructions and links to Admin dashboard with external-link icon despite internal navigation; merge guidance and use accurately named relevant destination.
Settings mobile: page2566px high; important Billing starts y865 after static intro/banner/support. Put missing configuration first and collapse reference facts. Status chips stretch across almost whole card in mobile column layout (“Ready”, “Review”, “Policy”), creating empty colored bars; size to content and place alongside label. Policy section uses a card around cards with double padding; flatten to compact rows. Body14px and helper12px are appropriate; copy and structure should shrink before fonts.

## Pass 1 — Shared admin surfaces
Mobile navigation opens correctly and maintains44px-ish links. Three group headings for five destinations (“Operations”, “Accounts”, “System”) add scanning noise; a single short list would work. Sidebar's remaining blank space is not itself a defect. Notifications popup empty state shows “0 unread” and “Mark all read” with no notifications; suppress irrelevant unread/action row in empty state. No overflow observed. Did not mark messages read or change any verification/account status.

## Pass 2 — Settings
Fresh1440/390 screenshots inspected. Confirmed all pass1 settings findings persist on reload. Mobile no horizontal overflow; source confirms all status chips get stretched by flex-col, not a data condition. Provider values reflect local clone environment, not production configuration—findings concern presentation only. Static support card is especially low priority relative to missing configuration. No additional defect beyond repeated-copy/card layout findings.

## Pass 2 — Dispensaries and confirmation
Fresh1440/390 screenshots confirm same filter/card and table wrapping issues; no new overflow. Opened Unverify confirmation without confirming. Generic “Confirm admin action”/“Confirm” forces description reread; use “Remove verification?” + “Remove verification”. Alert icon background stretches into tall pill beside wrapped description; align icon to top and preserve square dimensions. Dialog otherwise fits mobile and offers clear Cancel.

## Pass 2 — Growers
Fresh1440/390 screenshots confirm pass1 copy/filter/card issues. No mobile overflow. “Not on file” license expiry is meaningful missing-data state and should remain distinguishable from verified status. Do not compress statuses by removing expiry warning. Verification confirmation was reviewed separately on dispensaries; no mutation submitted.

## Pass 2 — Users
Fresh1440/390 screenshots confirm clipped desktop placeholder, redundant Management heading, mobile form stack and sparse153px rows. Admin record indeed repeats Admin badge and empty business placeholder. No horizontal overflow at390. Data-driven empty area below three users excluded as a finding.

## Pass 2 — Dashboard
Fresh1440/390 screenshots confirm repeated checklist/queue/settlement copy and mobile metric stack. One additional cross-page inconsistency: Dashboard displays2 Dispensaries but linked list says1 of1; source confirms count includes off-platform contacts while destination excludes them. Label/count should match linked scope. This was exposed by synthetic contact in isolated data; not a production count claim. Developer seeding block remains explicitly dev-only.

## Pass 2 — Extra width checks
At1024×768 admin Dispensaries header is forced into a narrow ~230px title column beside487px filters; heading wraps to two lines and subtitle to three. Table viewport718px contains980px content; Actions/Joined are offscreen with no obvious horizontal-scroll cue. Use later desktop breakpoint/compact columns or cards until enough content width. At360×780 Growers remains within viewport; no new clipping. These are layout-density findings, not whole-page horizontal overflow.
