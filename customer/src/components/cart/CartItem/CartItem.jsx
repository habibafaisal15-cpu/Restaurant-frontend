import { formatCurrency } from '../../../utils/format';
import './CartItem.css';

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="cart-item">
      <div className="cart-item__info">
        <h4>{item.name}</h4>
        <p>{formatCurrency(item.price)}</p>
      </div>

      <div className="cart-item__controls">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => onDecrease?.(item.id)}
        >
          −
        </button>
        <span>{item.quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => onIncrease?.(item.id)}
        >
          +
        </button>
        <button
          type="button"
          className="cart-item__remove"
          aria-label={`Remove ${item.name}`}
          onClick={() => onRemove?.(item.id)}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default CartItem;
