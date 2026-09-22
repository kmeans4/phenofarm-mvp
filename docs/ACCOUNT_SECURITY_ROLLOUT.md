# Account verification rollout

`AUTH_REQUIRE_EMAIL_VERIFICATION` defaults to `false`. This preserves password login for existing pilot accounts and accepts pre-rollout sessions only while their stored session version is zero. Public sign-up returns an unavailable response in this mode; it cannot create new accounts that bypass verification. Password resets continue to revoke all older sessions immediately.

Before setting the flag to `true`, configure the production mail provider and verified sender, test real verification and recovery delivery, and give pilot users a way to verify or recover their accounts. Enabling it requires mailbox verification and a versioned session for every role, including administrators. Old sessions must sign in again. No account is silently marked verified.

Production builds reject verification activation without Resend configuration and an HTTPS account origin. This configuration check does not prove inbox delivery; real delivery is still a release gate. Do not merge the checkpoint or deploy as part of the code-review remediation.

The local auth regression environment explicitly enables verification and uses a guarded in-memory mail sink. Neither the sink nor its credentials are valid in production.
