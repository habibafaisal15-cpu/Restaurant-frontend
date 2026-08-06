import { api, withFallback } from '../api/client';
import { mapAdminUser, mapAuthResponse, unwrap } from '../api/adapters';
import { clearAuth, getUser, setToken, setUser } from '../utils/storage';

const MOCK_USER = {
  id: 'usr-001',
  name: 'Restaurant Admin',
  email: 'admin@restaurant.com',
  role: 'admin',
};

function mockLogin(email, password) {
  const normalized = email.trim().toLowerCase();
  if (normalized !== 'admin@restaurant.com' || password !== 'Admin@123') {
    throw new Error('Invalid email or password');
  }
  const token = `yk-mock-token-${Date.now()}`;
  setToken(token);
  setUser(MOCK_USER);
  return { token, user: MOCK_USER };
}

function mockLogout() {
  clearAuth();
  return { success: true };
}

function mockGetCurrentUser() {
  const user = getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export async function login(email, password) {
  const data = await withFallback(
    async () => {
      const response = await api.post('/auth/login', { email, password });
      const mapped = mapAuthResponse(unwrap(response));
      setToken(mapped.token);
      setUser(mapped.user);
      return mapped;
    },
    () => mockLogin(email, password),
  );

  return data;
}

export async function logout() {
  await withFallback(
    async () => unwrap(await api.post('/auth/logout')),
    () => mockLogout(),
  );
  clearAuth();
}

export async function getCurrentUser() {
  return withFallback(
    async () => {
      const response = await api.get('/auth/me');
      const admin = unwrap(response);
      const user = mapAdminUser(admin);
      setUser(user);
      return user;
    },
    () => mockGetCurrentUser(),
  );
}
