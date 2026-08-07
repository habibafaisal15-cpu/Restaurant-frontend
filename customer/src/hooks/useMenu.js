import { useEffect, useState } from 'react';
import { getCategories, getFullMenu, clearMenuCache } from '../api/menu';
import { joinMenuUpdates, onMenuUpdated } from '../api/socket';

export function useCategories(branchId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!branchId) {
      setCategories([]);
      return undefined;
    }

    let active = true;

    const load = ({ refresh = false } = {}) => {
      setLoading(true);
      setError(null);
      if (refresh) clearMenuCache(branchId);

      getCategories(branchId, { refresh })
        .then((data) => {
          const next = data?.data || data || [];
          if (active && Array.isArray(next)) {
            setCategories(next);
          }
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    load({ refresh: false });
    joinMenuUpdates();
    const unsubscribe = onMenuUpdated(() => load({ refresh: true }));

    return () => {
      active = false;
      unsubscribe();
    };
  }, [branchId]);

  return { categories, loading, error };
}

export function useMenuItems(branchId, categoryId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!branchId) return undefined;

    let active = true;
    setLoading(true);
    setError(null);

    getFullMenu(branchId)
      .then((menu) => {
        if (!active) return;
        const category = menu.categories.find((entry) => entry.id === categoryId);
        setItems(category?.items || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [branchId, categoryId]);

  return { items, loading, error };
}

export function useFullMenu(branchId) {
  const [menu, setMenu] = useState({
    categories: [],
    deals: [],
    bestSellers: [],
    topSellingDeals: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!branchId) {
      setMenu({
        categories: [],
        deals: [],
        bestSellers: [],
        topSellingDeals: [],
      });
      return undefined;
    }

    let active = true;

    const load = ({ refresh = false } = {}) => {
      setLoading(true);
      setError(null);
      if (refresh) clearMenuCache(branchId);

      getFullMenu(branchId, { refresh })
        .then((next) => {
          if (active) setMenu(next);
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    load({ refresh: false });
    joinMenuUpdates();
    const unsubscribe = onMenuUpdated(() => load({ refresh: true }));

    return () => {
      active = false;
      unsubscribe();
    };
  }, [branchId]);

  return { menu, loading, error };
}
