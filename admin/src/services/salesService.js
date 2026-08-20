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

export async function getCustomers(params = {}) {
  return unwrap(await api.get('/sales/customers', { params })) || [];
}

export async function getDailyClosing(params = {}) {
  return unwrap(await api.get('/sales/daily-closing', { params })) || null;
}

export async function getCredit(params = {}) {
  return unwrap(await api.get('/sales/credit', { params })) || {
    totalOutstanding: 0,
    openTabs: 0,
    creditOrders: 0,
    rows: [],
  };
}

export async function getProfit(params = {}) {
  return unwrap(await api.get('/sales/profit', { params })) || {
    totals: { revenue: 0, cogs: 0, profit: 0, margin: 0 },
    rows: [],
  };
}

export async function getPayables(params = {}) {
  return unwrap(await api.get('/sales/payables', { params })) || {
    totalOpen: 0,
    count: 0,
    rows: [],
  };
}

export async function createPayable(payload) {
  return unwrap(await api.post('/sales/payables', payload));
}

export async function settlePayable(id, payload = {}) {
  return unwrap(await api.post(`/sales/payables/${id}/settle`, payload));
}
