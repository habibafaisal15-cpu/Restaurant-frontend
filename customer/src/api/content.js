import apiClient from './client';
import { mapDeal, mapPopularItem, resolveMediaUrl } from './adapters';

let heroCache = null;
let heroInflight = null;
let heroCachedAt = 0;
const HERO_TTL_MS = 60_000;

export async function getStorefrontHero({ refresh = false } = {}) {
  const now = Date.now();
  if (!refresh && heroCache && now - heroCachedAt < HERO_TTL_MS) {
    return heroCache;
  }
  if (!refresh && heroInflight) {
    return heroInflight;
  }

  heroInflight = apiClient
    .get('/storefront/hero')
    .then((response) => {
      const payload = response?.data || response;
      heroCache = payload;
      heroCachedAt = Date.now();
      return payload;
    })
    .finally(() => {
      heroInflight = null;
    });

  return heroInflight;
}

export function clearHeroCache() {
  heroCache = null;
  heroCachedAt = 0;
  heroInflight = null;
}

export function mapHeroSideCards(cards = []) {
  return cards
    .filter((card) => card?.image)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((card) => ({
      id: card.id,
      label: card.title || card.label || '',
      to: card.link || card.to || '/',
      image: resolveMediaUrl(card.image),
    }));
}

export function mapHeroSlides(slides = []) {
  return slides
    .filter((slide) => slide?.image && slide.active !== false)
    .map((slide) => ({
      id: slide.id,
      categoryId: slide.categoryId || null,
      name: slide.title || '',
      title: slide.title || '',
      image: resolveMediaUrl(slide.image),
    }));
}

export async function getStorefrontHeroDeals(options = {}) {
  const payload = await getStorefrontHero(options);
  const deals =
    payload?.top_selling_deals ||
    payload?.topSellingDeals ||
    payload?.deals ||
    payload?.topDeals ||
    [];
  return { data: deals.map(mapDeal) };
}

export async function getStorefrontPopular(options = {}) {
  const payload = await getStorefrontHero(options);

  return {
    bestSellers: (payload?.best_sellers || payload?.bestSellers || []).map(
      mapPopularItem,
    ),
    topDeals: (
      payload?.top_selling_deals ||
      payload?.topSellingDeals ||
      payload?.deals ||
      []
    ).map(mapDeal),
  };
}
