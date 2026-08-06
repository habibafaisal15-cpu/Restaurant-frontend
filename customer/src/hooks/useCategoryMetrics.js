import { useEffect, useMemo, useState } from 'react';
import { getCategories, getMenuMetrics } from '../api/menu';

const POLL_MS = 20000;
const MAX_BEST_SELLERS = 5;

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
    .filter((item) => item.id && item.name && item.image);
};

export function useCategoryMetrics(branchId) {
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!branchId) {
      setCategories([]);
      setMetrics(null);
      setLoading(false);
      return undefined;
    }

    let active = true;

    const fetchLive = async () => {
      try {
        setError(null);
        const [categoriesRes, metricsRes] = await Promise.allSettled([
          getCategories(branchId),
          getMenuMetrics(branchId),
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
    fetchLive();
    const intervalId = setInterval(fetchLive, POLL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [branchId]);

  const resolved = useMemo(() => {
    const bestSellers = normalizeBestSellers(
      metrics?.bestSellers || metrics?.best_sellers || metrics?.topSellers
    );

    return {
      categories,
      totalCategories: metrics?.totalCategories ?? categories.length,
      totalDishes:
        metrics?.totalDishes ??
        metrics?.totalItems ??
        categories.reduce(
          (sum, category) =>
            sum + (category.itemCount || category.itemsCount || 0),
          0
        ),
      bestSellers,
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
