'use client';

import { createContext, ReactNode } from 'react';
import { ExtendedUser } from '@/types';

interface AuthContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isGrower: boolean;
  isDispensary: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  isAdmin: false,
  isGrower: false,
  isDispensary: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // This will be implemented with actual auth logic
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}
