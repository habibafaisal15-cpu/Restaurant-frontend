import { useEffect, useState } from 'react';
import { getOrderById, getOrderRider } from '../api/orders';
import { joinOrderTracking, onOrderUpdated } from '../api/socket';

export function useOrderTracking(orderId, pollIntervalMs = 15000) {
  const [order, setOrder] = useState(null);
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return undefined;

    let active = true;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const orderData = await getOrderById(orderId);
        if (!active) return;

        const nextOrder = orderData?.data || orderData;
        setOrder(nextOrder);

        if (nextOrder?.rider || nextOrder?.riderId) {
          const riderData = await getOrderRider(orderId);
          if (active) setRider(riderData?.data || riderData);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    joinOrderTracking(orderId);
    fetchOrder();
    const unsubscribe = onOrderUpdated(fetchOrder);
    const intervalId = setInterval(fetchOrder, pollIntervalMs);

    return () => {
      active = false;
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [orderId, pollIntervalMs]);

  return { order, rider, loading, error };
}
