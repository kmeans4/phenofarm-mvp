import { test, expect, request as requests, type APIRequestContext } from '@playwright/test';
import { PrismaClient, AccountActionPurpose } from '@prisma/client';
import { encode, type JWT } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { accountMailConfigured, accountOrigin } from '../lib/account-mail';
import { requestAccountLink } from '../lib/account-security';

const db = new PrismaClient();
const baseURL = process.env.PLAYWRIGHT_BASE_URL || '';
const prefix = `auth-recovery-${Date.now()}`;
const password = 'Initial test password 123!';
const newPassword = 'Recovered test password 456!';
const contexts: APIRequestContext[] = [];
let sequence = 0;
const loopback = (host: string) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

test.describe.configure({ mode: 'serial' });
test.use({ trace: 'off', video: 'off' }); // Recovery secrets must not be written into trace request bodies or URLs.
test.setTimeout(90_000);
test.beforeAll(() => {
  const database = new URL(process.env.DATABASE_URL || '');
  if (!loopback(new URL(baseURL).hostname) || !loopback(database.hostname) || !database.pathname.startsWith('/phenofarm_auth_')
    || process.env.AUTH_MAIL_PROVIDER !== 'local-test' || !process.env.AUTH_MAIL_TEST_KEY || process.env.NODE_ENV === 'production') {
    throw new Error('Account recovery tests require an isolated auth clone and local mail sink');
  }
});
test.afterAll(async () => {
  await Promise.all(contexts.map(context => context.dispose()));
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.$disconnect();
});

