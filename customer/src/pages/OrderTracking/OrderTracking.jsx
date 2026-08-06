import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Loader from '../../components/common/Loader';
import OrderRoadmap from '../../components/order/OrderRoadmap';
import OrderStatus from '../../components/order/OrderStatus';
import RiderAssignPopup from '../../components/order/RiderAssignPopup';
import RiderInfo from '../../components/order/RiderInfo';
import { ROUTES } from '../../constants';
import { useOrder } from '../../context';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import './OrderTracking.css';

function OrderTracking() {
  const { orderId } = useParams();
  const pageLocation = useLocation();
  const { activeOrder, setActiveOrder, setRider, rider: contextRider } =
    useOrder();
  const { order, rider, loading, error } = useOrderTracking(orderId);
  // Popup already shown on checkout after place order; only reopen if needed
  const [popupOpen, setPopupOpen] = useState(
    () => Boolean(pageLocation.state?.showRiderAssign) && !contextRider
  );

  const resolvedOrder =
    order ||
    (activeOrder?.id === orderId
      ? activeOrder
      : {
          id: orderId,
          status: 'confirmed',
        });

  const resolvedRider = rider || contextRider || resolvedOrder.rider || null;

  const handleRiderReady = useCallback(
    (nextRider) => {
      setRider(nextRider);
      setActiveOrder((current) => {
        if (!current || current.id !== orderId) {
          return {
            id: orderId,
            status: 'rider_assigned',
            rider: nextRider,
          };
        }
        return {
          ...current,
          status: 'rider_assigned',
          rider: nextRider,
        };
      });
    },
    [orderId, setActiveOrder, setRider]
  );

  return (
    <section className="page page-container order-tracking-page">
      <BackButton label="Back to home" to={ROUTES.HOME} />
      <OrderRoadmap currentStep="confirmed" />

      <h1>Order confirmed</h1>
      <p className="order-tracking-page__id">Order ID: {orderId}</p>

      {loading && !order && !activeOrder && (
        <Loader label="Fetching order updates..." />
      )}

      {error && !activeOrder && (
        <p className="order-tracking-page__note">
          Order placed successfully. Live rider updates will appear when admin
          assigns a rider.
        </p>
      )}

      <OrderStatus status={resolvedOrder.status} />
      <RiderInfo rider={resolvedRider} />

      <RiderAssignPopup
        open={popupOpen}
        orderId={orderId}
        rider={resolvedRider}
        onRiderReady={handleRiderReady}
        onClose={() => setPopupOpen(false)}
      />
    </section>
  );
}

export default OrderTracking;
