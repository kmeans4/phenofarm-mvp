import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { NextAuthOptions } from 'next-auth';
import { logApiError } from '@/lib/api-response';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not configured');
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            growerId: user.growerId || undefined,
            dispensaryId: user.dispensaryId || undefined,
          };
        } catch (error) {
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
