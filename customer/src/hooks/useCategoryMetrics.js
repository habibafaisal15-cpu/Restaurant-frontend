import { useEffect, useMemo, useState } from 'react';
import { getStorefrontPopular } from '../api/content';
import { getCategories, getMenuMetrics, clearMenuCache } from '../api/menu';
import { joinMenuUpdates, onMenuUpdated } from '../api/socket';

const MAX_BEST_SELLERS = 3;

const normalizeBestSellers = (raw) => {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(Boolean)
    .slice(0, MAX_BEST_SELLERS)
    .map((item, index) => ({
      id: item.id || item.itemId || `best-seller-${index}`,
      name: item.name || item.title || '',
      price: Number(item.price) || 0,
      image: item.image || item.imageUrl || item.photo || '',
      description: item.description || '',
    }))
    .filter((item) => item.id && item.name);
};

export function useCategoryMetrics(branchId) {
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchLive = async ({ refresh = false } = {}) => {
      try {
        setError(null);

        if (!branchId) {
          const popular = await getStorefrontPopular({ refresh });
          if (!active) return;

          setCategories([]);
          setMetrics({
            bestSellers: popular.bestSellers,
            topSellingDeals: popular.topDeals,
            updatedAt: new Date().toISOString(),
          });
          return;
        }

        if (refresh) clearMenuCache(branchId);

        const [categoriesRes, metricsRes] = await Promise.allSettled([
          getCategories(branchId, { refresh }),
          getMenuMetrics(branchId, { refresh }),
        ]);

        if (!active) return;

        if (categoriesRes.status === 'fulfilled') {
          const nextCategories =
            categoriesRes.value?.data || categoriesRes.value || [];
          if (Array.isArray(nextCategories)) {
            setCategories(nextCategories);
          }
        }

        if (metricsRes.status === 'fulfilled') {
          const nextMetrics = metricsRes.value?.data || metricsRes.value;
          if (nextMetrics) {
            setMetrics(nextMetrics);
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    fetchLive({ refresh: false });
    joinMenuUpdates();
    const unsubscribe = onMenuUpdated(() => fetchLive({ refresh: true }));

    return () => {
      active = false;
      unsubscribe();
    };
  }, [branchId]);

  const resolved = useMemo(() => {
    const bestSellers = normalizeBestSellers(
      metrics?.bestSellers || metrics?.best_sellers || metrics?.topSellers,
    );
    const topSellingDeals =
      metrics?.topSellingDeals || metrics?.top_selling_deals || [];

    return {
      categories,
      totalCategories: metrics?.totalCategories ?? categories.length,
      totalDishes:
        metrics?.totalDishes ??
        metrics?.totalItems ??
        categories.reduce(
          (sum, category) =>
            sum + (category.itemCount || category.itemsCount || 0),
          0,
        ),
      bestSellers,
      deals: topSellingDeals,
      liveUpdatedAt:
        metrics?.updatedAt ||
        metrics?.liveUpdatedAt ||
        null,
      isLive: Boolean(metrics),
    };
  }, [categories, metrics]);

  return {
    ...resolved,
    loading,
    error,
  };
}
