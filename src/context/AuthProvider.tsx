import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, TOKEN_KEY } from '../services/api';
import type { User } from '../types/user';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));

  // Restore the session on page load
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    api
      .get<User>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY)) // expired or invalid token
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    try {
      const res = await api.get<User>('/auth/me');
      setUser(res.data);
      return res.data;
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      throw err;
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
