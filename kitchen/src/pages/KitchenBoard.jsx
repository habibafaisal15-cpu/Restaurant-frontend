import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as ordersApi from '../services/orders';
import { connectKitchenSocket, onKitchenEvents } from '../api/socket';

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'KH';
}

function elapsedLabel(orderTime) {
  if (!orderTime) return '—';
  const ms = Date.now() - new Date(orderTime).getTime();
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s} elapsed`;
}

export default function KitchenDashboard() {
  const { user, logout } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [preparing, setPreparing] = useState([]);
  const [prepared, setPrepared] = useState([]);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [, setTick] = useState(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        ordersApi.listKitchenOrders('incoming'),
        ordersApi.listKitchenOrders('preparing'),
        ordersApi.listKitchenOrders('prepared'),
      ]);
      setIncoming(a);
      setPreparing(b);
      setPrepared(c);
    } catch (err) {
      toast.error(err.message || 'Failed to load kitchen orders');
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
      if (payload?.order_status === 'Sent to Kitchen') {
        toast.success(`New order ${payload.order_number || ''}`.trim());
      }
      load({ silent: true });
    });
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      off();
      clearInterval(timer);
    };
  }, [load]);

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

  const totalToday = incoming.length + preparing.length + prepared.length;
  const completedToday = prepared.length;

  const visibleIncoming = useMemo(() => {
    if (view === 'preparing' || view === 'prepared') return [];
    return incoming;
  }, [view, incoming]);

  const visiblePreparing = useMemo(() => {
    if (view === 'incoming' || view === 'prepared') return [];
    return preparing;
  }, [view, preparing]);

  const visiblePrepared = useMemo(() => {
    if (view === 'incoming' || view === 'preparing') return [];
    return prepared;
  }, [view, prepared]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <ChefHat size={22} />
          <div>
            <strong>RESTAURANT KITCHEN</strong>
            <span>Kitchen handler portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className={`sidebar-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <span><LayoutDashboard size={16} /> Dashboard</span>
          </button>
          <button type="button" className={`sidebar-link ${view === 'incoming' ? 'active' : ''}`} onClick={() => setView('incoming')}>
            <span><ShoppingBag size={16} /> New Orders</span>
            <em className="sidebar-badge">{incoming.length}</em>
          </button>
          <button type="button" className={`sidebar-link ${view === 'preparing' ? 'active' : ''}`} onClick={() => setView('preparing')}>
            <span><ChefHat size={16} /> Preparing</span>
            <em className="sidebar-badge">{preparing.length}</em>
          </button>
          <button type="button" className={`sidebar-link ${view === 'prepared' ? 'active' : ''}`} onClick={() => setView('prepared')}>
            <span><CheckCircle2 size={16} /> Order Prepared</span>
            <em className="sidebar-badge">{prepared.length}</em>
          </button>
          <button type="button" className={`sidebar-link ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>
            <span><ClipboardList size={16} /> All Orders</span>
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
            <Bell size={18} color="#8f7e6c" />
            <div>
              <strong>{user?.name || 'Kitchen Handler'}</strong>
              <em>Online</em>
            </div>
            <div className="avatar">{initials(user?.name)}</div>
          </div>
        </header>

        <div className="content">
          <div className="page-title">
            <h1>Kitchen Dashboard</h1>
            <p>Manage and track all incoming orders.</p>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div>
                <span>New Orders</span>
                <strong>{incoming.length}</strong>
                <em>Needs attention</em>
              </div>
              <div className="stat-icon copper"><ShoppingBag size={18} /></div>
            </div>
            <div className="stat-card">
              <div>
                <span>Preparing</span>
                <strong>{preparing.length}</strong>
                <em>In progress</em>
              </div>
              <div className="stat-icon warning"><ChefHat size={18} /></div>
            </div>
            <div className="stat-card">
              <div>
                <span>Order Prepared</span>
                <strong>{prepared.length}</strong>
                <em>Ready for rider</em>
              </div>
              <div className="stat-icon success"><CheckCircle2 size={18} /></div>
            </div>
            <div className="stat-card">
              <div>
                <span>Total Orders</span>
                <strong>{totalToday}</strong>
                <em>Active now</em>
              </div>
              <div className="stat-icon info"><ClipboardList size={18} /></div>
            </div>
          </div>

          {loading ? (
            <p className="empty">Loading kitchen board…</p>
          ) : (
            <div className="board">
              {(view === 'dashboard' || view === 'incoming' || view === 'all') && (
                <div className="board-col">
                  <div className="panel">
                    <div className="panel-head">
                      <h2>New Orders</h2>
                      <span>{visibleIncoming.length || incoming.length} waiting</span>
                    </div>
                    {(view === 'dashboard' ? incoming : visibleIncoming).length === 0 ? (
                      <p className="empty">No new kitchen requests</p>
                    ) : (
                      (view === 'dashboard' ? incoming : visibleIncoming).map((order) => (
                        <article key={order.id} className="order-card" style={{ marginBottom: '0.75rem' }}>
                          <div className="order-card-top">
                            <strong>#{order.order_number}</strong>
                            <em>{order.order_time ? formatDistanceToNow(new Date(order.order_time), { addSuffix: true }) : ''}</em>
                          </div>
                          <div className="order-meta">{order.customer_name}</div>
                          <ul className="order-items">
                            {(order.items || []).map((item) => (
                              <li key={item.id}>
                                {item.quantity} x {item.product_name}
                                {item.notes ? <small>{item.notes}</small> : null}
                              </li>
                            ))}
                          </ul>
                          <div className="order-foot">
                            <span className="order-type"><Package size={12} /> {order.order_type || 'Delivery'}</span>
                            <strong>{money(order.total_amount)}</strong>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={actingId === order.id}
                            onClick={() => act(order, 'Preparing', 'Started preparing')}
                          >
                            Start Preparing
                          </button>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}

              {(view === 'dashboard' || view === 'preparing' || view === 'prepared' || view === 'all') && (
                <div className="board-col">
                  {(view === 'dashboard' || view === 'preparing' || view === 'all') && (
                    <div className="panel">
                      <div className="panel-head">
                        <h2>Preparing Orders</h2>
                        <span>{preparing.length} in progress</span>
                      </div>
                      {preparing.length === 0 ? (
                        <p className="empty">Nothing preparing</p>
                      ) : (
                        preparing.map((order) => (
                          <article key={order.id} className="order-card preparing" style={{ marginBottom: '0.75rem' }}>
                            <div className="order-card-top">
                              <strong>#{order.order_number}</strong>
                              <em className="elapsed">{elapsedLabel(order.order_time)}</em>
                            </div>
                            <div className="order-meta">{order.customer_name}</div>
                            <ul className="order-items">
                              {(order.items || []).slice(0, 3).map((item) => (
                                <li key={item.id}>{item.quantity} x {item.product_name}</li>
                              ))}
                            </ul>
                            <button
                              type="button"
                              className="btn btn-warning"
                              disabled={actingId === order.id}
                              onClick={() => act(order, 'Order Prepared', 'Order prepared — rider notified')}
                            >
                              Mark Prepared
                            </button>
                          </article>
                        ))
                      )}
                    </div>
                  )}

                  {(view === 'dashboard' || view === 'prepared' || view === 'all') && (
                    <div className="panel">
                      <div className="panel-head">
                        <h2>Order Prepared</h2>
                        <span>{prepared.length} ready</span>
                      </div>
                      {prepared.length === 0 ? (
                        <p className="empty">No prepared orders</p>
                      ) : (
                        prepared.map((order) => (
                          <article key={order.id} className="order-card prepared" style={{ marginBottom: '0.75rem' }}>
                            <div className="order-card-top">
                              <strong>#{order.order_number}</strong>
                              <em>{order.order_time ? formatDistanceToNow(new Date(order.order_time), { addSuffix: true }) : ''}</em>
                            </div>
                            <div className="order-meta">{order.customer_name}</div>
                            <div className="ready-note">
                              <CheckCircle2 size={16} /> Ready for rider pickup
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="footer-stats">
            <div className="footer-stat">
              <Clock3 size={18} color="#d4894a" />
              <div>
                <strong>—</strong>
                <span>Average Preparation Time</span>
              </div>
            </div>
            <div className="footer-stat">
              <TrendingUp size={18} color="#3d9b6a" />
              <div>
                <strong>{completedToday}</strong>
                <span>Orders Ready Now</span>
              </div>
            </div>
            <div className="footer-stat">
              <Star size={18} color="#d4a017" />
              <div>
                <strong>{incoming.length === 0 ? 'Excellent' : 'Busy'}</strong>
                <span>Kitchen Performance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
