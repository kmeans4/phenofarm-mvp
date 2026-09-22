# September 22 review remediation

Sources: the checkpoint review at `2a5775f` (reviews `d2379f6`) and the full review at `72fc09f` (reviews older `main`, `d3114dd`). Their original documents are preserved alongside this log. Changes are made and reviewed sequentially on `codex/project-checkpoint-2026-09-22` / draft PR #1. No production deployment or database mutation is part of this work.

The checkpoint independently marked 113 of the original 126 findings fixed. The remaining items are tracked below; full-review new IDs use `Full N-` to distinguish them from checkpoint IDs.

| Item | Status / evidence |
| --- | --- |
| PF-002 | Fixed: SQL projects only the first bounded image URL; catalog, favorites, alerts, and storefronts serve durable URLs directly. Legacy fallback is authenticated, owner-scoped, size-limited, and privately cached. Encoded upload transport still converts to storage URLs before persistence (verified by the product/batch API regression); existing production migration is recorded in the September 18 rollout. Four focused API/browser tests passed, including desktop/mobile legacy compatibility and oversized second-image exclusion. Logo remains selected only where the settings form renders it, as a persisted URL. |
| PF-005 | Skipped: METRC, per user instruction. |
| PF-009 | Pending |
| PF-038 | Pending |
| PF-069 | Pending |
| PF-071 | Pending |
| PF-072 | Pending |
| PF-074 | Pending |
| PF-088 | Pending |
| PF-094 | Pending |
| PF-112 | Pending |
| PF-116 | Pending |
| PF-121 | Pending |
| N-001 | Pending |
| N-002 | Pending |
| N-003 | Pending |
| N-004 | Pending |
| N-005 | Pending |
| N-006 | Pending |
| N-007 | Pending |
| N-008 | Pending |
| N-009 | Pending |
| Full N-001 | Pending cross-check |
| Full N-002 | Pending cross-check |
| Full N-003 | Pending cross-check |
| Full N-004 | Pending cross-check |
| Full N-005 | Pending cross-check |

## Verification environment

Local app: `http://localhost:3150`; isolated local database: `phenofarm_auth_20260918`; authenticated local mail sink. Real mail delivery, production activation, and Stripe eligibility remain separate launch gates. The branch must remain unmerged until the release gates are satisfied.
