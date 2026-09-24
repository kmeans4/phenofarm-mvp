# Website monitoring

PhenoShop monitoring uses the private `kmeans4/phenoshop-backups` repository's **Website monitoring** workflow. It checks the canonical homepage, sign-in and signup pages, then an authenticated, uncached database health endpoint every 15 minutes (UTC minutes 8, 23, 38, 53). Failed probes retry after ten seconds. GitHub schedules may be delayed; this is not a guaranteed 15-minute detection SLA. A GitHub outage can interrupt probes and their emails.

Alerts go to `support@phenoshop.app`. Downtime alerts repeat at most every four hours; a passing probe after an outage sends recovery. Server errors captured by Next's request-error hook or existing server `console.error` calls send an immediate email, deduplicated across instances in each 15-minute interval. An aggregate counter also persists in Postgres so errors between probes are not lost. External checks alert on new counter values, and report recovery after a passing check with no new errors and at least five minutes since the last recorded error. The first direct alert and external confirmation are separate safeguards.

No error messages, stacks, request bodies, headers, tokens, or account details are copied into monitoring records/emails. Existing diagnostics stay in Vercel runtime logs. Aggregate signals are not an exact count of distinct incidents; one framework failure may be logged more than once. Browser-only exceptions and errors silently swallowed without logging are outside this coverage.

## Configuration

Vercel production: `MONITORING_ENABLED=true`, a random `MONITORING_TOKEN` (at least 32 characters), and the existing `RESEND_API_KEY` / `AUTH_MAIL_FROM`. The private GitHub `production-backups` environment holds the same monitor token and the established `BACKUP_MAIL_API_KEY`. The probe token grants only health access and a controlled error drill; it grants no business-data access. Neither credential is browser-exposed. API replies are uncached.

The runner retains incident state in private `website-monitor-state` artifacts for three days. Single-workflow concurrency serializes updates. If state cannot be read or alert delivery fails, the job fails and attempts a separate monitor-failure alert; it does not silently acknowledge the incident. If both mail paths are down, GitHub's failed-run notifications and Actions history are the remaining indicators. Provider outages still need human response.

## Response ownership and recovery

The PhenoShop operator monitors the support inbox and owns incident triage. On an alert:

1. Open the linked private Actions run. Confirm the canonical website and inspect Vercel production runtime/deployment status and Neon availability.
2. Identify a recent release or provider failure. Preserve the last good backups. Do not restore production or rotate credentials based only on a failed probe.
3. Correct the fault or deliberately roll back the affected code. Run **Website monitoring** manually with `drill=false` and verify recovery mail. Recheck any affected business workflow; green probes alone do not establish its correctness.

The manual `drill=true` mode sends clearly labeled simulated downtime and recovery emails by probing an actual temporary HTTP server that returns 503 then 200. It also makes one authenticated POST to `/api/ops/drill`; that request throws through the real production Next.js error hook. Other routes remain online and customer records are unchanged. Wait at least five minutes and run a normal check to verify the production error-recovery path. Do not test downtime by taking the public app offline.

No paid monitoring plan was added. Watch GitHub runner minutes and Resend quotas. For tighter detection guarantees, use a dedicated independent monitoring provider.
