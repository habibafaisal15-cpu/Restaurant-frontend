import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Bike, CheckCircle2, LogOut, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as ordersApi from '../services/orders';
import { connectKitchenSocket, onKitchenEvents } from '../api/socket';

function money(n) {
  return `PKR ${Number(n || 0).toLocaleString('en-PK')}`;
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'RD';
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
      toast.error(err.message || 'Failed to load deliveries');
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
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Bike size={22} />
          <div>
            <strong>RIDER PORTAL</strong>
            <span>Delivery handoff</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button type="button" className="sidebar-link active">
            <span><Bike size={16} /> My Deliveries</span>
            <em className="sidebar-badge">{orders.length}</em>
          </button>
        </nav>
        <button type="button" className="btn btn-ghost sidebar-logout" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-date">{format(new Date(), 'd MMM yyyy, EEEE')}</div>
          <div className="topbar-user">
            <button type="button" className="btn btn-ghost" onClick={() => load()}>
              <RefreshCw size={15} /> Refresh
            </button>
            <div>
              <strong>{user?.name || 'Rider'}</strong>
              <em>Online</em>
            </div>
            <div className="avatar">{initials(user?.name)}</div>
          </div>
        </header>

        <div className="content">
          <div className="page-title">
            <h1>Rider Dashboard</h1>
            <p>Pickup prepared orders and update delivery status.</p>
          </div>

          {loading ? (
            <p className="empty">Loading deliveries…</p>
          ) : orders.length === 0 ? (
            <div className="panel">
              <p className="empty">No active deliveries assigned to you yet.</p>
            </div>
          ) : (
            <div className="board" style={{ gridTemplateColumns: '1fr' }}>
              <div className="panel">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className={`order-card ${order.order_status === 'Out for Delivery' ? 'preparing' : 'prepared'}`}
                    style={{ marginBottom: '0.85rem' }}
                  >
                    <div className="order-card-top">
                      <strong>#{order.order_number}</strong>
                      <em>
                        {order.order_time
                          ? formatDistanceToNow(new Date(order.order_time), { addSuffix: true })
                          : ''}
                      </em>
                    </div>
                    <div className="order-meta">
                      {order.customer_name} · {order.customer_phone}
                    </div>
                    <div className="order-meta" style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                      <MapPin size={14} style={{ marginTop: 2 }} />
                      <span>{order.delivery_address}</span>
                    </div>
                    <div className="order-foot">
                      <span className="order-type">{order.order_status}</span>
                      <strong>{money(order.total_amount)}</strong>
                    </div>
                    {['Order Prepared', 'Rider Assigned'].includes(order.order_status) && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={actingId === order.id}
                        onClick={() => act(order, 'Out for Delivery', 'On the way')}
                      >
                        On the Way
                      </button>
                    )}
                    {order.order_status === 'Out for Delivery' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={actingId === order.id}
                        onClick={() => act(order, 'Delivered', 'Delivered')}
                      >
                        <CheckCircle2 size={16} /> Mark Delivered
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
