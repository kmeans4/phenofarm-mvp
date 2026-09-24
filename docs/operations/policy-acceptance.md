# Policy acceptance history

New signup requires an unchecked-by-default agreement box. The API rejects missing/false/stale agreement and creates the account, business profile, and acceptance in one transaction. Existing grower, buyer, and admin users are redirected from their portal layout to `/account/terms` until they explicitly agree. They can read either policy in a separate tab, contact support, or sign out. No existing account is backfilled as having agreed.

`policy_acceptances` records the authenticated user, Terms version, Privacy notice version, SHA-256 fingerprints of both archived documents, database-generated acceptance time, and source (`signup` or `account`). Unique user/version constraints and an upsert without updates preserve the original record on retries. Neither a client-supplied identity nor timestamp is trusted. Repeating public signup for an existing email never alters that account's agreement.

This is an acceptance record and portal prompt, not a new API authorization rule. Existing roles, licenses, and business permissions remain the API security boundaries. Signing in or fetching a session alone does not imply agreement. Existing sessions see the prompt when a portal layout is next rendered.

The public Terms/Privacy pages render the immutable versioned JSON in `lib/policies/2026-09-24/`. `lib/policies/current.ts` identifies its version and byte fingerprints. For an update, preserve the old directory, publish new documents in a new version directory, update the public page imports/current metadata/effective date, and give any notice required by the policy. Never edit a version already accepted. The fingerprint regression check verifies archived bytes.

Support can retrieve records by user ID for an authenticated account request. No IP address or browser fingerprint is collected. Acceptance records follow account deletion via the foreign key, and are included in existing database backups/retention. Apply the existing privacy-request procedure; backups are not a permanent legal archive.

The additive migration creates only `policy_acceptances` and `operational_signals`. Rolling back app code can leave these tables in place, preserving records. Do not delete acceptance history as part of a code rollback.
