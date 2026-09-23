# PhenoFarm File Storage Policy

## Active Decision

PhenoFarm stores validated uploads in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured:

- Product images
- Grower logos
- Dispensary logos

Local development falls back to data URLs when the token is absent. Both paths use the same strict gates in `lib/upload-validation.ts`.

## Not Acceptable For Larger Launch Use

Do not raise the current DB-backed limits for images, documents, or lab PDFs. Larger files, private compliance documents, and long-term document retention should move to object storage before launch scale:

- Preferred on Vercel: Vercel Blob
- Acceptable alternative: S3-compatible object storage

## Current Rules

- Product images: JPG, PNG, or WebP only; 1MB per image; two images per product.
- Logos: JPG, PNG, or WebP only; 500KB per logo.
- Product documents and batch lab PDFs: PDF only; 2MB per document.
- CSV imports: CSV only; 1MB max; all rows validate before any products are created.

## Migration

Run `npm run db:migrate-blobs` after configuring Blob. It scans product images/documents, batch COA and nested lab-document values, and grower/dispensary logos. HTTP(S) URLs are skipped, making the migration idempotent.

The current routes use public Blob URLs to preserve existing rendering and download behavior. A future compliance hardening pass should move private lab records behind authenticated downloads.
