import { api, withFallback } from '../api/client';
import { mapHeroSideCard, mapHeroSlide, unwrap } from '../api/adapters';
import { getHeroContent, heroContent, nextId, syncHeroTopDeals } from '../mock/data';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
export const MAX_SLIDES = 5;
export const MAX_SIDE_CARDS = 3;

export const SIDE_PRESETS = [
  { key: 'menu', title: 'Menu', link: '/menu' },
  { key: 'topseller', title: 'Top Seller', link: '/menu?filter=bestseller' },
  { key: 'deals', title: 'Deals', link: '/deals' },
];

function mockGetContent() {
  syncHeroTopDeals();
  return { ...getHeroContent() };
}

function mockUpdateSlides(slides) {
  heroContent.slides = slides;
  heroContent.updatedAt = new Date().toISOString();
  return heroContent.slides.map((s) => ({ ...s }));
}

function mockUpdateSideCards(sideCards) {
  heroContent.sideCards = sideCards;
  heroContent.updatedAt = new Date().toISOString();
  return heroContent.sideCards.map((c) => ({ ...c }));
}

export async function getContent() {
  await delay();
  return withFallback(
    async () => {
      const data = unwrap(await api.get('/hero')) || {};
      return {
        slides: (data.slides || []).map(mapHeroSlide),
        sideCards: (data.sideCards || []).map(mapHeroSideCard),
        updatedAt: data.updatedAt,
      };
    },
    () => mockGetContent(),
  );
}

export async function updateContent(payload) {
  await delay();
  return withFallback(
    async () => unwrap(await api.put('/hero', payload)),
    () => mockGetContent(),
  );
}

export async function updateSlides(slides) {
  await delay();
  return withFallback(
    async () => (unwrap(await api.put('/hero/slides', { slides })) || []).map(mapHeroSlide),
    () => mockUpdateSlides(slides),
  );
}

export async function updateSideCards(sideCards) {
  await delay();
  return withFallback(
    async () => (unwrap(await api.put('/hero/side-cards', { sideCards })) || []).map(mapHeroSideCard),
    () => mockUpdateSideCards(sideCards),
  );
}

export async function updateTopDeals() {
  await delay();
  return syncHeroTopDeals();
}

export { heroContent };
