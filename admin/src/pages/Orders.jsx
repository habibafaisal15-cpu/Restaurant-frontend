import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  ChefHat,
  Bike,
  Truck,
  PackageCheck,
  Printer,
  FileText,
  Clock,
  Phone,
  MapPin,
  Share2,
  Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import StatCard from '../components/ui/StatCard';
import SlipPreview from '../components/slips/SlipPreview';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import * as orderService from '../services/orderService';
import * as slipService from '../services/slipService';
import * as riderService from '../services/riderService';
import { formatPKR, formatDateTime, truncate } from '../utils/format';
import './Orders.css';

/** Pipeline tabs for online delivery orders from the customer website. */
const PIPELINE_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'New requests' },
  { key: 'confirmed', label: 'Accepted' },
  { key: 'rider_assigned', label: 'Rider shared' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'custom', label: 'Custom range' },
];

function settingsForSlip(settings) {
  return {
    name: settings.restaurantName,
    logo: settings.logo,
    address: settings.address,
    phone: settings.phone,
    footer: settings.slipFooter,
    taxRate: settings.taxPercent,
  };
}

function mapSlipType(type) {
  const t = String(type ?? 'kitchen').toLowerCase();
  if (t === 'kitchen') return 'KITCHEN';
  if (t === 'delivery') return 'DELIVERY';
  return 'CUSTOMER_RECEIPT';
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function itemsSummary(items = []) {
  if (!items.length) return '—';
  const first = items[0]?.name ?? 'Item';
  if (items.length === 1) return `${items[0].quantity}x ${first}`;
  return `${items[0].quantity}x ${first} +${items.length - 1} more`;
}

function formatPayment(method, status) {
  const m = method ? String(method).replace(/_/g, ' ') : '—';
  const s = status ? ` · ${status}` : '';
  return `${m}${s}`;
}

export default function Orders() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    needsRider: 0,
    riderShared: 0,
    active: 0,
  });

  const [status, setStatus] = useState(searchParams.get('status') ?? 'pending');
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [slipModal, setSlipModal] = useState(null);

  const prevPendingRef = useRef(null);
  const { refreshKey } = useOutletContext() || {};

  const buildApiFilters = useCallback(() => {
    const filters = { channel: 'ONLINE' };
    if (status) filters.status = status;
    if (search.trim()) filters.search = search.trim();

    if (datePreset === 'today') {
      filters.from = startOfToday().toISOString();
      filters.to = endOfToday().toISOString();
    } else if (datePreset === 'custom') {
      if (dateFrom) filters.from = new Date(dateFrom).toISOString();
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filters.to = end.toISOString();
      }
    }

    return filters;
  }, [status, search, datePreset, dateFrom, dateTo]);

  const loadStats = useCallback(async () => {
    try {
      const all = await orderService.getAll({ channel: 'ONLINE' });
      setStats({
        pending: all.filter((o) => o.status === 'pending').length,
        needsRider: all.filter(
          (o) => o.status === 'confirmed' && !o.riderSharedWithCustomer,
        ).length,
        riderShared: all.filter((o) => o.riderSharedWithCustomer).length,
        active: all.filter((o) => !['delivered', 'cancelled'].includes(o.status))
          .length,
      });
    } catch {
      /* silent */
    }
  }, []);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await orderService.getAll(buildApiFilters());
        setOrders(data);
        loadStats();
      } catch {
        toast.error('Failed to load online orders');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildApiFilters, loadStats],
  );

  const loadRiders = useCallback(async () => {
    try {
      const data = await riderService.getAll({ active: true });
      setRiders(data);
    } catch {
      /* silent */
    }
  }, []);

  const pollPending = useCallback(async () => {
    try {
      const pending = await orderService.pollPendingOnline();
      const count = pending.length;

      if (prevPendingRef.current != null && count > prevPendingRef.current) {
        const diff = count - prevPendingRef.current;
        toast.success(
          diff === 1
            ? 'New online order request!'
            : `${diff} new online order requests!`,
          { duration: 5000 },
        );
        loadOrders(true);
      }

      prevPendingRef.current = count;
    } catch {
      /* silent poll */
    }
  }, [loadOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (refreshKey) loadOrders(true);
  }, [refreshKey, loadOrders]);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  useEffect(() => {
    pollPending();
    const interval = setInterval(pollPending, 8000);
    return () => clearInterval(interval);
  }, [pollPending]);

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus != null && urlStatus !== status) {
      setStatus(urlStatus);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (status) params.set('status', status);
    else params.delete('status');
    setSearchParams(params, { replace: true });
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableRiders = useMemo(
    () => riders.filter((r) => r.active && (r.status === 'available' || r.id === selectedOrder?.riderId)),
    [riders, selectedOrder?.riderId],
  );

  const openDetail = async (order) => {
    try {
      const fresh = await orderService.getById(order.id);
      setSelectedOrder(fresh);
      setSelectedRiderId(fresh.riderId ?? '');
      setDetailOpen(true);
    } catch {
      toast.error('Failed to load order details');
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedOrder(null);
    setSelectedRiderId('');
  };

  const refreshSelected = async (id) => {
    const fresh = await orderService.getById(id);
    setSelectedOrder(fresh);
    setSelectedRiderId(fresh.riderId ?? '');
    await loadOrders(true);
    await loadRiders();
    return fresh;
  };

  const runAction = async (fn, successMsg = 'Order updated') => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await fn();
      await refreshSelected(selectedOrder.id);
      toast.success(successMsg);
    } catch (err) {
      toast.error(err.message ?? 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = () =>
    runAction(
      () => orderService.accept(selectedOrder.id, { by: user?.name ?? 'Admin' }),
      'Order accepted — share a rider with the customer next',
    );

  const handleReject = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await orderService.reject(selectedOrder.id, rejectReason, {
        by: user?.name ?? 'Admin',
      });
      setRejectOpen(false);
      setRejectReason('');
      await refreshSelected(selectedOrder.id);
      toast.success('Order rejected');
    } catch (err) {
      toast.error(err.message ?? 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatus = (nextStatus, msg) =>
    runAction(
      () =>
        orderService.updateStatus(selectedOrder.id, nextStatus, {
          by: user?.name ?? 'Admin',
        }),
      msg,
    );

  const handleShareRider = async () => {
    if (!selectedOrder || !selectedRiderId) {
      toast.error('Select a rider to share with the customer');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await orderService.assignRider(
        selectedOrder.id,
        selectedRiderId,
        { by: user?.name ?? 'Admin' },
      );
      await refreshSelected(selectedOrder.id);
      toast.success(
        `Rider ${updated.rider?.name} shared with customer (${updated.rider?.phone})`,
      );
    } catch (err) {
      toast.error(err.message ?? 'Failed to share rider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSlip = async (slipType) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const slip = await slipService.generate(selectedOrder.id, slipType);
      const fresh = await refreshSelected(selectedOrder.id);
      setSlipModal({
        order: {
          ...fresh,
          riderName: fresh.rider?.name,
          riderPhone: fresh.rider?.phone,
          deliveryAddress: fresh.customer?.address,
        },
        slipType: mapSlipType(slip.slipType),
      });
      toast.success('Slip generated');
    } catch (err) {
      toast.error(err.message ?? 'Failed to generate slip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReprintSlip = async () => {
    if (!selectedOrder?.slip?.id) return;
    setActionLoading(true);
    try {
      const slip = await slipService.reprint(selectedOrder.slip.id);
      const fresh = await refreshSelected(selectedOrder.id);
      setSlipModal({
        order: {
          ...fresh,
          riderName: fresh.rider?.name,
          riderPhone: fresh.rider?.phone,
          deliveryAddress: fresh.customer?.address,
        },
        slipType: mapSlipType(slip.slipType),
      });
      toast.success('Slip ready for reprint');
    } catch (err) {
      toast.error(err.message ?? 'Failed to reprint slip');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'orderNumber',
        label: 'Order',
        sortable: true,
        render: (_, row) => (
          <div className="orders-order-cell">
            <span className="orders-order-num">{row.orderNumber}</span>
            {row.status === 'pending' && (
              <span className="orders-new-pill">
                <Bell size={11} /> New
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'customer',
        label: 'Customer',
        render: (_, row) => (
          <div className="orders-customer-cell">
            <span>{row.customer?.name ?? 'Guest'}</span>
            {row.customer?.phone && (
              <span className="orders-customer-phone">{row.customer.phone}</span>
            )}
          </div>
        ),
      },
      {
        key: 'address',
        label: 'Delivery address',
        render: (_, row) => (
          <span className="orders-address" title={row.customer?.address}>
            {truncate(row.customer?.address || '—', 40)}
          </span>
        ),
      },
      {
        key: 'items',
        label: 'Items',
        render: (_, row) => (
          <span className="orders-items-summary" title={itemsSummary(row.items)}>
            {truncate(itemsSummary(row.items), 32)}
          </span>
        ),
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        render: (_, row) => (
          <span className="orders-total">{formatPKR(row.total)}</span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Requested',
        sortable: true,
        render: (_, row) => formatDateTime(row.createdAt),
      },
      {
        key: 'status',
        label: 'Status',
        render: (_, row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'rider',
        label: 'Rider (customer sees)',
        render: (_, row) => {
          if (!row.riderSharedWithCustomer || !row.rider) {
            return <span className="orders-rider-missing">Not shared</span>;
          }
          return (
            <div className="orders-rider-cell">
              <span className="orders-rider-name">{row.rider.name}</span>
              <span className="orders-rider-phone">{row.rider.phone}</span>
            </div>
          );
        },
      },
      {
        key: 'actions',
        label: '',
        render: (_, row) => (
          <button
            type="button"
            className="btn btn-ghost btn-sm orders-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(row);
            }}
          >
            <Eye size={15} />
            Manage
          </button>
        ),
      },
    ],
    [],
  );

  const renderDetailActions = () => {
    if (!selectedOrder) return null;
    const o = selectedOrder;
    const disabled = actionLoading;

    return (
      <div className="orders-detail-actions">
        {o.status === 'pending' && (
          <>
            <button type="button" className="btn btn-primary" disabled={disabled} onClick={handleAccept}>
              <Check size={16} /> Accept order
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={disabled}
              onClick={() => setRejectOpen(true)}
            >
              <X size={16} /> Reject
            </button>
          </>
        )}

        {o.status === 'confirmed' && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={disabled}
            onClick={() => handleStatus('preparing', 'Marked as preparing')}
          >
            <ChefHat size={16} /> Mark preparing
          </button>
        )}

        {['rider_assigned', 'preparing'].includes(o.status) && o.riderSharedWithCustomer && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => handleStatus('out_for_delivery', 'Marked out for delivery')}
          >
            <Truck size={16} /> Out for delivery
          </button>
        )}

        {o.status === 'out_for_delivery' && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => handleStatus('delivered', 'Order delivered')}
          >
            <PackageCheck size={16} /> Mark delivered
          </button>
        )}

        {o.status === 'confirmed' && (
          <button
            type="button"
            className="btn btn-danger"
            disabled={disabled}
            onClick={() => setRejectOpen(true)}
          >
            <X size={16} /> Cancel
          </button>
        )}

        {o.status !== 'cancelled' && o.status !== 'pending' && (
          <div className="orders-slip-actions">
            {o.slip ? (
              <button type="button" className="btn btn-secondary btn-sm" disabled={disabled} onClick={handleReprintSlip}>
                <Printer size={15} /> Reprint slip
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary btn-sm" disabled={disabled} onClick={() => handleGenerateSlip('kitchen')}>
                  <FileText size={15} /> Kitchen slip
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={disabled} onClick={() => handleGenerateSlip('delivery')}>
                  <Truck size={15} /> Delivery slip
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const canShareRider =
    selectedOrder &&
    ['confirmed', 'preparing', 'rider_assigned'].includes(selectedOrder.status);

  return (
    <div className="page orders-page">
      <div className="page-header">
        <div>
          <h1>Online Orders</h1>
          <p>
            Delivery requests from the website — accept them, then share the rider&apos;s name
            and contact with the customer
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'orders-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid-4 orders-stats animate-slide-up">
        <StatCard icon={Bell} label="New requests" value={stats.pending} accent="warning" />
        <StatCard icon={Share2} label="Need rider share" value={stats.needsRider} accent="copper" />
        <StatCard icon={Bike} label="Rider shared" value={stats.riderShared} accent="info" />
        <StatCard icon={Clock} label="Active online" value={stats.active} accent="success" />
      </div>

      <div className="panel orders-filters-panel animate-slide-up">
        <div className="tabs orders-pipeline-tabs">
          {PIPELINE_TABS.map(({ key, label }) => (
            <button
              key={key || 'all'}
              type="button"
              className={`tab ${status === key ? 'active' : ''}`}
              onClick={() => setStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filters-bar orders-filters-bar">
          <div className="search-input">
            <Search size={16} />
            <input
              type="search"
              className="form-control"
              placeholder="Order ID, customer name, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
          >
            {DATE_PRESETS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {datePreset === 'custom' && (
            <>
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      <div className="panel orders-table-panel animate-slide-up">
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          emptyMessage="No online orders in this view"
          onRowClick={openDetail}
          skeletonRows={8}
        />
      </div>

      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={selectedOrder ? `Order ${selectedOrder.orderNumber}` : 'Order details'}
        size="md"
        footer={renderDetailActions()}
      >
        {selectedOrder && (
          <div className="orders-detail">
            <div className="orders-detail-header">
              <span className="orders-online-tag">Online website</span>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {selectedOrder.status === 'pending' && (
              <div className="orders-alert orders-alert--warning">
                <Bell size={16} />
                New delivery request from the customer website. Accept to continue, then share a rider.
              </div>
            )}

            {selectedOrder.status === 'confirmed' && !selectedOrder.riderSharedWithCustomer && (
              <div className="orders-alert orders-alert--copper">
                <Share2 size={16} />
                Order accepted. Share rider name &amp; contact — customer will see it on the website.
              </div>
            )}

            {selectedOrder.riderSharedWithCustomer && selectedOrder.rider && (
              <div className="orders-alert orders-alert--success">
                <Bike size={16} />
                Rider shared with customer:&nbsp;
                <strong>{selectedOrder.rider.name}</strong>
                &nbsp;·&nbsp;
                <strong>{selectedOrder.rider.phone}</strong>
              </div>
            )}

            <div className="orders-detail-grid">
              <div className="orders-detail-section">
                <h4>Customer</h4>
                <p><strong>{selectedOrder.customer?.name ?? 'Guest'}</strong></p>
                {selectedOrder.customer?.phone && (
                  <p className="orders-detail-line">
                    <Phone size={14} /> {selectedOrder.customer.phone}
                  </p>
                )}
                {selectedOrder.customer?.address && (
                  <p className="orders-detail-line orders-detail-address">
                    <MapPin size={14} /> {selectedOrder.customer.address}
                  </p>
                )}
                {selectedOrder.notes && (
                  <p className="orders-detail-notes">Notes: {selectedOrder.notes}</p>
                )}
              </div>

              <div className="orders-detail-section">
                <h4>Payment</h4>
                <p>{formatPayment(selectedOrder.paymentMethod, selectedOrder.paymentStatus)}</p>
                <p className="orders-detail-total-line">
                  Total <strong>{formatPKR(selectedOrder.total)}</strong>
                </p>
                <p className="orders-muted">Requested {formatDateTime(selectedOrder.createdAt)}</p>
              </div>
            </div>

            {/* Rider share panel — core of this module */}
            {canShareRider && (
              <div className="orders-share-rider panel">
                <div className="orders-share-rider-head">
                  <h4>
                    <Share2 size={16} /> Share rider with customer
                  </h4>
                  <p>
                    Selected rider&apos;s <strong>name</strong> and <strong>phone</strong> will show
                    on the customer website for this order.
                  </p>
                </div>

                <div className="orders-share-rider-body">
                  {availableRiders.length === 0 ? (
                    <p className="orders-no-riders">
                      No available riders. Add or enable riders in the Riders page.
                    </p>
                  ) : (
                    <div className="orders-rider-options">
                      {availableRiders.map((r) => (
                        <label
                          key={r.id}
                          className={`orders-rider-option ${selectedRiderId === r.id ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="share-rider"
                            value={r.id}
                            checked={selectedRiderId === r.id}
                            onChange={() => setSelectedRiderId(r.id)}
                          />
                          <span className="orders-rider-option-main">
                            <span className="orders-rider-option-name">{r.name}</span>
                            <span className="orders-rider-option-phone">{r.phone}</span>
                          </span>
                          <span className="orders-rider-option-meta">
                            {r.vehicleNumber} · {r.status}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!selectedRiderId || actionLoading || availableRiders.length === 0}
                    onClick={handleShareRider}
                  >
                    <Share2 size={16} />
                    {selectedOrder.riderSharedWithCustomer
                      ? 'Update shared rider'
                      : 'Share rider with customer'}
                  </button>
                </div>
              </div>
            )}

            <div className="orders-detail-section">
              <h4>Items</h4>
              <ul className="orders-detail-items">
                {selectedOrder.items?.map((item, i) => (
                  <li key={item.menuItemId ?? i}>
                    <span className="orders-detail-item-qty">{item.quantity}x</span>
                    <span className="orders-detail-item-name">{item.name}</span>
                    <span className="orders-detail-item-price">
                      {formatPKR(item.subtotal ?? item.price * item.quantity)}
                    </span>
                    {item.notes && <span className="orders-detail-item-note">{item.notes}</span>}
                  </li>
                ))}
              </ul>
              <div className="orders-detail-totals">
                <div><span>Subtotal</span><span>{formatPKR(selectedOrder.subtotal)}</span></div>
                {selectedOrder.deliveryFee > 0 && (
                  <div><span>Delivery</span><span>{formatPKR(selectedOrder.deliveryFee)}</span></div>
                )}
                {selectedOrder.tax > 0 && (
                  <div><span>Tax</span><span>{formatPKR(selectedOrder.tax)}</span></div>
                )}
                <div className="orders-detail-grand">
                  <span>Total</span><span>{formatPKR(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {selectedOrder.statusHistory?.length > 0 && (
              <div className="orders-detail-section">
                <h4>Timeline</h4>
                <ol className="orders-timeline">
                  {selectedOrder.statusHistory.map((entry, i) => (
                    <li key={i}>
                      <StatusBadge status={entry.status} />
                      <span className="orders-timeline-time">{formatDateTime(entry.at)}</span>
                      <span className="orders-timeline-by">by {entry.by}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        title="Reject order"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={actionLoading}
              onClick={handleReject}
            >
              Reject order
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="reject-reason">Reason (optional)</label>
          <textarea
            id="reject-reason"
            className="form-control"
            rows={3}
            placeholder="e.g. Outside delivery area, item unavailable…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(slipModal)}
        onClose={() => setSlipModal(null)}
        title="Slip preview"
        size="lg"
      >
        {slipModal && (
          <SlipPreview
            order={slipModal.order}
            slipType={slipModal.slipType}
            settings={settingsForSlip(settings)}
          />
        )}
      </Modal>
    </div>
  );
}
