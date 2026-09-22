# Database hardening rollout

This rollout keeps the additive migration, storage backfill, legacy-field backfill, verification, and destructive migration as separate gates. The scripts require an explicit target so a shell with a stale `DATABASE_URL` cannot silently select the wrong database.

## Preconditions

1. Make a provider snapshot or branch and record its identifier. Keep the original production database untouched during rehearsal. When using a provider snapshot restore API, pass `finalize: false` explicitly even when a target branch is supplied or omitted. Before and after the restore, verify that the restored copy points to its intended branch and that the production branch still points to the original production endpoint/default branch; record the endpoint mapping and restored-copy row-count/digest check. Never rely on a provider default that may finalize onto the snapshot source.
2. Confirm the selected environment file: `.env.local` must contain a loopback database URL; `.env.production` must contain a non-loopback production URL. The rollout scripts use the selected file as the authoritative database connection.
3. Confirm the additive migration is present and has been applied to the rehearsal target before any backfill. `migrate deploy` requires an explicit phase: `--phase=additive` copies the Prisma schema and migrations to a temporary directory while excluding the single known destructive migration; `--phase=complete` is reserved for the final post-verification step. Do not apply the destructive migration until the verification gate passes.
4. Deploy and smoke-test the storage-aware application before converting production media or removing legacy columns. It must retain HTTPS image references when saving an edited product and use a Prisma client that no longer selects the columns being removed. Exercise this on the rehearsal deployment first.

An operator that deliberately injects `DATABASE_URL` from a provider runtime file may use `--target=explicit` instead of `--env-file`; that mode still requires the exact `--expected-host` and `--expected-database` values, and `--confirm-target` for mutations. This keeps inherited runtime configuration explicit without letting a production env file silently replace a rehearsal connection.

## Rehearsal sequence

Use the isolated rehearsal database and an environment file containing that database URL. Set the expected host and database name from the provider console; the scripts compare both before connecting. These commands are examples; inspect every summary before continuing.

```sh
REHEARSAL_ENV_FILE='/absolute/path/rehearsal.env'
REHEARSAL_DB_HOST='copy-from-provider'
REHEARSAL_DB_NAME='copy-from-provider'

npm run prisma:migrate -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME" --confirm-target --phase=additive
npm run db:migrate-blobs -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME" --dry-run
npm run db:backfill-legacy -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME" --dry-run
npm run db:verify-drop-safety -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME"
```

If the rehearsal is intentionally mutated, run the storage migration with a configured blob token and write the backfill backup to a new path:

```sh
npm run db:migrate-blobs -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME" --confirm-target
npm run db:backfill-legacy -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME" --confirm-target --backup-file=/absolute/path/rehearsal-legacy-backup.json
npm run db:verify-drop-safety -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME"
npm run prisma:migrate -- --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME" --confirm-target --phase=complete
node scripts/prisma-env.mjs migrate status --target=rehearsal --env-file="$REHEARSAL_ENV_FILE" --expected-host="$REHEARSAL_DB_HOST" --expected-database="$REHEARSAL_DB_NAME" --confirm-target
```

## Production sequence

The production actions require an explicit confirmation flag and are intended for the release operator after the snapshot and rehearsal have been reviewed. Run the additive command first, deploy and verify the compatible application, and only then run the media/backfill commands. This document does not claim that production has been changed.

```sh
PRODUCTION_ENV_FILE='/absolute/path/production.env'
PRODUCTION_DB_HOST='copy-from-provider'
PRODUCTION_DB_NAME='copy-from-provider'

npm run prisma:migrate -- --target=production --env-file="$PRODUCTION_ENV_FILE" --expected-host="$PRODUCTION_DB_HOST" --expected-database="$PRODUCTION_DB_NAME" --confirm-production --phase=additive
# Deploy and verify the storage-aware application here before continuing.
npm run db:migrate-blobs -- --target=production --env-file="$PRODUCTION_ENV_FILE" --expected-host="$PRODUCTION_DB_HOST" --expected-database="$PRODUCTION_DB_NAME" --confirm-production
npm run db:backfill-legacy -- --target=production --env-file="$PRODUCTION_ENV_FILE" --expected-host="$PRODUCTION_DB_HOST" --expected-database="$PRODUCTION_DB_NAME" --confirm-production --backup-file=/absolute/path/legacy-backup-YYYYMMDD.json
npm run db:verify-drop-safety -- --target=production --env-file="$PRODUCTION_ENV_FILE" --expected-host="$PRODUCTION_DB_HOST" --expected-database="$PRODUCTION_DB_NAME"
```

Stop if any command reports a missing expected table, an unmigrated legacy product, a legacy conflict, a non-URL storage result, or a non-zero count. The backfill writes its backup with exclusive-create semantics, mode `0600`, and refuses to overwrite an existing file. The storage migration is idempotent for already-remote references and only migrates known media fields; it leaves other JSON values untouched.

After the verification output has been reviewed, apply the destructive migration through the same explicit production target:

```sh
npm run prisma:migrate -- --target=production --env-file="$PRODUCTION_ENV_FILE" --expected-host="$PRODUCTION_DB_HOST" --expected-database="$PRODUCTION_DB_NAME" --confirm-production --phase=complete
npm run env:check:runtime
```

The destructive migration must be the final schema step. Keep the provider snapshot and the legacy backup until application smoke checks and rollback review are complete.

## Rollback boundaries

- Before the destructive migration, schema changes remain additive. After media conversion, roll back only to a tested storage-aware application: older product editors may discard HTTPS image references. Restoring an older application may also require restoring its compatible media data from the backup.
- After the destructive migration, restore or promote the provider snapshot before rolling application code back to a revision that reads removed columns or models.
- Do not recreate removed payment or session behavior during rollback or feature work. The empty-table verification is a prerequisite for the destructive step, not a substitute for a provider snapshot.
