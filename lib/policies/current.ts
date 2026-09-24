// Version and digest refer to the immutable JSON rendered by the public pages.
// Publish a new directory/version for policy changes; never edit accepted versions.
export const CURRENT_POLICIES = {
  termsVersion: '2026-09-24',
  termsSha256: '1660a4aaf4b9aa17c5a187fbecebeda5b8297eb8013c53bb2b17531c7f828096',
  privacyVersion: '2026-09-24',
  privacySha256: '6938d32bb0d54f7858eff4dc953662028dfb416c5dd039e7d9aea9a130c80553',
} as const;

export function validPolicyAcceptance(body: Record<string, unknown>) {
  return body.acceptTerms === true && body.termsVersion === CURRENT_POLICIES.termsVersion
    && body.privacyVersion === CURRENT_POLICIES.privacyVersion;
}
