import { api, withFallback } from '../api/client';
import { mapMenuItem, toMenuItemPayload, unwrap } from '../api/adapters';
import { getMenuItems, menuItems, nextId, syncCategoryItemCounts } from '../mock/data';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

function mockGetAll(filters = {}) {
  let list = getMenuItems().filter((item) => item.active);
  if (filters.categoryId) list = list.filter((item) => item.categoryId === filters.categoryId);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  }
  return list;
}

function mockCreate(payload) {
  const item = {
    id: nextId('item'),
    categoryId: payload.categoryId,
    name: payload.name,
    description: payload.description ?? '',
    price: Number(payload.price) || 0,
    discountPrice: payload.discountPrice != null ? Number(payload.discountPrice) : undefined,
    image: payload.image ?? '',
    available: payload.available ?? true,
    active: true,
    tags: payload.tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  getMenuItems().push(item);
  syncCategoryItemCounts();
  return item;
}

function mockUpdate(id, payload) {
  const list = getMenuItems();
  const index = list.findIndex((m) => m.id === id);
  if (index === -1) throw new Error('Menu item not found');
  list[index] = { ...list[index], ...payload, id: list[index].id, updatedAt: new Date().toISOString() };
  syncCategoryItemCounts();
  return list[index];
}

export async function getAll(filters = {}) {
  await delay();
  return withFallback(
    async () => {
      const response = await api.get('/delivery/menu/items', {
        params: filters.categoryId ? { category_id: filters.categoryId } : undefined,
      });
      let list = (unwrap(response) || []).map(mapMenuItem);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q),
        );
      }
      return list;
    },
    () => mockGetAll(filters),
  );
}

export async function getByCategory(categoryId) {
  return getAll({ categoryId });
}

export async function getById(id) {
  await delay();
  return withFallback(
    async () => mapMenuItem(unwrap(await api.get(`/delivery/menu/items/${id}`))),
    () => {
      const item = getMenuItems().find((m) => m.id === id);
      if (!item) throw new Error('Menu item not found');
      return item;
    },
  );
}

export async function create(payload) {
  await delay();
  return withFallback(
    async () => mapMenuItem(unwrap(await api.post('/delivery/menu/items', toMenuItemPayload(payload)))),
    () => mockCreate(payload),
  );
}

export async function update(id, payload) {
  await delay();
  return withFallback(
    async () => mapMenuItem(unwrap(await api.patch(`/delivery/menu/items/${id}`, toMenuItemPayload(payload)))),
    () => mockUpdate(id, payload),
  );
}

export async function remove(id) {
  await delay();
  return withFallback(
    async () => {
      await api.delete(`/delivery/menu/items/${id}`);
      return { id, deleted: true };
    },
    () => mockUpdate(id, { active: false, available: false }),
  );
}

export async function bulkUpdateAvailability(ids, available) {
  await delay();
  return withFallback(
    async () =>
      Promise.all(
        ids.map((id) =>
          api
            .patch(`/delivery/menu/items/${id}/availability`, {
              in_stock: available,
              available_for_delivery: available,
            })
            .then((res) => mapMenuItem(unwrap(res))),
        ),
      ),
    () => ids.map((id) => mockUpdate(id, { available })),
  );
}

export async function bulkMoveCategory(ids, categoryId) {
  await delay();
  return withFallback(
    async () =>
      Promise.all(
        ids.map((id) =>
          api
            .patch(`/delivery/menu/items/${id}`, { category_id: categoryId })
            .then((res) => mapMenuItem(unwrap(res))),
        ),
      ),
    () => ids.map((id) => mockUpdate(id, { categoryId })),
  );
}

export { menuItems };
