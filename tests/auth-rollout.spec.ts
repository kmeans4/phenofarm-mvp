import { test, expect, request as requests } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode, type JWT } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { emailVerificationRequired, validateAuthRollout } from '../lib/auth-rollout.cjs';

const db = new PrismaClient();
const prefix = `auth-rollout-${Date.now()}`;
const legacyOrigin = 'http://localhost:3153';
test.use({ trace: 'off', video: 'off' });
test.beforeAll(() => {
  const url = new URL(process.env.DATABASE_URL || '');
  if (url.hostname !== 'localhost' || !url.pathname.startsWith('/phenofarm_auth_')) throw new Error('Requires isolated local auth database');
});
test.afterAll(async () => { await db.user.deleteMany({ where: { email: { startsWith: prefix } } }); await db.$disconnect(); });

test('verification activation is explicit and production configuration is checked', () => {
  expect(emailVerificationRequired({})).toBe(false);
  expect(emailVerificationRequired({ AUTH_REQUIRE_EMAIL_VERIFICATION: 'true' })).toBe(true);
  expect(() => emailVerificationRequired({ AUTH_REQUIRE_EMAIL_VERIFICATION: 'yes' })).toThrow();
  expect(() => validateAuthRollout({ NODE_ENV: 'production', AUTH_REQUIRE_EMAIL_VERIFICATION: 'true' })).toThrow();
  expect(() => validateAuthRollout({ NODE_ENV: 'production', AUTH_REQUIRE_EMAIL_VERIFICATION: 'false' })).not.toThrow();
  expect(() => validateAuthRollout({ NODE_ENV: 'production', AUTH_REQUIRE_EMAIL_VERIFICATION: 'true', AUTH_MAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-placeholder', AUTH_MAIL_FROM: 'sender@example.test', NEXTAUTH_URL: 'https://example.test' })).not.toThrow();
});

test('pilot login and old sessions survive the rollout, public signup stays closed, and revocation still works', async () => {
  const password = 'Pilot account test password!';
  const user = await db.user.create({ data: { email: `${prefix}@example.test`, role: 'GROWER', passwordHash: await bcrypt.hash(password, 10), grower: { create: { businessName: prefix } } } });
  // Deliberately reproduce a pre-rollout cookie without the new version field.
  const token = await encode({ secret: process.env.AUTH_SECRET!, token: { id: user.id, sub: user.id, role: user.role, email: user.email } as JWT, maxAge: 3600 });
  const old = await requests.newContext({ baseURL: legacyOrigin, extraHTTPHeaders: { Cookie: `next-auth.session-token=${token}` } });
  const login = await requests.newContext({ baseURL: legacyOrigin });
  try {
    expect((await (await old.get('/api/auth/session')).json()).user.id).toBe(user.id);
    const csrf = (await (await login.get('/api/auth/csrf')).json()).csrfToken;
    const response = await login.post('/api/auth/callback/credentials', { form: { csrfToken: csrf, email: user.email, password, json: 'true', callbackUrl: `${legacyOrigin}/grower/dashboard` } });
    expect((await response.json()).url).not.toContain('error');
    expect((await (await login.get('/api/auth/session')).json()).user.id).toBe(user.id);
    const signup = await login.post('/api/auth/register', { data: { email: `${prefix}-new@example.test`, password, businessName: prefix, businessType: 'grower' } });
    expect(signup.status()).toBe(503);
    expect(await db.user.count({ where: { email: `${prefix}-new@example.test` } })).toBe(0);
    // This is the same atomic version increment performed by password recovery.
    await db.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
    expect((await (await old.get('/api/auth/session')).json()).user).toBeUndefined();
    expect((await (await login.get('/api/auth/session')).json()).user).toBeUndefined();
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt).toBeNull();
  } finally { await old.dispose(); await login.dispose(); }
});
