import { createContext, useContext } from 'react';
import type { User } from '../types/user';

export interface AuthContextValue {
  user: User | null;
  /** True while the stored token is being checked on first load. */
  loading: boolean;
  /** Stores the token, loads the current user and returns it. */
  signIn: (token: string) => Promise<User>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
