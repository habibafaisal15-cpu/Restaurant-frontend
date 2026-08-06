import apiClient from './client';

export async function getSiteSettings() {
  const response = await apiClient.get('/storefront/settings');
  return response?.data || response;
}
