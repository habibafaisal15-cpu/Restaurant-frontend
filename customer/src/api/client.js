import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    const zoneId = localStorage.getItem('selected_branch_id');
    if (zoneId) {
      config.headers['X-Zone-Id'] = zoneId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    const details = Array.isArray(data?.errors)
      ? data.errors.map((entry) => `${entry.path}: ${entry.message}`).join('; ')
      : '';
    const message =
      details || data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
