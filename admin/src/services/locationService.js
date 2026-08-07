import { api, withFallback } from '../api/client';
import { unwrap } from '../api/adapters';
import { deliveryLocations, getDeliveryLocations, nextId } from '../mock/data';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_RADIUS_KM = 10;

export function mapLocation(row = {}) {
  return {
    id: row.id,
    name: row.name || '',
    address: row.address || row.formatted_address || '',
    latitude: Number(row.latitude ?? row.lat ?? 0),
    longitude: Number(row.longitude ?? row.lng ?? row.lon ?? 0),
    radiusKm: Number(row.radiusKm ?? row.radius_km ?? DEFAULT_RADIUS_KM) || DEFAULT_RADIUS_KM,
    active: row.active !== false && row.is_active !== false,
    notes: row.notes || '',
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
  };
}

export function toBackendPayload(payload) {
  return {
    name: payload.name,
    address: payload.address,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    radius_km: Number(payload.radiusKm ?? DEFAULT_RADIUS_KM),
    is_active: payload.active !== false,
    notes: payload.notes || '',
  };
}

function mockGetAll(filters = {}) {
  let list = getDeliveryLocations().map(mapLocation);
  if (filters.active != null) {
    list = list.filter((l) => l.active === filters.active);
  }
  if (filters.search) {
    const q = String(filters.search).toLowerCase();
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q),
    );
  }
  return list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export async function getAll(filters = {}) {
  await delay();
  return withFallback(
    async () =>
      (unwrap(await api.get('/delivery/locations', { params: filters })) || []).map(mapLocation),
    () => mockGetAll(filters),
  );
}

export async function getById(id) {
  const list = await getAll();
  const location = list.find((l) => l.id === id);
  if (!location) throw new Error('Location not found');
  return location;
}

export async function create(payload) {
  await delay();
  return withFallback(
    async () => mapLocation(unwrap(await api.post('/delivery/locations', toBackendPayload(payload)))),
    () => {
      const location = {
        id: nextId('loc'),
        name: payload.name.trim(),
        address: payload.address.trim(),
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        radiusKm: Number(payload.radiusKm) || DEFAULT_RADIUS_KM,
        active: payload.active !== false,
        notes: payload.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      getDeliveryLocations().push(location);
      return mapLocation(location);
    },
  );
}

export async function update(id, payload) {
  await delay();
  return withFallback(
    async () =>
      mapLocation(unwrap(await api.patch(`/delivery/locations/${id}`, toBackendPayload(payload)))),
    () => {
      const list = getDeliveryLocations();
      const index = list.findIndex((l) => l.id === id);
      if (index === -1) throw new Error('Location not found');
      list[index] = {
        ...list[index],
        name: payload.name.trim(),
        address: payload.address.trim(),
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        radiusKm: Number(payload.radiusKm) || DEFAULT_RADIUS_KM,
        active: payload.active !== false,
        notes: payload.notes?.trim() || '',
        updatedAt: new Date().toISOString(),
      };
      return mapLocation(list[index]);
    },
  );
}

export async function toggleActive(id) {
  await delay();
  return withFallback(
    async () => mapLocation(unwrap(await api.patch(`/delivery/locations/${id}/toggle-active`))),
    () => {
      const list = getDeliveryLocations();
      const index = list.findIndex((l) => l.id === id);
      if (index === -1) throw new Error('Location not found');
      list[index] = {
        ...list[index],
        active: !list[index].active,
        updatedAt: new Date().toISOString(),
      };
      return mapLocation(list[index]);
    },
  );
}

export async function remove(id) {
  await delay();
  return withFallback(
    async () => {
      await api.delete(`/delivery/locations/${id}`);
      return { id };
    },
    () => {
      const index = deliveryLocations.findIndex((l) => l.id === id);
      if (index === -1) throw new Error('Location not found');
      deliveryLocations.splice(index, 1);
      return { id };
    },
  );
}

export { DEFAULT_RADIUS_KM };
