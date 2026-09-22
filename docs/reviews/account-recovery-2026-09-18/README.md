# Account recovery and email verification

The local implementation is complete. Production activation requires a working mail provider and verified sender; deploying enforcement without delivery would prevent existing unverified users from signing in. No verification backfill or bypass flag is included.

As of September 18, 2026, the mail provider and verified sender are still pending selection. The production storage/database release intentionally retains the previous sign-in behavior. The new recovery, verification and email-change flows remain undeployed, and no external email delivery has been proven.

## Implemented behavior (not active in production)

- Every account, including existing growers, buyers and admins, must prove mailbox ownership. Sign-in offers a resend link after a correct password identifies an unverified account.
- Signup gives the same response for new and existing addresses, sends verification after the response, and never creates a session. An existing account is never overwritten.
- Verification links last 60 minutes and also require the account password. This prevents an attacker-created unverified account from becoming usable when the mailbox owner merely clicks an unsolicited link.
- Password-reset links last 30 minutes. A completed reset proves ownership of the current mailbox, permits recovery of an attacker-precreated account, and signs out all prior sessions.
- Email changes require an authenticated session and the current password. The login address stays unchanged until the new mailbox confirms a 30-minute link. Settings cannot change the email directly, and saved drafts cannot override it.
- Links contain 256-bit random secrets in URL fragments. Only SHA-256 hashes are stored. Explicit POST requests consume them; GET requests and email scanners do not. Every successful action increments a session version and invalidates every outstanding purpose for the account. A database row lock serializes competing actions.
- Every authenticated session read verifies the current database version and verification state. Old JWTs without a version fail closed. Requests are rate limited by opaque IP/account keys; confirmation attempts are also token limited.

## Mail configuration

| Variable | Production value |
| --- | --- |
| `NEXTAUTH_URL` | Canonical HTTPS app origin; links never use an untrusted Host header |
| `AUTH_MAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Secret provider key, configured outside Git/chat |
| `AUTH_MAIL_FROM` | Address or display-name/address on a verified sending domain |
| `AUTH_MAIL_REPLY_TO` | Optional monitored reply address |

The adapter uses the Resend send-email API through a server-only transport. Delivery failures log only a fixed error code and action purpose. No address, password, provider response or recovery link is logged. Generic responses do not disclose whether a mailbox belongs to an account. If mail is not configured, public requests and signup report temporary unavailability consistently.

Configure and verify the sender, confirm an authorized test recipient, validate real delivery, and then deploy authentication enforcement. Existing users verify on their next sign-in; the migration intentionally leaves `emailVerifiedAt` null. Email verification and cannabis license approval remain separate.

## Local testing

Use a disposable database whose name starts with `phenofarm_auth_`, a loopback `DATABASE_URL` and `NEXTAUTH_URL`, `AUTH_MAIL_PROVIDER=local-test`, `AUTH_MAIL_TEST_URL=http://127.0.0.1:3151/messages`, and a random `AUTH_MAIL_TEST_KEY` of at least 32 characters. Start `scripts/auth-test-mail-server.mjs` with those private environment values. It keeps mail in memory and never forwards it. Both the transport and sink reject production mode, Vercel, non-loopback endpoints and non-test database names.

The task used `phenofarm_auth_20260918`, app port 3150, and an authenticated in-memory sink on port 3151. Credentials remain in private temporary runtime files, outside this report. The original local and production databases were not used for these tests.

Run `npm test -- tests/account-recovery.spec.ts` with the same explicit local environment. The spec has 16 cases covering generic registration, mailbox/password verification, all existing roles, expiry, purpose binding, replay, concurrent reset, cross-purpose races, two accounts claiming one email, session revocation, legacy-token rejection, profile bypass attempts, bounded same-origin requests, password limits, rate limits and transport guards. Trace/video recording is disabled because request bodies contain recovery credentials.

The first 15 cases passed, followed by the new all-role case and expanded end-to-end flows at 360 and 1440px. One test-only selector was corrected to distinguish the app alert from Next.js's route announcer. The final mobile and desktop flows passed through signup, verification, email change, reset and a reused-link error. All 14 saved screenshots were visually inspected, including final concise password-helper captures. Inputs measured at least 16px with controls at least 40px high; no page overflow was observed. Screenshots use synthetic `example.test` addresses.

The final aggregate `npm run verify` passed, including environment documentation, ESLint, Prisma generation, TypeScript and optimized production build. All 63 existing workflow regression tests also passed against the isolated local clone. This report does not claim external email delivery or a production authentication rollout.

## Sources

Implementation follows the existing NextAuth 4 integration and current [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication), [Route Handler API](https://nextjs.org/docs/app/api-reference/file-conventions/route), [NextAuth callbacks](https://next-auth.js.org/configuration/callbacks) and [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).
