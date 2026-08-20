import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ChefHat, RefreshCw } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api, unwrap } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { connectAdminSocket, getSocket } from '../api/socket';
import './KitchenBoard.css';

const BOARDS = [
  { key: 'incoming', label: 'New requests' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'prepared', label: 'Prepared' },
];

function formatMoney(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-PK')}`;
}

async function listKitchenOrders(board) {
  return unwrap(await api.get('/kitchen/orders', { params: { board } })) || [];
}

async function updateKitchenStatus(orderId, status, setBy) {
  return unwrap(
    await api.patch(`/kitchen/orders/${orderId}/status`, {
      status,
      set_by: setBy,
      actor: 'kitchen',
    }),
  );
}

export default function KitchenBoard() {
  const { user } = useAuth();
  const { refreshKey } = useOutletContext() || {};
  const [board, setBoard] = useState('incoming');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const list = await listKitchenOrders(board);
      setOrders(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  }, [board]);

  useEffect(() => {
    load({ silent: Boolean(refreshKey) });
  }, [load, refreshKey]);

  useEffect(() => {
    connectAdminSocket();
    const socket = getSocket();
    const handler = (payload) => {
      if (payload?.order_status === 'Sent to Kitchen') {
        toast.success(`Kitchen request: ${payload.order_number || 'new order'}`);
      }
      load({ silent: true });
    };
    const events = ['order.sent_to_kitchen', 'order.status_changed', 'order.prepared'];
    events.forEach((event) => socket.on(event, handler));
    return () => events.forEach((event) => socket.off(event, handler));
  }, [load]);

  const act = async (order, nextStatus, label) => {
    setActingId(order.id);
    try {
      await updateKitchenStatus(order.id, nextStatus, user?.name || 'Kitchen');
      toast.success(label);
      load({ silent: true });
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="page kitchen-board-page">
      <div className="page-header">
        <div>
          <h1>Kitchen Board</h1>
          <p>Orders sent by admin — start preparing, then mark prepared for the rider.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => load()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="kitchen-board-tabs">
        {BOARDS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`kitchen-board-tab ${board === tab.key ? 'active' : ''}`}
            onClick={() => setBoard(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="kitchen-board-empty">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="panel kitchen-board-empty-card">
          <ChefHat size={28} />
          <h3>No orders here</h3>
          <p>When admin clicks Send to Kitchen, new requests appear in this queue.</p>
        </div>
      ) : (
        <div className="kitchen-board-grid">
          {orders.map((order) => (
            <article key={order.id} className="kitchen-board-card panel">
              <div className="kitchen-board-card-top">
                <div>
                  <strong>{order.order_number}</strong>
                  <span>{order.order_status}</span>
                </div>
                <em>
                  {order.order_time
                    ? formatDistanceToNow(new Date(order.order_time), { addSuffix: true })
                    : ''}
                </em>
              </div>
              <p className="kitchen-board-customer">
                {order.customer_name} · {order.customer_phone}
              </p>
              <ul className="kitchen-board-items">
                {(order.items || []).map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.quantity}× {item.product_name}
                    </span>
                    {item.notes ? <small>{item.notes}</small> : null}
                  </li>
                ))}
              </ul>
              {order.delivery_instructions ? (
                <p className="kitchen-board-note">Note: {order.delivery_instructions}</p>
              ) : null}
              <div className="kitchen-board-card-foot">
                <strong>{formatMoney(order.total_amount)}</strong>
                <div className="kitchen-board-actions">
                  {order.order_status === 'Sent to Kitchen' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={actingId === order.id}
                      onClick={() => act(order, 'Preparing', 'Started preparing')}
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.order_status === 'Preparing' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={actingId === order.id}
                      onClick={() => act(order, 'Order Prepared', 'Order prepared')}
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
