import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, unwrap } from '../api/client';
import { clearAuth, getToken, getUser, setAuth } from '../utils/storage';
import { connectKitchenSocket, disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getUser());

  const loginKitchen = useCallback(async (email, password) => {
    const data = unwrap(
      await api.post('/auth/login', { email, password, portal: 'kitchen' }),
    );
    const role = String(data.admin?.role || '').toLowerCase();
    if (role !== 'kitchen') {
      throw new Error('Only kitchen staff can sign in here');
    }
    const nextUser = {
      id: data.admin?.id,
      name: data.admin?.full_name || data.admin?.name || email,
      email: data.admin?.email || email,
      phone: data.admin?.phone || null,
      role: 'kitchen',
    };
    setAuth(data.token, nextUser);
    setToken(data.token);
    setUser(nextUser);
    connectKitchenSocket();
    return nextUser;
  }, []);

  const loginRider = useCallback(async (email, password) => {
    const data = unwrap(
      await api.post('/auth/login', { email, password, portal: 'rider' }),
    );
    const role = String(data.admin?.role || '').toLowerCase();
    if (role !== 'rider') {
      throw new Error('Only riders can sign in here');
    }
    const nextUser = {
      id: data.admin?.id,
      name: data.admin?.full_name || data.admin?.name || email,
      email: data.admin?.email || email,
      phone: data.admin?.phone || null,
      role: 'rider',
    };
    setAuth(data.token, nextUser);
    setToken(data.token);
    setUser(nextUser);
    connectKitchenSocket();
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isRider: user?.role === 'rider',
      isKitchen: user?.role === 'kitchen',
      loginKitchen,
      loginRider,
      logout,
    }),
    [token, user, loginKitchen, loginRider, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
