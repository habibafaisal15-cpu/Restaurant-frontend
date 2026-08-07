import { Link } from 'react-router-dom';
import { ORDER_STATUS, ROUTES } from '../../../constants';
import './OrderRoadmap.css';

export const ORDER_STEPS = [
  { id: 'select', label: 'Select', to: ROUTES.MENU },
  { id: 'cart', label: 'Cart', to: ROUTES.CART },
  { id: 'checkout', label: 'Checkout', to: ROUTES.CHECKOUT },
  { id: 'confirmed', label: 'Confirmed', to: null },
  { id: 'out_for_delivery', label: 'Out for delivery', to: null },
  { id: 'delivered', label: 'Delivered', to: null },
];

/**
 * Map live order status onto the customer roadmap step.
 * Placement steps stay at "confirmed" until the kitchen sends the order out.
 */
export function roadmapStepFromOrderStatus(status) {
  const value = String(status || '').toLowerCase();

  if (
    value === ORDER_STATUS.DELIVERED ||
    value === 'delivered' ||
    value === 'served'
  ) {
    return 'delivered';
  }

  if (
    value === ORDER_STATUS.OUT_FOR_DELIVERY ||
    value === 'out_for_delivery' ||
    value === 'out for delivery'
  ) {
    return 'out_for_delivery';
  }

  if (
    value === ORDER_STATUS.CANCELLED ||
    value === 'cancelled' ||
    value === 'rejected'
  ) {
    return 'confirmed';
  }

  // pending / confirmed / preparing / rider_assigned / New / Accepted / etc.
  if (
    value === 'select' ||
    value === 'cart' ||
    value === 'checkout' ||
    value === 'confirmed' ||
    value === 'out_for_delivery' ||
    value === 'delivered'
  ) {
    return value;
  }

  return 'confirmed';
}

function OrderRoadmap({ currentStep = 'select' }) {
  const resolvedStep = roadmapStepFromOrderStatus(currentStep);
  const currentIndex = Math.max(
    0,
    ORDER_STEPS.findIndex((step) => step.id === resolvedStep),
  );

  return (
    <nav className="order-roadmap" aria-label="Order progress">
      <ol className="order-roadmap__list">
        {ORDER_STEPS.map((step, index) => {
          const status =
            index < currentIndex
              ? 'done'
              : index === currentIndex
                ? 'current'
                : 'upcoming';

          const label = (
            <>
              <span className="order-roadmap__dot" aria-hidden="true" />
              <span className="order-roadmap__label">{step.label}</span>
            </>
          );

          return (
            <li
              key={step.id}
              className={`order-roadmap__step is-${status}`}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              {index > 0 && (
                <span className="order-roadmap__line" aria-hidden="true" />
              )}

              {status === 'done' && step.to ? (
                <Link to={step.to} className="order-roadmap__node">
                  {label}
                </Link>
              ) : (
                <div className="order-roadmap__node">{label}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default OrderRoadmap;
