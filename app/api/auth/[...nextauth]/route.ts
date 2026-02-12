import NextAuth, { DefaultSession, Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

declare module 'next-auth' {
  interface User {
    role?: string;
    growerId?: string;
  }
  
  interface Session {
    user?: User & DefaultSession['user'];
  }
}

export const authOptions = {
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

          if (!user) {
            return null;
          }

          // In production, properly hash and compare passwords
          // For now, using a simple check (replace with bcrypt.compare in production)
          const isValidPassword = credentials.password === 'password123'; // Placeholder

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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.growerId = user.growerId;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) {
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

export { handler as GET, handler as POST, signIn, signOut, auth };
