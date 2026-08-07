import apiClient from './client';
import {
  mapCategory,
  mapDeal,
  mapMenuItem,
  mapPopularItem,
  mapZoneToBranch,
} from './adapters';

const menuCache = new Map();
const menuInflight = new Map();

async function fetchStorefrontMenu(zoneId, { refresh = false } = {}) {
  if (!zoneId) return { categories: [], deals: [] };

  if (!refresh && menuCache.has(zoneId)) {
    return menuCache.get(zoneId);
  }

  if (!refresh && menuInflight.has(zoneId)) {
    return menuInflight.get(zoneId);
  }

  const request = apiClient
    .get('/storefront/menu', { params: { zone_id: zoneId } })
    .then((response) => {
      const menu = response?.data || response || {};
      menuCache.set(zoneId, menu);
      return menu;
    })
    .finally(() => {
      menuInflight.delete(zoneId);
    });

  menuInflight.set(zoneId, request);
  return request;
}

export function getCachedMenu(zoneId) {
  return menuCache.get(zoneId) || null;
}

export function clearMenuCache(zoneId) {
  if (zoneId) {
    menuCache.delete(zoneId);
    menuInflight.delete(zoneId);
  } else {
    menuCache.clear();
    menuInflight.clear();
  }
}

export async function getCategories(zoneId, options = {}) {
  const menu = await fetchStorefrontMenu(zoneId, options);
  const categories = (menu.categories || []).map(mapCategory);
  return { data: categories };
}

export async function getMenuItems(zoneId, categoryId) {
  const menu = await fetchStorefrontMenu(zoneId);
  const category = (menu.categories || []).find((entry) => entry.id === categoryId);
  const items = (category?.items || []).map(mapMenuItem);
  return { data: items };
}

export async function getFullMenu(zoneId, options = {}) {
  const menu = await fetchStorefrontMenu(zoneId, options);
  return {
    categories: (menu.categories || []).map((category) => ({
      ...mapCategory(category),
      items: (category.items || []).map(mapMenuItem),
    })),
    deals: (menu.deals || []).map(mapDeal),
    bestSellers: (menu.best_sellers || menu.bestSellers || []).map(mapPopularItem),
    topSellingDeals: (menu.top_selling_deals || menu.topSellingDeals || []).map(mapDeal),
  };
}

export async function getMenuItemById(itemId, zoneId) {
  const menu = await fetchStorefrontMenu(zoneId);
  const item = (menu.categories || [])
    .flatMap((category) => category.items || [])
    .find((entry) => entry.id === itemId);

  return item ? { data: mapMenuItem(item) } : { data: null };
}

export async function getMenuMetrics(zoneId, options = {}) {
  const menu = await fetchStorefrontMenu(zoneId, options);
  const allItems = (menu.categories || []).flatMap((category) =>
    (category.items || []).map(mapMenuItem)
  );
  const bestSellers = (menu.best_sellers || menu.bestSellers || []).map(
    mapPopularItem,
  );
  const marketingDeals = (menu.deals || []).map(mapDeal);
  const rankedDeals = (menu.top_selling_deals || menu.topSellingDeals || []).map(
    mapDeal,
  );

  return {
    data: {
      totalCategories: menu.categories?.length || 0,
      totalDishes: allItems.length,
      totalItems: allItems.length,
      bestSellers,
      topSellingDeals: (marketingDeals.length ? marketingDeals : rankedDeals).slice(
        0,
        3,
      ),
      deals: marketingDeals,
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function getDeals(zoneId, { refresh = false } = {}) {
  const menu = await fetchStorefrontMenu(zoneId, { refresh });
  const deals = menu.deals?.length
    ? menu.deals
    : menu.top_selling_deals || menu.topSellingDeals || [];
  return { data: deals.map(mapDeal) };
}

export { mapCategory, mapDeal, mapMenuItem, mapZoneToBranch };
