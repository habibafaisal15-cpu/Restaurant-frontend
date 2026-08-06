import { useEffect, useState } from 'react';
import { getStorefrontHeroDeals } from '../api/content';
import { getDeals } from '../api/menu';
import { joinMenuUpdates, onMenuUpdated } from '../api/socket';

async function loadDeals(zoneId, refresh = false) {
  if (zoneId) {
    return getDeals(zoneId, { refresh });
  }
  return getStorefrontHeroDeals();
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

    load(true);
    joinMenuUpdates();
    const unsubscribe = onMenuUpdated(() => load(true));

    return () => {
      active = false;
      unsubscribe();
    };
  }, [zoneId]);

  return { deals, loading, error };
}
