import {
  getStorefrontHero,
  mapHeroSideCards,
  mapHeroSlides,
} from '../api/content';
import { resolveMediaUrl } from '../api/adapters';

/**
 * Build hero slides from live menu categories that have hero images.
 */
export function buildHeroSlides(categories = []) {
  const list = Array.isArray(categories) ? categories : [];

  return list
    .filter((category) => category?.showInHero !== false)
    .map((category) => {
      const image =
        category.heroImage ||
        category.heroImageUrl ||
        category.bannerImage ||
        category.image;

      if (!image) return null;

      return {
        id: category.id || category.categoryId || image,
        categoryId: category.id || category.categoryId || null,
        name: category.name || '',
        title: category.heroTitle || category.title || category.name || '',
        image: resolveMediaUrl(image),
      };
    })
    .filter(Boolean);
}

/**
 * Load hero slides and side cards from the backend CMS, with category fallback.
 */
export async function fetchHeroContent(branchId, categories = []) {
  try {
    const payload = await getStorefrontHero();
    const cmsSlides = mapHeroSlides(payload?.slides || []);
    const sideCards = mapHeroSideCards(payload?.sideCards || []);

    if (cmsSlides.length) {
      return { slides: cmsSlides, sideCards };
    }

    if (branchId) {
      const categorySlides = buildHeroSlides(categories);
      if (categorySlides.length) {
        return { slides: categorySlides, sideCards };
      }
    }

    return { slides: [], sideCards };
  } catch {
    const categorySlides = branchId ? buildHeroSlides(categories) : [];
    return { slides: categorySlides, sideCards: [] };
  }
}
