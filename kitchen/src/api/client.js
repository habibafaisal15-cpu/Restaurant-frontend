import axios from 'axios';
import { clearAuth, getToken } from '../utils/storage';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    if (error.response?.status === 401) clearAuth();
    return Promise.reject(new Error(message));
  },
);

export function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}
