import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, setOnAuthFailure, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // Hook into the axios layer: if refresh fails, drop the user.
  useEffect(() => {
    setOnAuthFailure(() => setUser(null));
  }, []);

  // On first load, if we have a token, fetch the profile.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (tokenStore.getAccess()) {
        await refreshMe();
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (email, password, mfa_code) => {
      const { data } = await authApi.login(email, password, mfa_code);
      tokenStore.set(data);
      await refreshMe();
    },
    [refreshMe]
  );

  const loginWithTokens = useCallback(
    async (tokens) => {
      tokenStore.set(tokens);
      await refreshMe();
    },
    [refreshMe]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout(tokenStore.getRefresh());
    } catch {
      // ignore network errors on logout
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithTokens, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
