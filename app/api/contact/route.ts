import { NextRequest } from 'next/server';
import { accountBody, accountJson } from '@/lib/account-security-api';
import { sendAccountMail } from '@/lib/account-mail';
import { validAccountEmail } from '@/lib/account-security';
import { consumeAuthLimit, requestIp } from '@/lib/auth-rate-limit';
export async function POST(request: NextRequest) {
  const body = await accountBody(request);
  if (!body) return accountJson({ error: 'Please check your message.' }, 400);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (
    !name ||
    name.length > 200 ||
    !validAccountEmail(email) ||
    !message ||
    message.length > 5000
  )
    return accountJson(
      {
        error:
          'Enter your name, a valid email, and a message up to 5,000 characters.',
      },
      400
    );
  if (body.website) return accountJson({ success: true });
  if (
    !(await consumeAuthLimit(
      'contact-ip',
      requestIp(Object.fromEntries(request.headers)),
      5,
      3600
    )) ||
    !(await consumeAuthLimit('contact-email', email, 3, 3600))
  )
    return accountJson(
      { error: 'Too many messages. Try again in an hour.' },
      429
    );
  try {
    await sendAccountMail({
      to: 'support@phenoshop.app',
      replyTo: email,
      subject: 'PhenoShop support request',
      text: `From: ${name}\nEmail: ${email}\n\n${message}`,
    });
    return accountJson({ success: true });
  } catch {
    return accountJson(
      {
        error:
          'Your message could not be sent. Try again or email support@phenoshop.app.',
      },
      503
    );
  }
}
