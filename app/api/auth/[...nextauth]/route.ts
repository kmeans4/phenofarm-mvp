import { nextAuthHandler } from '@/lib/auth';

// Single source of truth for the NextAuth configuration lives in lib/auth.ts.
export { nextAuthHandler as GET, nextAuthHandler as POST };
