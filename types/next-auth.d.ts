import { UserRole } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      growerId?: string;
      dispensaryId?: string;
      name?: string | null;
      sessionVersion: number;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    growerId?: string;
    dispensaryId?: string;
    sessionVersion: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    email: string;
    growerId?: string;
    dispensaryId?: string;
    sessionVersion: number;
  }
}
