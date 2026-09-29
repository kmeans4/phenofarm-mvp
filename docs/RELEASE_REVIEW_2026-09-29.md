# PhenoShop release review — September 29, 2026

This publication brings the repository up to date with the validated production source.

## Changes

- Grower listing improvements: unsaved duplication, draft/publish flows, reusable product details, batch lab-report handling, local-calendar date handling, and product pagination.
- Buyer improvements: consistent Cart language, clearer quote actions, lab-report download feedback, and more useful order guidance.
- Clearer copy across public, account, grower, buyer, admin, settings, help, and error states. Landing examples are labeled and describe implemented behavior.
- Roboto replaces IBM Plex Mono for navigation groups and page section labels. Main text remains Hanken Grotesk. Small labels are at least 12px, with 13px navigation groups and page eyebrows.
- Account email wording and Reply-To support handling were refined.

## Validation

- The aggregate environment, lint, Prisma generation, build, and TypeScript verification passed.
- The copy review passed nine focused buyer/grower workflow checks and a 55-route desktop/mobile rendering sweep.
- The final typography review passed 36 route/width checks across 12 routes at 1440px, 390px, and 360px. Manual computer use verified mobile navigation, populated product cards, and expanded order progress.
- A stale local stylesheet was resolved with a clean build. Computed browser styles confirmed Roboto and the intended label sizes.
- Production deployment `dpl_4W1K5MxmimNYck7qmakiq7MtBtw2` was Ready with the canonical production aliases. Live public-page checks confirmed the released styles and no page-wide overflow at 360px.
- Authenticated verification for the latest copy and typography passes used isolated local review accounts. Signed-in production review remains pending.

## Preservation and publication boundaries

Retained live seed accounts and products were not deleted. Copy and typography work did not mutate production business records. No database migration is part of this publication.

Raw QA exports, screenshots, local account context, and detailed task logs remain local and are excluded from this public repository. The existing local reports retain detailed findings and evidence. Environment files and uploaded media remain excluded from Git and deployment bundles.
