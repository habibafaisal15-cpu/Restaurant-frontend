import { api, withFallback } from '../api/client';
import { mapDeal, unwrap } from '../api/adapters';
import { deals, getDeals, nextId, syncHeroTopDeals } from '../mock/data';

const delay = (ms = 140) => new Promise((r) => setTimeout(r, ms));

function mockGetAll(filters = {}) {
  let list = [...getDeals()].sort((a, b) => a.sortOrder - b.sortOrder);
  if (filters.active != null) list = list.filter((d) => d.active === filters.active);
  if (filters.showOnCustomer != null) list = list.filter((d) => d.showOnCustomer === filters.showOnCustomer);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.badge?.toLowerCase().includes(q),
    );
  }
  return list.map((d) => ({ ...d }));
}

function mockCreate(payload) {
  const list = getDeals();
  const maxSort = list.reduce((max, d) => Math.max(max, d.sortOrder || 0), 0);
  const deal = {
    id: nextId('deal'),
    ...payload,
    sortOrder: payload.sortOrder ?? maxSort + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.unshift(deal);
  syncHeroTopDeals();
  return { ...deal };
}

function mockUpdate(id, payload) {
  const list = getDeals();
  const index = list.findIndex((d) => d.id === id);
  if (index === -1) throw new Error('Deal not found');
  list[index] = { ...list[index], ...payload, id: list[index].id, updatedAt: new Date().toISOString() };
  syncHeroTopDeals();
  return { ...list[index] };
}

function mockRemove(id) {
  return mockUpdate(id, { active: false, showOnCustomer: false });
}

export async function getAll(filters = {}) {
  await delay();
  return withFallback(
    async () => (unwrap(await api.get('/admin/deals', { params: filters })) || []).map(mapDeal),
    () => mockGetAll(filters),
  );
}

export async function getById(id) {
  await delay();
  return withFallback(
    async () => mapDeal(unwrap(await api.get(`/admin/deals/${id}`))),
    () => {
      const deal = getDeals().find((d) => d.id === id);
      if (!deal) throw new Error('Deal not found');
      return { ...deal };
    },
  );
}

export async function create(payload) {
  await delay();
  return withFallback(
    async () => mapDeal(unwrap(await api.post('/admin/deals', payload))),
    () => mockCreate(payload),
  );
}

export async function update(id, payload) {
  await delay();
  return withFallback(
    async () => mapDeal(unwrap(await api.put(`/admin/deals/${id}`, payload))),
    () => mockUpdate(id, payload),
  );
}

export async function remove(id) {
  await delay();
  return withFallback(
    async () => mapDeal(unwrap(await api.delete(`/admin/deals/${id}`))),
    () => mockRemove(id),
  );
}

export async function getCustomerDeals() {
  return getAll({ active: true, showOnCustomer: true });
}

export { deals };
