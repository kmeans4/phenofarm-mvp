/** @param {Record<string, string | undefined>} [env] */
function emailVerificationRequired(env = process.env) {
  const value = env.AUTH_REQUIRE_EMAIL_VERIFICATION;
  if (value && value !== 'true' && value !== 'false') {
    throw new Error('AUTH_REQUIRE_EMAIL_VERIFICATION must be true or false');
  }
  return value === 'true';
}

/** Reject an accidental verification rollout without a real delivery configuration.
 * This checks configuration only; successful inbox delivery remains a release gate.
 * @param {Record<string, string | undefined>} [env]
 */
function validateAuthRollout(env = process.env) {
  if (!emailVerificationRequired(env) || env.NODE_ENV !== 'production') return;
  let secureOrigin = false;
  try {
    const origin = new URL(env.NEXTAUTH_URL || '');
    secureOrigin = origin.protocol === 'https:' && !origin.username && !origin.password;
  } catch { /* Report the configuration error without any values. */ }
  if (env.AUTH_MAIL_PROVIDER !== 'resend' || !env.RESEND_API_KEY || !env.AUTH_MAIL_FROM || !secureOrigin) {
    throw new Error('Email verification activation requires production email delivery and a secure account origin');
  }
}

module.exports = { emailVerificationRequired, validateAuthRollout };
