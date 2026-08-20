import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ChefHat, LogOut, RefreshCw, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as ordersApi from '../services/orders';
import { connectKitchenSocket, onKitchenEvents } from '../api/socket';

const BOARDS = [
  { key: 'incoming', label: 'New requests', status: 'Sent to Kitchen' },
  { key: 'preparing', label: 'Preparing', status: 'Preparing' },
  { key: 'prepared', label: 'Prepared', status: 'Order Prepared' },
];

function formatMoney(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-PK')}`;
}

export default function KitchenBoard() {
  const { user, logout } = useAuth();
  const [board, setBoard] = useState('incoming');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const list = await ordersApi.listKitchenOrders(board);
      setOrders(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  }, [board]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    connectKitchenSocket();
    const off = onKitchenEvents((payload) => {
      if (payload?.order_status === 'Sent to Kitchen') {
        toast.success(`New kitchen request: ${payload.order_number || 'order'}`);
      }
      load({ silent: true });
    });
    return off;
  }, [load]);

  const counts = useMemo(() => ({
    incoming: board === 'incoming' ? orders.length : null,
  }), [board, orders.length]);

  const act = async (order, nextStatus, label) => {
    setActingId(order.id);
    try {
      await ordersApi.updateKitchenStatus(order.id, nextStatus, user?.name || 'Kitchen');
      toast.success(label);
      load({ silent: true });
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div className="ops-brand">
          <ChefHat size={24} />
          <div>
            <h1>Kitchen Board</h1>
            <p>{user?.name || 'Kitchen'} · live prep queue</p>
          </div>
        </div>
        <div className="ops-header-actions">
          <button type="button" className="btn-ghost" onClick={() => load()}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button type="button" className="btn-ghost" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <div className="ops-tabs">
        {BOARDS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={board === tab.key ? 'active' : ''}
            onClick={() => setBoard(tab.key)}
          >
            {tab.key === 'incoming' && <Bell size={14} />}
            {tab.label}
            {counts.incoming != null && tab.key === 'incoming' ? ` (${counts.incoming})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="ops-empty">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="ops-empty">No orders in this queue.</p>
      ) : (
        <div className="order-grid">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <strong>{order.order_number}</strong>
                  <span className="order-status">{order.order_status}</span>
                </div>
                <em>
                  {order.order_time
                    ? formatDistanceToNow(new Date(order.order_time), { addSuffix: true })
                    : ''}
                </em>
              </div>
              <p className="order-customer">
                {order.customer_name} · {order.customer_phone}
              </p>
              <ul className="order-items">
                {(order.items || []).map((item) => (
                  <li key={item.id}>
                    <span>{item.quantity}× {item.product_name}</span>
                    {item.notes ? <small>{item.notes}</small> : null}
                  </li>
                ))}
              </ul>
              {order.delivery_instructions ? (
                <p className="order-notes">Note: {order.delivery_instructions}</p>
              ) : null}
              <div className="order-card-foot">
                <strong>{formatMoney(order.total_amount)}</strong>
                <div className="order-actions">
                  {order.order_status === 'Sent to Kitchen' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={actingId === order.id}
                      onClick={() => act(order, 'Preparing', 'Started preparing')}
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.order_status === 'Preparing' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={actingId === order.id}
                      onClick={() => act(order, 'Order Prepared', 'Order prepared — rider notified')}
                    >
                      Order Prepared
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
