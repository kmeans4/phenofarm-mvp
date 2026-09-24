# Monitoring and policy acceptance release

## Shipped changes

- Explicit, unchecked signup agreement; durable version/digest/time records in the same transaction as the new account and profile.
- Existing grower, buyer, and admin portal users must actively agree. No prior account was backfilled. Retries preserve the first timestamp and client identity/time/digest fields cannot overwrite it.
- Versioned, immutable Terms/Privacy source is also rendered by the public pages. The policy wording and effective date are unchanged.
- Authenticated uncached health probe, aggregate server-error capture, direct support alerts, and a protected one-request error drill. External 15-minute website/error/recovery checks are in the private operations repository.

## Verification

- `npm run verify`: passed, including environment validation, lint, production build, and TypeScript.
- Eight focused Playwright checks passed: archival digests, explicit/stale/missing signup agreement, concurrent signup, all three existing account roles, failed-save retry, forged identity/time, concurrent acceptance retries, session persistence, desktop/320/390 layouts, and protected monitoring endpoints.
- GitHub verification run [36054400031](https://github.com/kmeans4/phenofarm-mvp/actions/runs/36054400031) passed.
- Fresh production backup and isolated archive restore [36053620497](https://github.com/kmeans4/phenoshop-backups/actions/runs/36053620497) passed before migration.
- Only migration `20260925010000_monitoring_policy_acceptance` was pending and applied in production. It creates two tables; no existing table was altered or removed. The backup role can SELECT both new tables.
- Production release `dpl_8oAShbn1Zsb6dECp6fNz2qszU559` was Ready and aliased to `phenoshop.app`. An earlier attempt was blocked by Git author attribution; the unpublished task commit was corrected to the authenticated GitHub account `kmeans4`, then published and successfully deployed. No team-access controls were disabled.
- Real production mobile signup, delivered verification-link confirmation, credential login, existing synthetic buyer acceptance, concurrent retries, and unsigned/cross-origin rejection passed. Synthetic accounts were removed; counts and SHA-256 fingerprints across 20 business/policy tables matched the baseline afterward.
- Live screenshots at 320 and 390 pixels were inspected; local screens also covered 1440 pixels and all three roles.
- Controlled monitoring workflow [36054532720](https://github.com/kmeans4/phenoshop-backups/actions/runs/36054532720) passed: a temporary HTTP probe returned 503 then 200, and one authenticated production drill request threw through Next's real error hook. Vercel's production 5xx scan showed only `/api/ops/drill`.
- Resend reported the test downtime, test recovery, direct server-error, and independent application-error emails delivered to `support@phenoshop.app` at 20:23 UTC. This is provider delivery confirmation, not a new human inbox-placement confirmation.

## Follow-up observations

The new backup check exposed an existing temporary-Postgres startup race: Unix socket readiness could succeed during initialization just before the container restarted. The private backup code now waits for final TCP readiness, without exposing any container port. Backup artifact discovery also now paginates so frequent monitoring artifacts cannot hide retained backups.

See [monitoring operations](../operations/website-monitoring.md) for response ownership, recovery, best-effort scheduling and browser-only error limitations, and [policy acceptance](../operations/policy-acceptance.md) for record semantics, future versions, and safe rollback. Existing unrelated landing-page edits and older untracked audit evidence were excluded from this release.
