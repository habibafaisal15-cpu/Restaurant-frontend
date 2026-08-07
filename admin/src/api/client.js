import axios from 'axios';
import { clearAuth, getToken } from '../utils/storage';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set multipart boundary for FormData uploads.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Content-Type', undefined);
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Request failed';

    if (error.response?.status === 401) {
      clearAuth();
    }

    return Promise.reject(new Error(message));
  },
);

export async function withFallback(apiCall, mockFn) {
  if (useMock && mockFn) {
    return mockFn();
  }

  return apiCall();
}

export { useMock as useMockMode };
