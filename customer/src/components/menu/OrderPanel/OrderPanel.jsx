import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useCart } from '../../../context';
import { formatCurrency } from '../../../utils/format';
import './OrderPanel.css';

function OrderPanel() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } =
    useCart();

  return (
    <aside className="order-panel" aria-label="Order details">
      <div className="order-panel__head">
        <h2>Order Details</h2>
      </div>

      <div className="order-panel__body">
        {items.length === 0 ? (
          <div className="order-panel__empty">
            <div className="order-panel__empty-art" aria-hidden="true">
              🛒
            </div>
            <p>You haven&apos;t added any items in cart yet</p>
          </div>
        ) : (
          <ul className="order-panel__list">
            {items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{formatCurrency(item.price)}</span>
                </div>
                <div className="order-panel__controls">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button type="button" onClick={() => removeItem(item.id)}>
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="order-panel__footer">
        <div>
          <span>
            {totalItems} Item{totalItems === 1 ? '' : 's'}
          </span>
          <strong>{formatCurrency(totalPrice)}</strong>
        </div>
        <Link to={ROUTES.CART}>View Cart →</Link>
      </div>
    </aside>
  );
}

export default OrderPanel;
