import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { NextAuthOptions } from 'next-auth';
import { consumeAuthLimit, requestIp } from '@/lib/auth-rate-limit';
import { logApiError } from '@/lib/api-response';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not configured');
}

const DUMMY_PASSWORD_HASH = '$2b$10$U0g.4Ks.6n2Yg3/5daY1POGaiLHauQVEkj8m9pCsysqR84x7tLs7i';

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const email = credentials.email.trim().toLowerCase();
          if (email.length > 254 || Buffer.byteLength(credentials.password, 'utf8') > 72) return null;
          const limits = await Promise.all([
            consumeAuthLimit('login-ip', requestIp(request.headers), 60, 15 * 60),
            consumeAuthLimit('login-email', email, 12, 15 * 60),
          ]);
          if (limits.some((allowed) => !allowed)) return null;
          const user = await db.user.findUnique({ where: { email } });

          const isValidPassword = await bcrypt.compare(credentials.password, user?.passwordHash || DUMMY_PASSWORD_HASH);

          if (!user?.passwordHash || !isValidPassword) {
            return null;
          }
          if (!user.emailVerifiedAt) throw new Error('EmailNotVerified');

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            growerId: user.growerId || undefined,
            dispensaryId: user.dispensaryId || undefined,
            sessionVersion: user.sessionVersion,
          };
        } catch (error) {
          if (error instanceof Error && error.message === 'EmailNotVerified') throw error;
          logApiError('auth.credentials.authorize', error, { route: '/api/auth/session' });
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/sign_in',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.growerId = user.growerId;
        token.dispensaryId = user.dispensaryId;
        token.sessionVersion = user.sessionVersion;
      }
      // Every session read checks revocation and mailbox proof. A signed JWT alone is not authorization.
      {
        const current = token.id ? await db.user.findUnique({
          where: { id: token.id },
          select: { id: true, email: true, role: true, emailVerifiedAt: true, sessionVersion: true, grower: { select: { id: true } }, dispensary: { select: { id: true } } },
        }) : null;
        // Throwing makes NextAuth clear the cookie and return an unauthenticated session.
        // Tokens issued before this rollout have no version and are deliberately rejected.
        if (!current?.emailVerifiedAt || !Number.isInteger(token.sessionVersion) || token.sessionVersion !== current.sessionVersion) {
          throw new Error('Session is no longer valid');
        }
        token.id = current?.id || '';
        if (current) {
          token.email = current.email;
          token.role = current.role;
          token.growerId = current.grower?.id;
          token.dispensaryId = current.dispensary?.id;
        } else {
          token.growerId = undefined;
          token.dispensaryId = undefined;
        }
        token.refreshedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
        session.user.email = token.email;
        session.user.growerId = token.growerId;
        session.user.dispensaryId = token.dispensaryId;
        session.user.sessionVersion = token.sessionVersion;
      }
      return session;
    },
  },
  logger: {
    error(code) {
      logApiError('nextauth.error', new Error(code), { route: '/api/auth/session' });
    },
    warn(code) {
      console.warn('[nextauth-warn]', {
        code,
        route: '/api/auth/session',
      });
    },
    debug(code) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[nextauth-debug]', {
          code,
          route: '/api/auth/session',
        });
      }
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const nextAuthHandler = NextAuth(authOptions);
