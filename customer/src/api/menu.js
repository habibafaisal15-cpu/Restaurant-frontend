import apiClient from './client';
import {
  mapCategory,
  mapDeal,
  mapMenuItem,
  mapPopularItem,
  mapZoneToBranch,
} from './adapters';

const menuCache = new Map();

async function fetchStorefrontMenu(zoneId) {
  if (!zoneId) return { categories: [], deals: [] };

  const response = await apiClient.get('/storefront/menu', {
    params: { zone_id: zoneId },
  });

  const menu = response?.data || response || {};
  menuCache.set(zoneId, menu);
  return menu;
}

export function getCachedMenu(zoneId) {
  return menuCache.get(zoneId) || null;
}

export function clearMenuCache(zoneId) {
  if (zoneId) menuCache.delete(zoneId);
  else menuCache.clear();
}

export async function getCategories(zoneId) {
  const menu = await fetchStorefrontMenu(zoneId);
  const categories = (menu.categories || []).map(mapCategory);
  return { data: categories };
}

export async function getMenuItems(zoneId, categoryId) {
  const menu = menuCache.get(zoneId) || (await fetchStorefrontMenu(zoneId));
  const category = (menu.categories || []).find((entry) => entry.id === categoryId);
  const items = (category?.items || []).map(mapMenuItem);
  return { data: items };
}

export async function getFullMenu(zoneId) {
  const menu = await fetchStorefrontMenu(zoneId);
  return {
    categories: (menu.categories || []).map((category) => ({
      ...mapCategory(category),
      items: (category.items || []).map(mapMenuItem),
    })),
    deals: (menu.deals || []).map(mapDeal),
  };
}

export async function getMenuItemById(itemId, zoneId) {
  const menu = menuCache.get(zoneId) || (await fetchStorefrontMenu(zoneId));
  const item = (menu.categories || [])
    .flatMap((category) => category.items || [])
    .find((entry) => entry.id === itemId);

  return item ? { data: mapMenuItem(item) } : { data: null };
}

export async function getMenuMetrics(zoneId) {
  const menu = await fetchStorefrontMenu(zoneId);
  const allItems = (menu.categories || []).flatMap((category) =>
    (category.items || []).map(mapMenuItem)
  );
  const bestSellers = (menu.best_sellers || menu.bestSellers || []).map(
    mapPopularItem,
  );

  return {
    data: {
      totalCategories: menu.categories?.length || 0,
      totalDishes: allItems.length,
      totalItems: allItems.length,
      bestSellers,
      topSellingDeals: (menu.top_selling_deals || menu.topSellingDeals || []).map(
        mapDeal,
      ),
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function getDeals(zoneId, { refresh = false } = {}) {
  if (refresh && zoneId) clearMenuCache(zoneId);
  const menu =
    refresh || !menuCache.has(zoneId)
      ? await fetchStorefrontMenu(zoneId)
      : menuCache.get(zoneId);
  const deals =
    menu.top_selling_deals ||
    menu.topSellingDeals ||
    menu.deals ||
    [];
  return { data: deals.map(mapDeal) };
}

export { mapCategory, mapDeal, mapMenuItem, mapZoneToBranch };
