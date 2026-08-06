import apiClient from './client';
import { mapDeal, resolveMediaUrl } from './adapters';

export async function getStorefrontHero() {
  const response = await apiClient.get('/storefront/hero');
  return response?.data || response;
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

export async function getStorefrontHeroDeals() {
  const response = await apiClient.get('/storefront/hero');
  const payload = response?.data || response;
  const deals = payload?.deals || payload?.topDeals || [];
  return { data: deals.map(mapDeal) };
}
