import { UserRole } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    growerId?: string;
    dispensaryId?: string;
  }

  interface Session {
    user: User & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    growerId?: string;
    dispensaryId?: string;
  }
}
