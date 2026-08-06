import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import './OrderRoadmap.css';

export const ORDER_STEPS = [
  { id: 'select', label: 'Select', to: ROUTES.MENU },
  { id: 'cart', label: 'Cart', to: ROUTES.CART },
  { id: 'checkout', label: 'Checkout', to: ROUTES.CHECKOUT },
  { id: 'confirmed', label: 'Confirmed', to: null },
];

function OrderRoadmap({ currentStep = 'select' }) {
  const currentIndex = Math.max(
    0,
    ORDER_STEPS.findIndex((step) => step.id === currentStep)
  );

  return (
    <nav className="order-roadmap" aria-label="Order placement roadmap">
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
