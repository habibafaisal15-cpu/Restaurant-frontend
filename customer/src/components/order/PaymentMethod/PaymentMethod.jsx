import { PAYMENT_METHODS } from '../../../constants';
import './PaymentMethod.css';

const OPTIONS = [
  {
    value: PAYMENT_METHODS.CASH,
    label: 'Cash on delivery',
    description: 'Pay with cash when your order arrives.',
    icon: 'cash',
  },
  {
    value: PAYMENT_METHODS.CARD,
    label: 'Debit / Credit card',
    description: 'Pay securely with Visa or Mastercard.',
    icon: 'card',
  },
  {
    value: PAYMENT_METHODS.ONLINE,
    label: 'Mobile wallet',
    description: 'Pay with your mobile wallet account.',
    icon: 'wallet',
  },
];

function PaymentIcon({ type }) {
  if (type === 'card') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="2.5"
          y="5"
          width="19"
          height="14"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M2.5 9.5h19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M6 15h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === 'wallet') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="6"
          width="18"
          height="13"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3 10h18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="16.5" cy="14.5" r="1.25" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 10h4M7 13h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="17" cy="14" r="1.1" fill="currentColor" />
    </svg>
  );
}

function PaymentMethod({ value, onChange }) {
  return (
    <div className="payment-method">
      <p className="payment-method__legend">Choose how to pay</p>
      <div
        className="payment-method__list"
        role="radiogroup"
        aria-label="Payment method"
      >
        {OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`payment-method__option${selected ? ' is-selected' : ''}`}
              onClick={() => onChange?.(option.value)}
            >
              <span className="payment-method__icon" aria-hidden="true">
                <PaymentIcon type={option.icon} />
              </span>
              <span className="payment-method__copy">
                <span className="payment-method__label">{option.label}</span>
                <span className="payment-method__desc">{option.description}</span>
              </span>
              <span className="payment-method__check" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentMethod;

export function getPaymentMethodLabel(value) {
  return OPTIONS.find((option) => option.value === value)?.label || value;
}
