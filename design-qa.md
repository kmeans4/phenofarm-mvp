# PhenoShop brand implementation QA — September 24, 2026

Source visual truth: `/Users/sam/.codex/generated_images/01a0af52-e37a-7921-aed8-a6fe4fdf6e46/exec-6faf7922-bbbe-4cbf-82c1-aef7f283749d.png` (option 03, Leaf Cutout).

Implementation evidence: `/tmp/phenoshop-brand-20260924/asset-comparison-final.png`, `grower-320.png`, `grower-1440.png`, `buyer-320.png`, `buyer-1440.png`, `admin-320.png`, `admin-1440.png`, and `public-checks.json`.

## Comparison and findings

Compared the supplied 1536×1024 concept with the implemented 1200×247 transparent wordmark together in the browser-rendered `asset-comparison-final.png` (1440×1000 CSS/pixels, DPR 1). Source presentation margins and concept label are intentionally excluded from the delivered logo. The board scales both assets to inspect letterforms and the leaf counter, and separately displays the actual favicon at 16, 32, and 48 CSS pixels on light and dark backgrounds. Authenticated portal screens were checked at 1440×900 and 320×800, DPR 1.

- Typography: original image lettering is retained as artwork, not approximated with an app font. The complete wordmark remains readable at 108px in crowded mobile portal headers and 160px on desktop.
- Spacing: fixed aspect ratio prevents distortion. Mobile logo and four adjacent header actions fit without overlap. The landing signup label shortens on mobile to retain space.
- Colors: emerald mark, white letters, transparent background. No visible black rectangle or transparency halo remains. The Apple touch icon uses the app's dark background.
- Image quality: the first generated transparent wordmark had rough edges; a clean generated opaque version was matted and optimized instead. The final P is extracted from that same wordmark. No glyphs were recreated as SVG or CSS drawings.
- Copy: app-controlled names, page titles, public/legal/help copy, dialogs, notification templates, exports, and account-email templates use PhenoShop. Internal persistence/event identifiers remain compatible with existing browser data; repository/provider identifiers and historical records are not renamed.

## Iterations

1. [P2, fixed] Black-backed logo showed a rectangle in the landing navigation despite blending. Replaced it with a true transparent production asset and removed blending. Verified the corrected header and final asset comparison.
2. [P2, fixed] Narrow landing money-flow diagram overflowed by approximately 6px at 320px. Reduced mobile card widths/padding, retained desktop dimensions, and used the real P mark for the PhenoShop node. Both comparison modes now report a 320px document width.
3. Rechecked three portal roles at 320px and desktop; each has the new logo and no horizontal overflow. The grower search dialog opens as “Search PhenoShop.” Eleven public/account/legal routes passed mobile name, image, and width checks.

## Implementation checklist

- [x] Reusable original-artwork logo/mark components across public, account, and portal headers.
- [x] P-only multi-resolution ICO (16/32/48), PNG favicon, Apple touch icon, and 192/512 app icons.
- [x] Manifest, app name, page/social metadata, and share images.
- [x] Actual credential login for isolated local grower/buyer/admin fixtures; sign-out and search interaction checked.
- [x] Browser console checked: no app errors in the reviewed states.
- [x] Before/after comparison and small-icon clarity reviewed.

No remaining P0/P1/P2 findings within the branding scope. Verification does not repeat the full order/settlement workflow audit; business logic and production business data are unchanged. The separately configured support-mailbox client display name is outside website branding.

final result: passed
