import { api, withFallback } from '../api/client';
import { unwrap } from '../api/adapters';
import { getRiders, nextId, riders } from '../mock/data';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function mapRider(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    vehicleNumber: row.vehicleNumber || '',
    status: row.status || 'available',
    active: row.active !== false,
    deliveredCount: row.deliveredCount ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mockGetAll(filters = {}) {
  let list = [...getRiders()];
  if (filters.active != null) list = list.filter((r) => r.active === filters.active);
  if (filters.status) list = list.filter((r) => r.status === filters.status);
  return list;
}

export async function getAll(filters = {}) {
  await delay();
  return withFallback(
    async () => (unwrap(await api.get('/delivery/riders', { params: filters })) || []).map(mapRider),
    () => mockGetAll(filters),
  );
}

export async function getById(id) {
  const list = await getAll();
  const rider = list.find((r) => r.id === id);
  if (!rider) throw new Error('Rider not found');
  return rider;
}

export async function create(payload) {
  await delay();
  return withFallback(
    async () => mapRider(unwrap(await api.post('/delivery/riders', payload))),
    () => {
      const rider = {
        id: nextId('rider'),
        ...payload,
        status: 'available',
        active: true,
        deliveredCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      getRiders().push(rider);
      return rider;
    },
  );
}

export async function update(id, payload) {
  await delay();
  return withFallback(
    async () => mapRider(unwrap(await api.patch(`/delivery/riders/${id}`, payload))),
    () => {
      const list = getRiders();
      const index = list.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('Rider not found');
      list[index] = { ...list[index], ...payload, id, updatedAt: new Date().toISOString() };
      return list[index];
    },
  );
}

export async function toggleActive(id) {
  await delay();
  return withFallback(
    async () => mapRider(unwrap(await api.patch(`/delivery/riders/${id}/toggle-active`))),
    async () => {
      const rider = await getById(id);
      return update(id, { active: !rider.active });
    },
  );
}

export { riders };
