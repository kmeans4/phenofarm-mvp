# Production backup and recovery coverage

Configured September 24, 2026 for PhenoShop. This changes provider settings and adds independent operations automation; no application deployment or schema migration is required.

## Active protection

| Data | Mechanism | Frequency | Retention |
| --- | --- | --- | --- |
| Production database | Neon point-in-time recovery | Continuous history | 7 days |
| Production database | Native Neon snapshots | Daily at 07:00 UTC | 35 days |
| Database and all uploaded media | Private GitHub archive with hashes, URL manifest, and database dump | Daily at 07:17 UTC | 35 days |
| Retained archive recovery | Download, checksums, isolated PostgreSQL restore, and upload-reference check | After every backup and daily at 09:47 UTC | Results in private Actions logs |

UTC schedules avoid daylight-saving changes. GitHub may delay scheduled execution. A retained archive older than 30 hours fails the health check. The increased Neon history window accumulates going forward; it does not retroactively recover history already expired under the previous 6-hour setting.

- Neon project: `little-salad-95928561`; production branch: `br-wandering-snow-aig9frhe`; production endpoint remains `ep-delicate-math-ai8g76ti`.
- Native daily schedule read back as `frequency=daily`, `hour=7`, `retention_seconds=3024000`. Project history read back as `604800` seconds.
- A fresh native snapshot, `snap-sparkling-brook-aiehmvdq`, was created September 24 at 17:42:27 UTC and expires October 29 at 20:00 UTC. The previous manual snapshot and existing rehearsal branches were preserved.
- Independent backup workflow and recovery instructions: [private PhenoShop backup repository](https://github.com/kmeans4/phenoshop-backups).
- Source uploads remain in production Vercel Blob store `store_lasyMT89EUNl7H8y`. The job lists and reads every object, including uploaded images, logos, and lab PDFs. Backups include original paths/URLs and SHA-256 hashes so deleted objects can be recovered without guessing their database references.
- The backup database role `phenoshop_backup` can read all 22 current public tables and sequences; it has no INSERT, UPDATE, or DELETE privileges. Future public tables owned by `neondb_owner` inherit read access. Changes to schema/ownership must explicitly preserve backup access.
- Backup credentials are in the private repository's `production-backups` GitHub environment, restricted to `main`. No backup token was added to the production web application. The app’s database and upload settings remain unchanged.
- Failure alerts go to `support@phenoshop.app` through the established account-email provider. The setup test was reported delivered by Resend at 17:50 UTC. This is provider delivery confirmation, not a separate human inbox-placement confirmation.

## Recovery procedure

Use the [private repository README](https://github.com/kmeans4/phenoshop-backups#recovery) for archive recovery. A successful backup Actions run retains a private artifact containing `backup.tar.gz` and `summary.json`. `npm run restore:verify -- <archive> <summary>` there checks the hashes and restores into a disposable PostgreSQL 17 container with no external network and no exposed ports. It never restores over production.

For native Neon snapshot recovery, follow [the existing rollout/recovery procedure](../DATABASE_HARDENING_ROLLOUT.md). Always use `finalize: false` explicitly and confirm source/restored branch endpoint routing before any cutover. Restore tests must not replace production routing.

For a missing media object, the archive's manifest identifies its original store pathname and bytes. After verifying its hash, recover it to that original pathname with random suffixing disabled and its original MIME type. Preserve a newer existing object unless the incident decision calls for replacement. If the entire source store is lost, populate a replacement and migrate the saved URLs deliberately. Verify the resulting image/PDF through the application.

After any recovery, reapply applicable privacy-deletion decisions, validate business records/workflows, and run a fresh backup. GitHub artifacts expire after 35 days even if automation is broken, so alerts need an owner response. A GitHub outage can interrupt its backups and alerts; native Neon snapshots run independently. A Vercel outage or account problem does not remove the private GitHub copy. Preserve account/MFA recovery access separately.

## Scope and operating cost

The setup database is about 33 MB logically; the seven source uploads total 54,757 bytes. The first cloud archive is approximately 51 KB compressed. Watch storage, transfer, workflow minutes, and recovery duration as the catalog grows. No subscription plan was upgraded for this setup. These are recoverable archives, not a promise of automatic failover or zero data loss between daily media backups.

An optional extra private Blob store was briefly created during setup, but revealing its credential required interactive reauthentication. The working design uses private GitHub storage instead. The unused empty/unconnected store was removed; no credentials or copies depend on that unfinished login prompt.
