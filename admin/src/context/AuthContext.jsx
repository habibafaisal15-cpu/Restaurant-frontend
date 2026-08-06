import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuth, getToken, getUser, setToken, setUser } from '../utils/storage';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const storedToken = getToken();
      const storedUser = getUser();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setTokenState(storedToken);
      if (storedUser) setUserState(storedUser);

      try {
        const current = await authService.getCurrentUser();
        if (current) {
          setUserState(current);
          setUser(current);
        }
      } catch {
        clearAuth();
        setTokenState(null);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setTokenState(data.token);
    setUserState(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    setTokenState(null);
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
