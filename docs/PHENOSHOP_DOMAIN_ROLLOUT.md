# PhenoShop domain rollout

Updated September 23, 2026. **Website cutover is live; support forwarding is pending destination confirmation.** The product brand remains PhenoFarm.

## Completed website cutover

- `phenoshop.app` is the canonical website in the existing Vercel project `phenofarm-mvp` (`prj_9pLewagwNf3uOA2sle3r0O3RlQkv`).
- Porkbun's parking records were replaced with apex A records `216.150.1.1` and `216.150.16.1`, and a `www` CNAME to `76bbcec7611c63fa.vercel-dns-017.com`. Nameservers remain at Porkbun. Vercel reports the DNS configuration valid.
- Existing Resend DKIM and the `send` subdomain's MX/SPF records were preserved. Vercel issued the website HTTPS certificate for the apex and `www` names; secure requests succeed without exceptions.
- `NEXTAUTH_URL=https://phenoshop.app` is active in production. The verified security release from PR #5 was redeployed with this origin: `dpl_ASmk4MfpC5huYTZNFrFyBDoGDW8D`, `phenofarm-a9qhfv3c5-kevin-means-projects.vercel.app`. The canonical domain points to this Ready deployment.
- Both `www.phenoshop.app` and the former canonical `phenofarm-mvp.vercel.app` permanently redirect to the new origin. HTTP checks preserved path/query; Chrome checks preserved the token fragments in verification and recovery links.
- A fresh synthetic grower registered on the new domain, received a verification email whose link uses the new origin, confirmed once, signed in with its credentials, and loaded protected dashboard/product/settings pages. The reset email also used the new origin; reset rejected replay, revoked the previous session, and allowed sign-in with the replacement password.
- The synthetic account was removed. All existing business-record count/hash snapshots across the 19 business tables matched the baseline. No migration was needed.
- Both production smoke checks passed. Chrome rendered signup correctly at desktop and 390px widths on the new domain.

## Prepared source changes

PR #6 updates public, legal, authentication, billing-help, and admin support links to `support@phenoshop.app`, and sets the metadata base to `https://phenoshop.app`. These source changes are still in draft, separate from the live website/auth-origin switch, because the support inbox has not been configured. The prepared source passed the production build and broad 112-test local workflow run; the contact address was inspected at desktop and 390px widths.

## Remaining support release steps

1. Confirm the destination inbox for `support@phenoshop.app`. Porkbun access is available, and its forwarding form is prepared. Do not store passwords, keys, or the forwarding destination in this document.
2. Create the free support forward. Verify required root MX records without changing the working Resend sending records.
3. Send an authorized forwarding test and confirm it reaches the destination inbox. Set production `AUTH_MAIL_REPLY_TO=support@phenoshop.app` after forwarding is ready.
4. Mark PR #6 ready, merge, and deploy to the existing project. Verify the new public contact links and reply-to header, and record the final deployment. Account verification enforcement remains enabled throughout.

If website cutover must be rolled back, remove the old-host redirect first, restore the previous production auth origin, and redeploy the last working source. Preserve all account-email DNS records and application data. Users may need to sign in again because cookies do not cross domains.
