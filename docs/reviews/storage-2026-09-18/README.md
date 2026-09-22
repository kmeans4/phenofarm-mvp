# Production storage verification

The production app passed 17 initial storage checks and 12 repeat checks after the final database migrations. The proof used a unique temporary QA account, its own grower/product and its own uploaded files.

- Image, PDF and logo uploads returned Blob URLs; downloaded bytes and MIME types matched exactly.
- Product creation, API reads/edits and the real product editor's Save changes action retained the image and PDF. A logo-only profile save retained the logo.
- The fixture stayed unavailable with zero stock. The editor's save publishes, so the proof restored DRAFT immediately afterward.
- The editor and settings rendered decoded previews without horizontal overflow or browser runtime errors at 1440×1000 and 390×844. All four fresh post-migration full-page screenshots were visually inspected.

[Initial checks](run-evidence.json) retain the original test and inspection results. Those first screenshot files were overwritten during the repeat check, so this archive contains only the latest [post-migration evidence](verify-evidence.json) and its four screenshots. Screenshot references are relative; no runtime credentials, session cookies or private fixture files are included.

| Screen | Desktop | Mobile |
| --- | --- | --- |
| Product editor | [1440px](screenshots/product-editor-1440.png) | [390px](screenshots/product-editor-390.png) |
| Settings/logo | [1440px](screenshots/settings-1440.png) | [390px](screenshots/settings-390.png) |

The release lead subsequently cleaned the exact production QA rows and uploaded files; its cleanup verification passed. Screenshots and test results remain as evidence.

This is storage verification on the production alias, not an authentication email rollout. The separate [account-recovery implementation](../account-recovery-2026-09-18/README.md) still awaits a mail provider, verified sender and delivery proof. Browser checks used Chrome viewport emulation; physical devices were not tested.
