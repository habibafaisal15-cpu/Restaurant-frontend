import { api } from '../api/client';
import { mapDashboardSummary, unwrap } from '../api/adapters';

export async function getSummary(params = {}) {
  return mapDashboardSummary(unwrap(await api.get('/sales/summary', { params })));
}

export async function getByItem(params = {}) {
  return unwrap(await api.get('/sales/by-item', { params })) || [];
}

export async function getByCategory(params = {}) {
  return unwrap(await api.get('/sales/by-category', { params })) || [];
}

export async function getByDay(params = {}) {
  return unwrap(await api.get('/sales/by-day', { params })) || [];
}
