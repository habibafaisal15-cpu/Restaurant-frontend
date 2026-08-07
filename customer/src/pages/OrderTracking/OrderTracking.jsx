import { useCallback, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Loader from '../../components/common/Loader';
import OrderRoadmap, {
  roadmapStepFromOrderStatus,
} from '../../components/order/OrderRoadmap';
import OrderStatus from '../../components/order/OrderStatus';
import RiderAssignPopup from '../../components/order/RiderAssignPopup';
import RiderInfo from '../../components/order/RiderInfo';
import { ORDER_STATUS, ROUTES } from '../../constants';
import { useOrder } from '../../context';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import './OrderTracking.css';

const STATUS_HEADING = {
  [ORDER_STATUS.PENDING]: 'Order placed',
  [ORDER_STATUS.CONFIRMED]: 'Order confirmed',
  [ORDER_STATUS.PREPARING]: 'Order confirmed',
  [ORDER_STATUS.RIDER_ASSIGNED]: 'Order confirmed',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Order cancelled',
};

function OrderTracking() {
  const { orderId } = useParams();
  const pageLocation = useLocation();
  const { activeOrder, setActiveOrder, setRider, rider: contextRider } =
    useOrder();
  const { order, rider, loading, error } = useOrderTracking(orderId);
  const [popupOpen, setPopupOpen] = useState(
    () => Boolean(pageLocation.state?.showRiderAssign) && !contextRider,
  );

  const resolvedOrder =
    order ||
    (activeOrder?.id === orderId
      ? activeOrder
      : {
          id: orderId,
          status: ORDER_STATUS.CONFIRMED,
        });

  const resolvedRider = rider || contextRider || resolvedOrder.rider || null;
  const roadmapStep = useMemo(
    () => roadmapStepFromOrderStatus(resolvedOrder.status),
    [resolvedOrder.status],
  );
  const heading =
    STATUS_HEADING[resolvedOrder.status] ||
    STATUS_HEADING[ORDER_STATUS.CONFIRMED];

  const handleRiderReady = useCallback(
    (nextRider) => {
      setRider(nextRider);
      setActiveOrder((current) => {
        if (!current || current.id !== orderId) {
          return {
            id: orderId,
            status: ORDER_STATUS.RIDER_ASSIGNED,
            rider: nextRider,
          };
        }
        return {
          ...current,
          status: ORDER_STATUS.RIDER_ASSIGNED,
          rider: nextRider,
        };
      });
    },
    [orderId, setActiveOrder, setRider],
  );

  return (
    <section className="page page-container order-tracking-page">
      <BackButton label="Back to home" to={ROUTES.HOME} />
      <OrderRoadmap currentStep={roadmapStep} />

      <h1>{heading}</h1>
      <p className="order-tracking-page__id">Order ID: {orderId}</p>

      {loading && !order && !activeOrder && (
        <Loader label="Fetching order updates..." />
      )}

      {error && !activeOrder && (
        <p className="order-tracking-page__note">
          Order placed successfully. Live updates appear when the kitchen
          advances your order.
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