async function api(cookie?: string) {
  const context = await requests.newContext({ baseURL, extraHTTPHeaders: {
    'x-forwarded-for': `198.18.${Math.floor(sequence / 200)}.${++sequence % 200 + 1}`,
    ...(cookie ? { Cookie: cookie } : {}),
  } });
  contexts.push(context); return context;
}
async function account(verified = true, role: 'GROWER' | 'DISPENSARY' | 'ADMIN' = 'GROWER') {
  const email = `${prefix}-${++sequence}@example.test`;
  const user = await db.user.create({ data: {
    email, name: prefix, role, passwordHash: await bcrypt.hash(password, 10), emailVerifiedAt: verified ? new Date() : null,
    ...(role === 'GROWER' ? { grower: { create: { businessName: prefix, licenseNumber: prefix, licenseExpiry: new Date('2030-12-31') } } }
      : role === 'DISPENSARY' ? { dispensary: { create: { businessName: prefix, licenseNumber: prefix, licenseExpiry: new Date('2030-12-31') } } } : {}),
  }, include: { grower: true, dispensary: true } });
  const token = await encode({ secret: process.env.AUTH_SECRET!, maxAge: 3600, token: { id: user.id, sub: user.id, email, role, sessionVersion: user.sessionVersion } });
  return { ...user, api: await api(`next-auth.session-token=${token}`), cookie: token };
}
async function messages(email: string) {
  const response = await fetch(`${process.env.AUTH_MAIL_TEST_URL}?to=${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${process.env.AUTH_MAIL_TEST_KEY}` } });
  expect(response.status).toBe(200);
  return await response.json() as { id: string; to: string; subject: string; text: string }[];
}
async function delivered(email: string, subject: string) {
  await expect.poll(async () => (await messages(email)).filter(row => row.subject.startsWith(subject)).length, { timeout: 15_000 }).toBeGreaterThan(0);
  const found = (await messages(email)).filter(row => row.subject.startsWith(subject)).at(-1)!;
  const url = new URL(found.text.match(/http:\/\/localhost:3150\/\S+/)![0]);
  const token = new URLSearchParams(url.hash.slice(1)).get('token')!;
  expect(token).toHaveLength(43);
  return { url: url.href, token };
}
async function requestLink(email: string, purpose: 'RESET_PASSWORD' | 'VERIFY_EMAIL', context?: APIRequestContext) {
  const client = context || await api();
  const endpoint = purpose === 'RESET_PASSWORD' ? '/api/auth/forgot-password' : '/api/auth/verification/request';
  const response = await client.post(endpoint, { data: { email } });
  expect(response.status()).toBe(200);
  return delivered(email, purpose === 'RESET_PASSWORD' ? 'Reset your password' : 'Verify your email');
}
async function signIn(context: APIRequestContext, email: string, secret: string) {
  const csrf = await (await context.get('/api/auth/csrf')).json();
  const result = await context.post('/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email, password: secret, json: 'true', callbackUrl: baseURL + '/grower/dashboard' } });
  return await result.json();
}

test('registration is generic and creates one unverified account without a session', async () => {
  const context = await api(); const email = `${prefix}-signup@example.test`;
  const payload = { email, password, firstName: 'Mail', lastName: 'Owner', businessName: 'Recovery test', businessType: 'grower' };
  const responses = await Promise.all([context.post('/api/auth/register', { data: payload }), context.post('/api/auth/register', { data: payload })]);
  expect(responses.map(value => value.status())).toEqual([201, 201]);
  const bodies = await Promise.all(responses.map(value => value.json()));
  expect(bodies[0]).toEqual(bodies[1]); expect(bodies[0]).not.toHaveProperty('userId'); expect(bodies[0]).not.toHaveProperty('role');
  expect(responses.every(value => !value.headers()['set-cookie'])).toBe(true);
  const users = await db.user.findMany({ where: { email }, include: { grower: true } });
  expect(users).toHaveLength(1); expect(users[0].emailVerifiedAt).toBeNull(); expect(users[0].sessionVersion).toBe(0); expect(users[0].grower).not.toBeNull();
  const proof = await delivered(email, 'Verify your email');
  const token = await db.accountActionToken.findUniqueOrThrow({ where: { tokenHash: hash(proof.token) } });
  expect(token.purpose).toBe('VERIFY_EMAIL'); expect(token.expiresAt.getTime() - token.createdAt.getTime()).toBeGreaterThan(55 * 60_000);
  expect(JSON.stringify(token)).not.toContain(proof.token);
  expect((await signIn(context, email, password)).url).toContain('EmailNotVerified');
  expect((await (await context.get('/api/auth/session')).json()).user).toBeUndefined();
});

test('registration reports profile storage failures and rolls back both account types', async () => {
  // The suite guard restricts this failure injection to a named local auth clone.
  await db.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION test_registration_failure() RETURNS trigger AS $$
    BEGIN
      IF NEW."businessName" = 'Review registration failure' THEN RAISE EXCEPTION 'Test profile failure'; END IF;
      RETURN NEW;
    END; $$ LANGUAGE plpgsql`);
  try {
    await db.$executeRawUnsafe('CREATE TRIGGER test_registration_failure BEFORE INSERT ON growers FOR EACH ROW EXECUTE FUNCTION test_registration_failure()');
    await db.$executeRawUnsafe('CREATE TRIGGER test_registration_failure BEFORE INSERT ON dispensaries FOR EACH ROW EXECUTE FUNCTION test_registration_failure()');
    for (const businessType of ['grower', 'dispensary']) {
      const context = await api(); const email = `${prefix}-storage-${businessType}@example.test`;
      const response = await context.post('/api/auth/register', { data: { email, password, businessName: 'Review registration failure', businessType } });
      expect(response.status()).toBe(503);
      expect(await db.user.count({ where: { email } })).toBe(0);
      expect(await messages(email)).toEqual([]);
    }
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS test_registration_failure ON growers');
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS test_registration_failure ON dispensaries');
    await db.$executeRawUnsafe('DROP FUNCTION IF EXISTS test_registration_failure()');
  }
});

test('verification needs mailbox token plus password, rejects replay, and enables real sign-in', async () => {
  const user = await account(false); const context = await api();
  const proof = await requestLink(user.email, 'VERIFY_EMAIL');
  expect((await context.post('/api/auth/verification/confirm', { data: { token: proof.token, password: 'wrong-password' } })).status()).toBe(400);
  expect((await db.accountActionToken.findUniqueOrThrow({ where: { tokenHash: hash(proof.token) } })).consumedAt).toBeNull();
  const accepted = await context.post('/api/auth/verification/confirm', { data: { token: proof.token, password } });
  expect(accepted.status()).toBe(200); expect(accepted.headers()['set-cookie']).toBeUndefined();
  const current = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  expect(current.emailVerifiedAt).not.toBeNull(); expect(current.sessionVersion).toBe(1);
  expect((await context.post('/api/auth/verification/confirm', { data: { token: proof.token, password } })).status()).toBe(400);
  await signIn(context, user.email, password);
  expect((await (await context.get('/api/auth/session')).json()).user.id).toBe(user.id);
  expect((await context.get('/api/grower/settings')).status()).toBe(200);
});

test('unknown and existing recovery requests are indistinguishable and eligibility is private', async () => {
  const user = await account(); const context = await api();
  const known = await context.post('/api/auth/forgot-password', { data: { email: user.email.toUpperCase() } });
  const unknownEmail = `${prefix}-missing@example.test`;
  const unknown = await context.post('/api/auth/forgot-password', { data: { email: unknownEmail } });
  expect(known.status()).toBe(unknown.status()); expect(await known.json()).toEqual(await unknown.json());
  await delivered(user.email, 'Reset your password'); expect(await messages(unknownEmail)).toHaveLength(0);
  const alreadyVerified = await context.post('/api/auth/verification/request', { data: { email: user.email } });
  expect(alreadyVerified.status()).toBe(200);
  expect((await messages(user.email)).filter(row => row.subject.startsWith('Verify your email'))).toHaveLength(0);
});

test('existing grower, buyer and admin accounts can resend and verify without losing their role', async () => {
  for (const role of ['GROWER', 'DISPENSARY', 'ADMIN'] as const) {
    const user = await account(false, role); const context = await api();
    expect((await signIn(context, user.email, password)).url).toContain('EmailNotVerified');
    const proof = await requestLink(user.email, 'VERIFY_EMAIL', context);
    expect((await context.post('/api/auth/verification/confirm', { data: { token: proof.token, password } })).status()).toBe(200);
    await signIn(context, user.email, password);
    const session = await (await context.get('/api/auth/session')).json();
    expect(session.user.id).toBe(user.id); expect(session.user.role).toBe(role); expect(session.user.sessionVersion).toBe(1);
  }
});

test('expired and wrong-purpose tokens cannot reset, and reset recovers an unverified pre-created account', async () => {
  const user = await account(false); const context = await api();
  const verification = await requestLink(user.email, 'VERIFY_EMAIL');
  const reset = await requestLink(user.email, 'RESET_PASSWORD');
  expect((await context.post('/api/auth/reset-password', { data: { token: verification.token, password: newPassword } })).status()).toBe(400);
  await db.accountActionToken.update({ where: { tokenHash: hash(reset.token) }, data: { expiresAt: new Date(Date.now() - 1_000) } });
  expect((await context.post('/api/auth/reset-password', { data: { token: reset.token, password: newPassword } })).status()).toBe(400);
  const newer = await requestLink(user.email, 'RESET_PASSWORD');
  // Wait for a second delivery rather than accepting the prior mail.
  await expect.poll(async () => (await messages(user.email)).filter(row => row.subject.startsWith('Reset your password')).length).toBe(2);
  const newest = await delivered(user.email, 'Reset your password');
  expect(newest.token).not.toBe(reset.token); void newer;
  expect((await context.post('/api/auth/reset-password', { data: { token: newest.token, password: newPassword } })).status()).toBe(200);
  const current = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  expect(current.emailVerifiedAt).not.toBeNull(); expect(current.sessionVersion).toBe(1);
  expect(await bcrypt.compare(newPassword, current.passwordHash!)).toBe(true);
  expect((await context.post('/api/auth/verification/confirm', { data: { token: verification.token, password } })).status()).toBe(400);
  await signIn(context, user.email, newPassword);
  expect((await (await context.get('/api/auth/session')).json()).user.id).toBe(user.id);
});

test('simultaneous resets have one winner and revoke old sessions immediately', async () => {
  const user = await account(); const context = await api();
  expect((await user.api.get('/api/grower/settings')).status()).toBe(200);
  const proof = await requestLink(user.email, 'RESET_PASSWORD');
  const candidatePasswords = [newPassword, 'Other fresh password 789!'];
  const responses = await Promise.all(candidatePasswords.map(value => context.post('/api/auth/reset-password', { data: { token: proof.token, password: value } })));
  expect(responses.map(value => value.status()).sort()).toEqual([200, 400]);
  const winner = responses.findIndex(value => value.status() === 200);
  const current = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  expect(current.sessionVersion).toBe(1); expect(await bcrypt.compare(candidatePasswords[winner], current.passwordHash!)).toBe(true);
  expect((await user.api.get('/api/grower/settings')).status()).toBe(401);
  expect((await (await user.api.get('/api/auth/session')).json()).user).toBeUndefined();
  expect((await signIn(context, user.email, password)).url).toContain('CredentialsSignin');
});

test('legacy and unverified signed JWTs cannot authorize APIs or protected pages', async () => {
  const pending = await account(false);
  expect((await pending.api.get('/api/grower/settings')).status()).toBe(401);
  const page = await pending.api.get('/grower/dashboard', { maxRedirects: 0 }); expect([302, 307]).toContain(page.status());
  const verified = await account();
  const legacy = await encode({ secret: process.env.AUTH_SECRET!, maxAge: 3600, token: { id: verified.id, sub: verified.id, role: 'ADMIN', email: verified.email } as JWT });
  const old = await api(`next-auth.session-token=${legacy}`);
  expect((await old.get('/api/grower/settings')).status()).toBe(401);
  expect((await old.post('/admin/growers/unknown/verify', { data: {} })).status()).toBe(401);
});

test('email changes require current password, retain old email until proof, then revoke sessions', async () => {
  const user = await account(); const target = `${prefix}-changed@example.test`;
  expect((await user.api.post('/api/auth/change-email', { data: { email: target, currentPassword: 'incorrect' } })).status()).toBe(400);
  expect((await user.api.post('/api/auth/change-email', { data: { email: target, currentPassword: password } })).status()).toBe(200);
  const proof = await delivered(target, 'Confirm your new email');
  expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(user.email);
  const context = await api();
  expect((await context.get('/auth/confirm-email-change#token=' + proof.token)).status()).toBe(200);
  expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(user.email);
  expect((await context.post('/api/auth/confirm-email-change', { data: { token: proof.token } })).status()).toBe(200);
  const current = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  expect(current.email).toBe(target); expect(current.sessionVersion).toBe(1); expect(current.emailVerifiedAt).not.toBeNull();
  expect((await user.api.get('/api/grower/settings')).status()).toBe(401);
  expect((await context.post('/api/auth/confirm-email-change', { data: { token: proof.token } })).status()).toBe(400);
  await signIn(context, target, password); expect((await (await context.get('/api/auth/session')).json()).user.id).toBe(user.id);
});

test('password reset and email change serialize across purposes', async () => {
  const user = await account(); const target = `${prefix}-race-target@example.test`; const context = await api();
  expect((await user.api.post('/api/auth/change-email', { data: { email: target, currentPassword: password } })).status()).toBe(200);
  const change = await delivered(target, 'Confirm your new email'); const reset = await requestLink(user.email, 'RESET_PASSWORD');
  const result = await Promise.all([
    context.post('/api/auth/confirm-email-change', { data: { token: change.token } }),
    context.post('/api/auth/reset-password', { data: { token: reset.token, password: newPassword } }),
  ]);
  expect(result.map(value => value.status()).sort()).toEqual([200, 400]);
  const current = await db.user.findUniqueOrThrow({ where: { id: user.id } }); expect(current.sessionVersion).toBe(1);
  expect(current.email).toBe(result[0].status() === 200 ? target : user.email);
  expect(await bcrypt.compare(result[0].status() === 200 ? password : newPassword, current.passwordHash!)).toBe(true);
  expect(await db.accountActionToken.count({ where: { userId: user.id, consumedAt: null } })).toBe(0);
  await requestAccountLink(`${prefix}-stale@example.test`, 'CHANGE_EMAIL', user.id, 0);
  expect(await db.accountActionToken.count({ where: { email: `${prefix}-stale@example.test` } })).toBe(0);
});

test('two users confirming the same new address cannot steal or corrupt accounts', async () => {
  const [first, second] = await Promise.all([account(), account()]); const target = `${prefix}-collision@example.test`;
  for (const user of [first, second]) expect((await user.api.post('/api/auth/change-email', { data: { email: target, currentPassword: password } })).status()).toBe(200);
  await expect.poll(async () => (await messages(target)).length).toBe(2);
  const tokens = (await messages(target)).map(mail => new URLSearchParams(new URL(mail.text.match(/http:\/\/localhost:3150\/\S+/)![0]).hash.slice(1)).get('token')!);
  const context = await api();
  const results = await Promise.all(tokens.map(token => context.post('/api/auth/confirm-email-change', { data: { token } })));
  expect(results.map(value => value.status()).sort()).toEqual([200, 400]);
  expect(await db.user.count({ where: { email: target } })).toBe(1);
  const users = await db.user.findMany({ where: { id: { in: [first.id, second.id] } } });
  expect(users.map(value => value.sessionVersion).sort()).toEqual([0, 1]);
  const loser = users.find(value => value.email !== target)!;
  expect(loser.email).toBe(loser.id === first.id ? first.email : second.email);
  expect(await db.accountActionToken.count({ where: { userId: loser.id, consumedAt: null } })).toBe(1);
});

test('profile saves cannot bypass proof for either role', async () => {
  for (const role of ['GROWER', 'DISPENSARY'] as const) {
    const user = await account(true, role); const url = `/api/${role.toLowerCase()}/settings`;
    const body = { businessName: 'Must remain unchanged', email: `${prefix}-bypass-${role}@example.test`, licenseNumber: prefix, licenseExpiry: '2030-12-31', licenseState: 'VT' };
    expect((await user.api.put(url, { data: body })).status()).toBe(400);
    const current = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: { grower: true, dispensary: true } });
    expect(current.email).toBe(user.email); expect(current.sessionVersion).toBe(0);
    expect((current.grower || current.dispensary)!.businessName).toBe(prefix);
  }
});

test('confirmation endpoints reject cross-origin, oversized, malformed and weak-password requests', async () => {
  const user = await account(); const context = await api(); const proof = await requestLink(user.email, 'RESET_PASSWORD');
  expect((await context.post('/api/auth/reset-password', { data: { token: proof.token, password: newPassword }, headers: { Origin: 'https://attacker.example' } })).status()).toBe(400);
  expect((await context.post('/api/auth/reset-password', { data: { token: proof.token, password: 'é'.repeat(40) } })).status()).toBe(400);
  expect((await context.post('/api/auth/reset-password', { data: { token: proof.token, password: 'short' } })).status()).toBe(400);
  expect((await context.post('/api/auth/reset-password', { data: { token: proof.token, password: newPassword, extra: 'x'.repeat(9000) } })).status()).toBe(400);
  expect((await context.post('/api/auth/reset-password', { data: '{', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400);
  expect((await context.get('/api/auth/reset-password')).status()).toBe(405);
  expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).sessionVersion).toBe(0);
  expect((await db.accountActionToken.findUniqueOrThrow({ where: { tokenHash: hash(proof.token) } })).consumedAt).toBeNull();
});

test('request and token limits preserve generic responses and store only opaque counters', async () => {
  const user = await account(); const context = await api();
  const replies=[];
  for(let i=0;i<5;i++) replies.push(await context.post('/api/auth/forgot-password', { data: { email: user.email } }));
  expect(replies.every(value=>value.status()===200)).toBe(true);
  const bodies=await Promise.all(replies.map(value=>value.json())); expect(bodies.every(value=>JSON.stringify(value)===JSON.stringify(bodies[0]))).toBe(true);
  await expect.poll(async()=>await db.accountActionToken.count({where:{userId:user.id,purpose:'RESET_PASSWORD'}})).toBe(4);
  await expect.poll(async()=>(await messages(user.email)).length).toBe(4);
  const proof=await requestLink((await account(false)).email,'VERIFY_EMAIL');
  const confirmation=await api();
  const failed=[];
  for(let i=0;i<9;i++)failed.push((await confirmation.post('/api/auth/verification/confirm',{data:{token:proof.token,password:'wrong'}})).status());
  expect(failed.slice(0,8)).toEqual(Array(8).fill(400));expect(failed[8]).toBe(429);
  const counters=await db.authRateLimit.findMany({select:{key:true}});
  expect(counters.every(value=>/^[a-f0-9]{64}$/.test(value.key))).toBe(true);
});

test('mail adapter fails closed outside isolated development and failures log no secrets', async () => {
  const environment=process.env as Record<string,string|undefined>;
  const saved={NODE_ENV:environment.NODE_ENV,VERCEL:environment.VERCEL,DATABASE_URL:environment.DATABASE_URL,NEXTAUTH_URL:environment.NEXTAUTH_URL};
  try {
    expect(accountMailConfigured()).toBe(true);expect(accountOrigin()).toBe(baseURL);
    environment.NODE_ENV='production';expect(accountMailConfigured()).toBe(false);environment.NODE_ENV=saved.NODE_ENV;
    environment.VERCEL='1';expect(accountMailConfigured()).toBe(false);delete environment.VERCEL;
    environment.DATABASE_URL='postgresql://user:unused@remote.example/phenofarm_auth_test';expect(accountMailConfigured()).toBe(false);environment.DATABASE_URL=saved.DATABASE_URL;
    environment.NEXTAUTH_URL='http://untrusted.example';expect(accountMailConfigured()).toBe(false);
  } finally { for(const [key,value] of Object.entries(saved)) {if(value===undefined) delete environment[key];else environment[key]=value;} }
  const user=await account();const originalFetch=global.fetch;const originalError=console.error;const logged:unknown[][]=[];
  try {
    global.fetch=async()=>new Response('provider response may contain secrets',{status:500});console.error=(...values)=>{logged.push(values);};
    await requestAccountLink(user.email,AccountActionPurpose.RESET_PASSWORD);
  } finally {global.fetch=originalFetch;console.error=originalError;}
  expect(logged).toEqual([['[account-mail]',{code:'DELIVERY_FAILED',purpose:'RESET_PASSWORD'}]]);
  expect(JSON.stringify(logged)).not.toContain(user.email);
  expect(await db.accountActionToken.count({where:{userId:user.id}})).toBe(0);
});

for(const width of [360,1440]) test(`signup, verification and recovery work in the ${width}px UI`,async({page})=>{
  const email=`${prefix}-ui-${width}@example.test`;
  await page.setViewportSize({width,height:900});await page.setExtraHTTPHeaders({'x-forwarded-for':`198.19.0.${width===360?1:2}`});
  await page.goto('/auth/sign_up');
  await page.locator('#firstName').fill('Mail');await page.locator('#lastName').fill('Owner');await page.locator('#businessName').fill('Recovery UI');
  await page.locator('#email').fill(email);await page.locator('#password').fill(password);await page.locator('#confirmPassword').fill(password);
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page).toHaveURL(/\/auth\/verify-email\?sent=1/);
  const proof=await delivered(email,'Verify your email');
  await page.goto(proof.url);await expect(page.getByRole('heading',{name:'Verify your email',exact:true})).toBeVisible();
  await expect(page.locator('#account-password')).toHaveAttribute('autocomplete','current-password');
  await page.locator('#account-password').fill(password);
  const evidence=process.env.AUTH_EVIDENCE_DIR || '/tmp/phenofarm-auth/recovery-evidence';mkdirSync(evidence,{recursive:true});
  await page.screenshot({path:`${evidence}/verify-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Verify email',exact:true}).click();await expect(page.getByRole('status')).toContainText('Your email is verified');
  await page.getByRole('link',{name:'Back to sign in',exact:true}).click();await page.locator('#email').fill(email);await page.locator('#password').fill(password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/grower\/dashboard/);
  await page.goto('/grower/settings');await expect(page.locator('#profile-email')).toHaveAttribute('readonly','');
  await page.getByRole('link',{name:'Change email',exact:true}).click();await expect(page.getByRole('heading',{name:'Change your email'})).toBeVisible();
  const changedEmail=email.replace('@','-changed@');
  await page.locator('#account-email').fill(changedEmail);await page.locator('#account-password').fill(password);
  await page.screenshot({path:`${evidence}/change-email-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Send confirmation link',exact:true}).click();await expect(page.getByRole('status')).toContainText('Your login email stays the same');
  const change=await delivered(changedEmail,'Confirm your new email');await page.goto(change.url);
  await page.screenshot({path:`${evidence}/confirm-email-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Confirm new email',exact:true}).click();await expect(page.getByRole('status')).toContainText('Your login email has changed');
  await page.getByRole('link',{name:'Back to sign in',exact:true}).click();await page.locator('#email').fill(changedEmail);await page.locator('#password').fill(password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/grower\/dashboard/);
  await page.goto('/auth/forgot-password');await page.locator('#account-email').fill(changedEmail);
  await page.screenshot({path:`${evidence}/request-reset-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Send reset link',exact:true}).click();await expect(page.getByRole('status')).toContainText('If this address is eligible');
  const reset=await delivered(changedEmail,'Reset your password');await page.goto(reset.url);
  await page.locator('#account-password').fill(newPassword);await page.locator('#confirm-password').fill(newPassword);
  await page.screenshot({path:`${evidence}/reset-${width}.png`,fullPage:true});
  const geometry=await page.locator('input').evaluateAll(elements=>elements.map(element=>({font:parseFloat(getComputedStyle(element).fontSize),height:element.getBoundingClientRect().height})));
  expect(geometry.every(value=>value.font>=16&&value.height>=40)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Reset password',exact:true}).click();await expect(page.getByRole('status')).toContainText('All previous sessions are signed out');
  await page.getByRole('link',{name:'Back to sign in',exact:true}).click();await page.locator('#email').fill(changedEmail);await page.locator('#password').fill(newPassword);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/grower\/dashboard/);
  await page.goto(reset.url);await page.locator('#account-password').fill(newPassword);await page.locator('#confirm-password').fill(newPassword);
  await page.getByRole('button',{name:'Reset password',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toContainText('invalid or has expired');
  expect(new URL(page.url()).hash).toBe('');
  await page.screenshot({path:`${evidence}/used-link-${width}.png`,fullPage:true});
  await page.getByRole('link',{name:'Request a new link',exact:true}).click();await expect(page).toHaveURL(/\/auth\/forgot-password/);
});
