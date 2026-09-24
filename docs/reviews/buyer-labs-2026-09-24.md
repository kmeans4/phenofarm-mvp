# Buyer lab-download review — September 24, 2026

## Implemented

- Catalog cards/list rows, grower shops, saved favorites, and the comparison dialog show compact PDF download controls for available potency, pesticide, microbial, and legacy COA attachments.
- No attachment section or placeholder appears when no supported report exists. Duplicate file references appear once. Reports follow the product's current batch.
- List queries project bounded report metadata in SQL, never entire embedded PDFs. The download route checks a signed-in buyer, published/nondeleted product, current grower eligibility, and matching batch ownership.
- Remote downloads accept only the app's Vercel Blob upload path formats for that grower/batch. Redirects and arbitrary hosts are rejected. Responses are bounded to 2 MB, validated as PDFs, served as attachments, and not cached. Legacy embedded PDFs remain supported.
- Download failures remain in the current page with a retryable message; repeated clicks are guarded. Development document validation now accepts the exact local URLs that the development upload route returns. Production still requires remote storage.

## Validation

- `npm run verify`: passed (environment schema, lint, Prisma generation, production build, TypeScript).
- `tests/buyer-lab-downloads.spec.ts`: 5 workflows passed against the isolated local `phenofarm_auth_editor_20260924` database. The three responsive workflows each cover catalog, shop, and favorites in both grid/list modes, plus comparison and failure recovery at 1440, 390, and 320 pixels.
- A grower uploaded three distinct PDFs through the app API and attached them to a batch; buyer downloads matched the original bytes. Reloaded database values matched uploaded references.
- Verified anonymous/wrong-role rejection; missing/removed reports; draft/deleted products; unverified/expired growers; cross-grower batch mismatch; invalid/oversized PDFs; unsafe URLs; legacy COAs; reference deduplication; and bounded catalog response size.
- Reviewed rendered desktop and mobile screenshots, wrapping, PDF button visibility, and minimum 40-pixel control heights. Test fixtures/files were removed.
- No database migration is required.

## Boundaries

Existing Blob objects use public storage links. The authenticated download route does not convert those objects to private storage or recall prior downloads. The legal rewrite discloses this explicitly.

The complete proposed Terms, Privacy Policy, Cookie Notice, and manual retention/deletion procedure are in `docs/legal/launch-policies-2026-09-24.md`. They are held for the legal operator identity and launch geography; this change does not replace the current public legal pages with unconfirmed details.

Production deployment and live-storage validation will be recorded separately after release. Local verification alone is not evidence of the production Blob configuration.
