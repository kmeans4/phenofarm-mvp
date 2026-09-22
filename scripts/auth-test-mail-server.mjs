// Local-only, authenticated, in-memory mail sink. Never forwards mail or prints message contents.
import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const loopback = value => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(value);
const target = new URL(process.env.AUTH_MAIL_TEST_URL || 'http://127.0.0.1:3151/messages');
const database = new URL(process.env.DATABASE_URL || '');
const origin = new URL(process.env.NEXTAUTH_URL || '');
const key = process.env.AUTH_MAIL_TEST_KEY || '';
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.AUTH_MAIL_PROVIDER !== 'local-test'
  || !loopback(target.hostname) || !loopback(database.hostname) || !loopback(origin.hostname)
  || !/^\/phenofarm_auth_/.test(database.pathname) || key.length < 32 || target.protocol !== 'http:') {
  throw new Error('This mail sink requires an isolated local auth test environment');
}
let messages = [];
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  const supplied = Buffer.from(request.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${key}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    response.writeHead(401).end('{}'); return;
  }
  const url = new URL(request.url || '/', target.origin);
  if (url.pathname !== '/messages') { response.writeHead(404).end('{}'); return; }
  const to = url.searchParams.get('to');
  if (request.method === 'GET') {
    response.end(JSON.stringify(messages.filter(value => !to || value.to === to))); return;
  }
  if (request.method === 'DELETE' && to) {
    messages = messages.filter(value => value.to !== to); response.end('{}'); return;
  }
  if (request.method !== 'POST') { response.writeHead(405).end('{}'); return; }
  try {
    let body = '';
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 32768) { response.writeHead(413).end('{}'); return; }
    }
    const mail = JSON.parse(body);
    if (!mail || typeof mail.to !== 'string' || typeof mail.subject !== 'string' || typeof mail.text !== 'string') throw new Error('Invalid mail');
    const id = randomUUID();
    messages.push({ id, to: mail.to, subject: mail.subject, text: mail.text });
    if (messages.length > 1000) messages.shift();
    response.end(JSON.stringify({ id }));
  } catch { response.writeHead(400).end('{}'); }
});
server.listen(Number(target.port || 3151), '127.0.0.1', () => console.log('Isolated account mail sink ready; message contents stay in memory.'));
