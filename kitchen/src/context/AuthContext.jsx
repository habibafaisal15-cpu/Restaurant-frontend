import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, unwrap } from '../api/client';
import { clearAuth, getToken, getUser, setAuth } from '../utils/storage';
import { connectKitchenSocket, disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getUser());

  const loginKitchen = useCallback(async (email, password) => {
    const data = unwrap(await api.post('/auth/login', { email, password }));
    const nextUser = {
      id: data.admin?.id,
      name: data.admin?.full_name || data.admin?.name || email,
      email: data.admin?.email || email,
      role: data.admin?.role || 'kitchen',
    };
    setAuth(data.token, nextUser);
    setToken(data.token);
    setUser(nextUser);
    connectKitchenSocket();
    return nextUser;
  }, []);

  const loginRider = useCallback(async (phone) => {
    const data = unwrap(await api.post('/auth/rider-login', { phone }));
    const nextUser = {
      id: data.rider?.id,
      name: data.rider?.name,
      phone: data.rider?.phone || phone,
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
      isAuthenticated: Boolean(token),
      isRider: user?.role === 'rider',
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
