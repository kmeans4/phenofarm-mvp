# PhenoShop domain rollout

Updated September 23, 2026. **Website cutover and the Porkbun support mailbox are active. This PR publishes the new contact links; its release verification records the final production deployment.** The product brand remains PhenoFarm.

## Completed website cutover

- `phenoshop.app` is the canonical website in the existing Vercel project `phenofarm-mvp` (`prj_9pLewagwNf3uOA2sle3r0O3RlQkv`).
- Porkbun's parking records were replaced with apex A records `216.150.1.1` and `216.150.16.1`, and a `www` CNAME to `76bbcec7611c63fa.vercel-dns-017.com`. Nameservers remain at Porkbun. Vercel reports the DNS configuration valid.
- Existing Resend DKIM and the `send` subdomain's MX/SPF records were preserved. Vercel issued the website HTTPS certificate for the apex and `www` names; secure requests succeed without exceptions.
- `NEXTAUTH_URL=https://phenoshop.app` is active in production. The verified security release from PR #5 was redeployed with this origin: `dpl_ASmk4MfpC5huYTZNFrFyBDoGDW8D`, `phenofarm-a9qhfv3c5-kevin-means-projects.vercel.app`. The canonical domain points to this Ready deployment.
- Both `www.phenoshop.app` and the former canonical `phenofarm-mvp.vercel.app` permanently redirect to the new origin. HTTP checks preserved path/query; Chrome checks preserved the token fragments in verification and recovery links.
- A fresh synthetic grower registered on the new domain, received a verification email whose link uses the new origin, confirmed once, signed in with its credentials, and loaded protected dashboard/product/settings pages. The reset email also used the new origin; reset rejected replay, revoked the previous session, and allowed sign-in with the replacement password.
- The synthetic account was removed. All existing business-record count/hash snapshots across the 19 business tables matched the baseline. No migration was needed.
- Both production smoke checks passed. Chrome rendered signup correctly at desktop and 390px widths on the new domain.

## Source changes

PR #6 updates public, legal, authentication, billing-help, and admin support links to `support@phenoshop.app`, sets the metadata base to `https://phenoshop.app`, and updates the landing-page workspace preview address. The prepared source passed the production build and broad 112-test local workflow run; the contact address was inspected at desktop and 390px widths. GitHub verification and the Vercel preview passed on the final application source.

## Support mailbox and release

1. Completed: purchased one Porkbun hosted mailbox for $36 after the user approved the checkout agreement and automatic annual renewal. Porkbun confirmed the charge and lists the initial expiration as September 24, 2027. Do not store payment details, passwords, or keys in this document.
2. The user created `support@phenoshop.app` and entered its password directly. Webmail access works; the display name is `PhenoFarm Support`. The root MX records point to `fwd1.porkbun.com` (priority 10) and `fwd2.porkbun.com` (priority 20). Root SPF authorizes `_spf.porkbun.com`, Porkbun DKIM uses `default._domainkey`, and DMARC is configured. Existing website and Resend records remain intact.
3. An incoming Resend test was marked delivered and appeared in the support inbox. An outgoing message was sent to the user's approved test inbox for reply confirmation. Production `AUTH_MAIL_REPLY_TO=support@phenoshop.app` is saved for the release. Automated account mail continues through Resend.
4. Release sequence: mark PR #6 ready, merge, verify the new production deployment and public contact links, and exercise account verification/reset with the support reply-to header. Record the deployment and final delivery results in the PR's release verification. Account verification enforcement remains enabled throughout.

For Outlook, use the complete address as the username, IMAP `imap.porkbun.com` on port 993 with SSL/TLS, and SMTP `smtp.porkbun.com` on port 465 with SSL/TLS. Porkbun documents port 465 as an alternative for Outlook clients affected by its STARTTLS issue. The user enters the mailbox password directly; no password belongs in application configuration or this repository.

If website cutover must be rolled back, remove the old-host redirect first, restore the previous production auth origin, and redeploy the last working source. Preserve all account-email DNS records and application data. Users may need to sign in again because cookies do not cross domains.
