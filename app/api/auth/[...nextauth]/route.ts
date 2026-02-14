import NextAuth, { DefaultSession, Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not configured');
}

declare module 'next-auth' {
  interface User {
    role?: string;
    growerId?: string;
  }
  
  interface Session {
    user?: User & DefaultSession['user'];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: any = {
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Auth attempt:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          console.log('User found:', user ? 'YES' : 'NO');
          console.log('Has passwordHash:', user?.passwordHash ? 'YES' : 'NO');
          
          if (!user) {
            return null;
          }

          if (!user.passwordHash) {
            console.log('No password hash stored');
            return null;
          }
          
          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log('Password valid:', isValidPassword);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            growerId: user.growerId || undefined,
          };
        } catch (error) {
          console.error('Auth error:', error);
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
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.growerId = user.growerId;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: Record<string, unknown> }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.growerId = token.growerId as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
