import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Printer, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ChannelBadge from '../components/ui/ChannelBadge';
import SlipPreview from '../components/slips/SlipPreview';
import { useSettings } from '../context/SettingsContext';
import * as slipService from '../services/slipService';
import * as orderService from '../services/orderService';
import { formatDateTime } from '../utils/format';
import './Slips.css';

const CHANNEL_OPTIONS = [
  { key: '', label: 'All channels' },
  { key: 'ONLINE', label: 'Online' },
  { key: 'IN_RESTAURANT', label: 'In-restaurant' },
];

const TYPE_OPTIONS = [
  { key: '', label: 'All types' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'receipt', label: 'Receipt' },
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

function formatSlipType(type) {
  const t = String(type ?? '').toLowerCase();
  if (t === 'kitchen') return 'Kitchen';
  if (t === 'delivery') return 'Delivery';
  if (t === 'receipt') return 'Receipt';
  return type ?? '—';
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

export default function Slips() {
  const { settings } = useSettings();

  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [channel, setChannel] = useState('');
  const [slipType, setSlipType] = useState('');
  const [datePreset, setDatePreset] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [previewSlipType, setPreviewSlipType] = useState('KITCHEN');
  const [previewLoading, setPreviewLoading] = useState(false);

  const buildFilters = useCallback(() => {
    const filters = {};
    if (slipType) filters.slipType = slipType;

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
  }, [slipType, datePreset, dateFrom, dateTo]);

  const loadSlips = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await slipService.getAll(buildFilters());
        setSlips(data);
      } catch {
        toast.error('Failed to load slips');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildFilters],
  );

  useEffect(() => {
    loadSlips();
  }, [loadSlips]);

  const filteredSlips = useMemo(() => {
    let list = [...slips];

    if (channel) {
      list = list.filter((s) => s.channel === channel);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.id?.toLowerCase().includes(q) ||
          s.orderId?.toLowerCase().includes(q) ||
          s.orderNumber?.toLowerCase().includes(q) ||
          s.customerName?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [slips, channel, search]);

  const openPreview = async (slip, reprint = false) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewSlipType(mapSlipType(slip.slipType));

    try {
      let order;
      if (reprint) {
        const updated = await slipService.reprint(slip.id);
        order = await orderService.getById(updated.orderId);
        toast.success('Slip reprinted');
        await loadSlips(true);
      } else {
        order = await orderService.getById(slip.orderId);
      }

      setPreviewOrder({
        ...order,
        deliveryAddress: order.customer?.address,
      });
    } catch (err) {
      toast.error(err.message ?? 'Failed to load slip');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Slip #',
        sortable: true,
        render: (_, row) => (
          <span className="slips-slip-no">{row.id}</span>
        ),
      },
      {
        key: 'orderNumber',
        label: 'Order',
        sortable: true,
        render: (_, row) => row.orderNumber ?? row.orderId,
      },
      {
        key: 'slipType',
        label: 'Type',
        render: (_, row) => (
          <span className={`slips-type slips-type--${row.slipType}`}>
            {formatSlipType(row.slipType)}
          </span>
        ),
      },
      {
        key: 'channel',
        label: 'Channel',
        render: (_, row) => (
          <ChannelBadge channel={row.channel} orderType={row.orderType} />
        ),
      },
      {
        key: 'customerName',
        label: 'Customer',
        render: (_, row) => row.customerName ?? '—',
      },
      {
        key: 'createdAt',
        label: 'Generated',
        sortable: true,
        render: (_, row) => formatDateTime(row.printedAt ?? row.createdAt),
      },
      {
        key: 'reprintCount',
        label: 'Reprints',
        sortable: true,
        render: (_, row) => row.reprintCount ?? 0,
      },
      {
        key: 'actions',
        label: '',
        render: (_, row) => (
          <div className="slips-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                openPreview(row, false);
              }}
            >
              <Eye size={15} />
              View
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                openPreview(row, true);
              }}
            >
              <Printer size={15} />
              Reprint
            </button>
          </div>
        ),
      },
    ],
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="page slips-page">
      <div className="page-header">
        <div>
          <h1>Slips / Receipts</h1>
          <p>View and reprint order slips and receipts</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadSlips(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'slips-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="panel slips-filters animate-slide-up">
        <div className="filters-bar">
          <div className="search-input">
            <Search size={16} />
            <input
              type="search"
              className="form-control"
              placeholder="Search slip #, order ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            {CHANNEL_OPTIONS.map(({ key, label }) => (
              <option key={key || 'all-ch'} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={slipType}
            onChange={(e) => setSlipType(e.target.value)}
          >
            {TYPE_OPTIONS.map(({ key, label }) => (
              <option key={key || 'all-type'} value={key}>
                {label}
              </option>
            ))}
          </select>

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

      <div className="panel slips-table-panel animate-slide-up">
        <DataTable
          columns={columns}
          data={filteredSlips}
          loading={loading}
          emptyMessage="No slips found for selected filters"
          skeletonRows={6}
        />
      </div>

      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewOrder(null);
        }}
        title="Slip preview"
        size="lg"
      >
        {previewLoading ? (
          <div className="slips-preview-loading">Loading slip…</div>
        ) : previewOrder ? (
          <SlipPreview
            order={previewOrder}
            slipType={previewSlipType}
            settings={settingsForSlip(settings)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
