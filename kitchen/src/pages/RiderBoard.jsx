import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Bike, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as ordersApi from '../services/orders';
import { connectKitchenSocket, onKitchenEvents } from '../api/socket';

function formatMoney(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-PK')}`;
}

export default function RiderBoard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const list = await ordersApi.listRiderOrders('active');
      setOrders(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load rider orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    connectKitchenSocket();
    const off = onKitchenEvents((payload) => {
      if (payload?.order_status === 'Order Prepared') {
        toast.success(`Order ready: ${payload.order_number || ''}`);
      }
      load({ silent: true });
    });
    return off;
  }, [load]);

  const act = async (order, nextStatus, label) => {
    setActingId(order.id);
    try {
      await ordersApi.updateRiderStatus(order.id, nextStatus, user?.name || 'Rider');
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
          <Bike size={24} />
          <div>
            <h1>Rider Board</h1>
            <p>{user?.name || 'Rider'} · {user?.phone}</p>
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

      {loading ? (
        <p className="ops-empty">Loading deliveries…</p>
      ) : orders.length === 0 ? (
        <p className="ops-empty">No active deliveries assigned to you.</p>
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
              <p className="order-notes">{order.delivery_address}</p>
              {order.delivery_instructions ? (
                <p className="order-notes">Note: {order.delivery_instructions}</p>
              ) : null}
              <div className="order-card-foot">
                <strong>{formatMoney(order.total_amount)}</strong>
                <div className="order-actions">
                  {['Order Prepared', 'Rider Assigned'].includes(order.order_status) && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={actingId === order.id}
                      onClick={() => act(order, 'Out for Delivery', 'On the way')}
                    >
                      On the Way
                    </button>
                  )}
                  {order.order_status === 'Out for Delivery' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={actingId === order.id}
                      onClick={() => act(order, 'Delivered', 'Marked delivered')}
                    >
                      Delivered
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
