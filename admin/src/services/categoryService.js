import { api, withFallback } from '../api/client';
import { mapCategory, toCategoryPayload, unwrap } from '../api/adapters';
import { categories, getCategories, nextId, syncCategoryItemCounts } from '../mock/data';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function mockGetAll() {
  return [...getCategories()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function mockCreate(payload) {
  const list = getCategories();
  const maxSort = list.reduce((max, c) => Math.max(max, c.sortOrder), 0);
  const category = {
    id: nextId('cat'),
    name: payload.name,
    description: payload.description ?? '',
    image: payload.image ?? '',
    heroImage: payload.heroImage ?? payload.image ?? '',
    heroTitle: payload.heroTitle ?? payload.name,
    showInHero: Boolean(payload.showInHero),
    sortOrder: payload.sortOrder ?? maxSort + 1,
    active: true,
    itemCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.push(category);
  return category;
}

function mockUpdate(id, payload) {
  const list = getCategories();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Category not found');
  list[index] = { ...list[index], ...payload, id: list[index].id, updatedAt: new Date().toISOString() };
  syncCategoryItemCounts();
  return list[index];
}

function mockRemove(id) {
  return mockUpdate(id, { active: false });
}

export async function getAll() {
  await delay();
  return withFallback(
    async () => (unwrap(await api.get('/delivery/menu/categories')) || []).map(mapCategory),
    () => mockGetAll(),
  );
}

export async function getById(id) {
  const list = await getAll();
  const category = list.find((c) => c.id === id);
  if (!category) throw new Error('Category not found');
  return category;
}

export async function create(payload) {
  await delay();
  return withFallback(
    async () => mapCategory(unwrap(await api.post('/delivery/menu/categories', toCategoryPayload(payload)))),
    () => mockCreate(payload),
  );
}

export async function update(id, payload) {
  await delay();
  return withFallback(
    async () =>
      mapCategory(unwrap(await api.patch(`/delivery/menu/categories/${id}`, toCategoryPayload(payload)))),
    () => mockUpdate(id, payload),
  );
}

export async function remove(id) {
  await delay();
  return withFallback(
    async () => {
      await api.patch(`/delivery/menu/categories/${id}`, { is_active: false });
      return { id, deleted: true };
    },
    () => mockRemove(id),
  );
}

export async function reorder(orderedIds) {
  await delay();
  return withFallback(
    async () =>
      Promise.all(
        orderedIds.map((catId, index) =>
          api
            .patch(`/delivery/menu/categories/${catId}`, { display_order: index + 1 })
            .then((res) => mapCategory(unwrap(res))),
        ),
      ),
    () => {
      orderedIds.forEach((catId, index) => {
        const cat = getCategories().find((c) => c.id === catId);
        if (cat) cat.sortOrder = index + 1;
      });
      return mockGetAll().filter((c) => c.active);
    },
  );
}

export { categories };
