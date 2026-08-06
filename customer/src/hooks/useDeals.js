import { useEffect, useState } from 'react';
import { getDeals } from '../api/menu';
import { joinMenuUpdates, onMenuUpdated } from '../api/socket';

export function useDeals(zoneId) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!zoneId) {
      setDeals([]);
      return undefined;
    }

    let active = true;

    const load = () => {
      setLoading(true);
      setError(null);

      getDeals(zoneId)
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

    load();
    joinMenuUpdates();
    const unsubscribe = onMenuUpdated(load);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [zoneId]);

  return { deals, loading, error };
}
