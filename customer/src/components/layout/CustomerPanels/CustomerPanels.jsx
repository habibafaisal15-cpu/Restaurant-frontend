import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import {
  getNotifications,
  getOrderHistory,
  markNotificationsRead,
  unreadNotificationCount,
} from '../../../utils/orderHistory';
import { formatCurrency } from '../../../utils/format';
import './CustomerPanels.css';

function statusLabel(status) {
  return String(status || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CustomerActionButtons({
  onOpenOrders,
  onOpenNotifications,
  className = '',
}) {
  const [unread, setUnread] = useState(() => unreadNotificationCount());

  useEffect(() => {
    const sync = () => setUnread(unreadNotificationCount());
    window.addEventListener('storage', sync);
    window.addEventListener('customer-notifications', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('customer-notifications', sync);
    };
  }, []);

  return (
    <div className={`customer-actions ${className}`.trim()}>
      <button
        type="button"
        className="customer-actions__btn"
        aria-label="Order details"
        title="Order details"
        onClick={onOpenOrders}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 4h10a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.8.4L12 16.2l-6.2 3.7a.5.5 0 0 1-.8-.4V6a2 2 0 0 1 2-2zm0 2v11.2l4.7-2.8a1 1 0 0 1 1 0L17.4 17.2V6H7z"
          />
        </svg>
      </button>
      <button
        type="button"
        className="customer-actions__btn"
        aria-label="Notifications"
        title="Notifications"
        onClick={onOpenNotifications}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-5V11a7 7 0 1 0-14 0v6l-2 2v1h18v-1l-2-2zm-2 1H7v-6a5 5 0 1 1 10 0v6z"
          />
        </svg>
        {unread > 0 && <span className="customer-actions__badge">{unread}</span>}
      </button>
    </div>
  );
}

export function OrdersSidePanel({ open, onClose }) {
  const [orders, setOrders] = useState(() => getOrderHistory());

  useEffect(() => {
    if (!open) return undefined;
    setOrders(getOrderHistory());
    const sync = () => setOrders(getOrderHistory());
    window.addEventListener('customer-orders', sync);
    return () => window.removeEventListener('customer-orders', sync);
  }, [open]);

  if (!open) return null;

  return (
    <div className="customer-panel" role="dialog" aria-label="Order details">
      <button
        type="button"
        className="customer-panel__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="customer-panel__sheet">
        <header className="customer-panel__head">
          <h2>Your orders</h2>
          <button type="button" onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </header>
        <div className="customer-panel__body">
          {!orders.length && (
            <p className="customer-panel__empty">
              No saved orders yet. Place an order to track it here.
            </p>
          )}
          <ul className="customer-panel__list">
            {orders.map((order) => (
              <li key={order.id}>
                <div>
                  <strong>{order.orderNumber || order.id}</strong>
                  <span>{statusLabel(order.status)}</span>
                  {order.total != null && (
                    <em>{formatCurrency(order.total)}</em>
                  )}
                </div>
                <Link
                  to={`/order/${order.id}`}
                  className="customer-panel__link"
                  onClick={onClose}
                >
                  View status
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to={ROUTES.TRACK}
            className="customer-panel__track"
            onClick={onClose}
          >
            Track with code
          </Link>
        </div>
      </aside>
    </div>
  );
}

export function NotificationsSidePanel({ open, onClose }) {
  const [items, setItems] = useState(() => getNotifications());

  useEffect(() => {
    if (!open) return undefined;
    setItems(markNotificationsRead());
    window.dispatchEvent(new Event('customer-notifications'));
    const sync = () => setItems(getNotifications());
    window.addEventListener('customer-notifications', sync);
    return () => window.removeEventListener('customer-notifications', sync);
  }, [open]);

  if (!open) return null;

  return (
    <div className="customer-panel" role="dialog" aria-label="Notifications">
      <button
        type="button"
        className="customer-panel__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="customer-panel__sheet">
        <header className="customer-panel__head">
          <h2>Notifications</h2>
          <button type="button" onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </header>
        <div className="customer-panel__body">
          {!items.length && (
            <p className="customer-panel__empty">No notifications yet.</p>
          )}
          <ul className="customer-panel__list customer-panel__list--notifs">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
                {item.orderId && (
                  <Link
                    to={`/order/${item.orderId}`}
                    className="customer-panel__link"
                    onClick={onClose}
                  >
                    Open order
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
