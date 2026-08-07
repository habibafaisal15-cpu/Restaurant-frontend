import { useEffect, useState } from 'react';
import { getStorefrontHeroDeals, clearHeroCache } from '../api/content';
import { getDeals, clearMenuCache } from '../api/menu';
import { joinMenuUpdates, onMenuUpdated } from '../api/socket';

async function loadDeals(zoneId, refresh = false) {
  if (zoneId) {
    if (refresh) clearMenuCache(zoneId);
    return getDeals(zoneId, { refresh });
  }
  if (refresh) clearHeroCache();
  return getStorefrontHeroDeals({ refresh });
}

export function useDeals(zoneId) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = (refresh = false) => {
      setLoading(true);
      setError(null);

      loadDeals(zoneId, refresh)
        .then((response) => {
          if (active) setDeals(response?.data || response || []);
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    load(false);
    joinMenuUpdates();
    const unsubscribe = onMenuUpdated(() => load(true));

    return () => {
      active = false;
      unsubscribe();
    };
  }, [zoneId]);

  return { deals, loading, error };
}
