# PhenoShop domain rollout

Prepared September 23, 2026. **Pending registrar access; not live.** The product brand remains PhenoFarm.

## Prepared and verified

- Added `phenoshop.app` to the existing Vercel project `phenofarm-mvp` (`prj_9pLewagwNf3uOA2sle3r0O3RlQkv`). Ownership is verified; website DNS still points to Porkbun parking.
- Added `www.phenoshop.app` with a permanent redirect to the apex domain.
- Updated public, legal, authentication, billing-help, and admin support links to `support@phenoshop.app`; set the metadata base to `https://phenoshop.app`. Keep this source change out of production until forwarding works.
- The prepared code passed the production build and broad 112-test local workflow run. The contact page and its new address were inspected at desktop and 390px widths.
- Existing account email from `accounts@phenoshop.app` already uses verified Resend DNS. Website DNS changes must preserve those sending records.

## Remaining release steps

1. Sign into Porkbun and confirm the destination inbox for `support@phenoshop.app`. Do not store passwords, keys, or the forwarding destination in this document.
2. Recheck Vercel's domain configuration recommendations. The last observed apex recommendation was A records `216.150.1.1` and `216.150.16.1`; the `www` recommendation was CNAME `76bbcec7611c63fa.vercel-dns-017.com`. Replace website parking records, preserving existing Resend DKIM and the `send` subdomain's MX/SPF records. Leave nameservers at Porkbun.
3. Create support forwarding to the confirmed inbox through Porkbun. Verify the forwarding configuration and required root MX records without changing Resend's sending subdomain.
4. Confirm public DNS and valid HTTPS on both website names. Confirm `www` redirects to the apex with the full path/query intact.
5. In the existing production project, set `NEXTAUTH_URL=https://phenoshop.app` and `AUTH_MAIL_REPLY_TO=support@phenoshop.app`. Keep verification enforcement and Resend settings enabled. Update any configured public API origin consistently. Do not change real user credentials or mark users verified manually.
6. Publish this source change and deploy to the same project. Verify the production alias references the new candidate. Run signed-in account checks plus a synthetic verification/reset cycle whose actual email links use the new origin. Confirm the support reply-to address and receive a forwarding test in the destination inbox.
7. Redirect the old canonical Vercel hostname only after the new origin works. Check existing verification/reset paths, query strings, and token fragments survive the redirect. Users may need to sign in again because cookies do not cross domains.
8. Update the project/provider context with the verified production URL, deployment, support setup, and release evidence. Remove only task-owned synthetic records and private test credentials after checks.

If cutover fails, remove the old-host redirect first, restore the previous production auth origin, and redeploy the last working source before retrying. Preserve all account-email DNS records and application data.
