import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Banknote,
  ShoppingBag,
  TrendingUp,
  XCircle,
  Globe,
  UtensilsCrossed,
  Download,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays, parseISO } from 'date-fns';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import SalesChart from '../components/charts/SalesChart';
import ChannelBadge from '../components/ui/ChannelBadge';
import Skeleton from '../components/ui/Skeleton';
import * as salesService from '../services/salesService';
import { formatPKR, formatDate } from '../utils/format';
import './Reports.css';

const RANGES = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const CHANNELS = [
  { value: 'ALL', label: 'All Channels' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'IN_RESTAURANT', label: 'In-Restaurant' },
];

const SUBTYPES = [
  { value: 'ALL', label: 'All subtypes' },
  { value: 'DINE_IN', label: 'Dine-in' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
];

const PAYMENT_METHODS = [
  { value: 'ALL', label: 'All payments' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
];

function getDefaultDates(range) {
  const today = new Date();
  const days = range === 'monthly' ? 30 : range === 'weekly' ? 7 : 1;
  return {
    from: format(subDays(today, days - 1), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  };
}

function formatChartLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    return format(d, 'MMM d');
  } catch {
    return dateStr;
  }
}

function downloadCSV(filename, rows, columns) {
  const escape = (val) => {
    const str = val == null ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escape(c.export ? c.export(row) : row[c.key])).join(','))
    .join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { refreshKey } = useOutletContext() || {};
  const [range, setRange] = useState('weekly');
  const [dateFrom, setDateFrom] = useState(() => getDefaultDates('weekly').from);
  const [dateTo, setDateTo] = useState(() => getDefaultDates('weekly').to);
  const [channel, setChannel] = useState('ALL');
  const [subtype, setSubtype] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byItem, setByItem] = useState([]);
  const [byCategory, setByCategory] = useState([]);

  const params = useMemo(
    () => ({ range, channel, from: dateFrom, to: dateTo, subtype, paymentMethod }),
    [range, channel, dateFrom, dateTo, subtype, paymentMethod],
  );

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [summaryData, dayData, itemData, categoryData] = await Promise.all([
        salesService.getSummary(params),
        salesService.getByDay(params),
        salesService.getByItem(params),
        salesService.getByCategory(params),
      ]);

      const adjusted = {
        ...summaryData,
        cancelledOrders: summaryData.cancelledOrders ?? 0,
      };

      if (adjusted.totalOrders && !adjusted.averageOrderValue) {
        adjusted.averageOrderValue = Math.round(adjusted.totalRevenue / adjusted.totalOrders);
      }

      setSummary(adjusted);
      setByDay(dayData);
      setByItem(itemData);
      setByCategory(categoryData);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadReports({ silent: Boolean(refreshKey) });
  }, [loadReports, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => loadReports({ silent: true }), 30000);
    return () => clearInterval(interval);
  }, [loadReports]);

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    const dates = getDefaultDates(newRange);
    setDateFrom(dates.from);
    setDateTo(dates.to);
  };

  const chartData = useMemo(
    () =>
      byDay.map((row) => ({
        label: formatChartLabel(row.date),
        sales: row.revenue,
        onlineSales: row.online,
        inRestaurantSales: row.inRestaurant,
      })),
    [byDay],
  );

  const channelRows = useMemo(() => {
    if (!summary?.channels) return [];
    return Object.entries(summary.channels).map(([key, data]) => ({
      id: key,
      channel: key,
      orders: data.orders,
      revenue: data.revenue,
      percentage: data.percentage,
      aov: Math.round(data.revenue / Math.max(data.orders, 1)),
    }));
  }, [summary]);

  const onlineChannel = summary?.channels?.ONLINE;
  const inRestChannel = summary?.channels?.IN_RESTAURANT;

  const dayColumns = useMemo(
    () => [
      { key: 'date', label: 'Date', sortable: true, export: (r) => r.date, render: (_, r) => formatDate(r.date) },
      { key: 'orders', label: 'Orders', sortable: true },
      { key: 'revenue', label: 'Revenue', sortable: true, export: (r) => r.revenue, render: (_, r) => formatPKR(r.revenue) },
      { key: 'online', label: 'Online', sortable: true, export: (r) => r.online, render: (_, r) => formatPKR(r.online) },
      { key: 'inRestaurant', label: 'In-Restaurant', sortable: true, export: (r) => r.inRestaurant, render: (_, r) => formatPKR(r.inRestaurant) },
    ],
    [],
  );

  const itemColumns = useMemo(
    () => [
      { key: 'name', label: 'Item', sortable: true },
      { key: 'quantity', label: 'Qty Sold', sortable: true },
      { key: 'revenue', label: 'Revenue', sortable: true, export: (r) => r.revenue, render: (_, r) => formatPKR(r.revenue) },
    ],
    [],
  );

  const categoryColumns = useMemo(
    () => [
      { key: 'name', label: 'Category', sortable: true },
      { key: 'orders', label: 'Orders', sortable: true },
      { key: 'revenue', label: 'Revenue', sortable: true, export: (r) => r.revenue, render: (_, r) => formatPKR(r.revenue) },
      { key: 'percentage', label: 'Share', sortable: true, render: (val) => `${val ?? 0}%` },
    ],
    [],
  );

  const channelColumns = useMemo(
    () => [
      {
        key: 'channel',
        label: 'Channel',
        render: (_, row) => (
          <ChannelBadge
            channel={row.channel}
            orderType={row.channel === 'IN_RESTAURANT' ? 'DINE_IN' : undefined}
          />
        ),
        export: (r) => r.channel,
      },
      { key: 'orders', label: 'Orders', sortable: true },
      { key: 'revenue', label: 'Revenue', sortable: true, export: (r) => r.revenue, render: (_, r) => formatPKR(r.revenue) },
      { key: 'aov', label: 'AOV', sortable: true, export: (r) => r.aov, render: (_, r) => formatPKR(r.aov) },
      { key: 'percentage', label: 'Share', sortable: true, render: (val) => `${val ?? 0}%` },
    ],
    [],
  );

  const exportTable = (name, rows, columns) => {
    if (!rows.length) {
      toast.error('No data to export');
      return;
    }
    downloadCSV(`your-kitchen-${name}-${range}-${dateFrom}-to-${dateTo}.csv`, rows, columns);
    toast.success(`${name} exported`);
  };

  return (
    <div className="page reports-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Sales analytics, channel breakdown, and exports</p>
        </div>
        <div className="tabs reports-range-tabs">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`tab ${range === key ? 'active' : ''}`}
              onClick={() => handleRangeChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-bar reports-filters animate-slide-up">
        <div className="reports-date-group">
          <Calendar size={16} className="reports-date-icon" />
          <input
            type="date"
            className="form-control"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="reports-date-sep">to</span>
          <input
            type="date"
            className="form-control"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          {CHANNELS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={subtype}
          onChange={(e) => setSubtype(e.target.value)}
        >
          {SUBTYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          {PAYMENT_METHODS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-4 reports-stats animate-slide-up">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="reports-stat-skeleton panel">
              <Skeleton height={20} width="50%" />
              <Skeleton height={32} width="70%" />
              <Skeleton height={14} width="40%" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon={Banknote}
              label="Gross Sales"
              value={formatPKR(summary?.totalRevenue ?? 0)}
              subValue={`${formatDate(dateFrom)} – ${formatDate(dateTo)}`}
              accent="copper"
            />
            <StatCard
              icon={ShoppingBag}
              label="Order Count"
              value={summary?.totalOrders ?? 0}
              subValue={`${range.charAt(0).toUpperCase()}${range.slice(1)} period`}
              accent="copper"
            />
            <StatCard
              icon={TrendingUp}
              label="Average Order Value"
              value={formatPKR(summary?.averageOrderValue ?? 0)}
              subValue="Per completed order"
              accent="info"
            />
            <StatCard
              icon={XCircle}
              label="Cancelled Orders"
              value={summary?.cancelledOrders ?? 0}
              subValue={`${(((summary?.cancelledOrders ?? 0) / Math.max(summary?.totalOrders ?? 1, 1)) * 100).toFixed(1)}% of total`}
              accent="danger"
            />
            <StatCard
              icon={Globe}
              label="Online Sales"
              value={formatPKR(onlineChannel?.revenue ?? 0)}
              subValue={`${onlineChannel?.orders ?? 0} orders · ${onlineChannel?.percentage ?? 0}%`}
              accent="info"
            />
            <StatCard
              icon={UtensilsCrossed}
              label="Walk-in / In-Restaurant"
              value={formatPKR(inRestChannel?.revenue ?? 0)}
              subValue={`${inRestChannel?.orders ?? 0} orders · ${inRestChannel?.percentage ?? 0}%`}
              accent="success"
            />
          </>
        )}
      </div>

      <div className="reports-chart-wrap animate-slide-up">
        {loading ? (
          <div className="panel reports-chart-skeleton">
            <Skeleton height={24} width={200} />
            <Skeleton height={280} />
          </div>
        ) : (
          <SalesChart
            data={chartData}
            title={`Sales Trend · ${RANGES.find((r) => r.key === range)?.label}`}
          />
        )}
      </div>

      <div className="reports-tables animate-slide-up">
        <ReportSection
          title="Sales by Day"
          loading={loading}
          onExport={() => exportTable('sales-by-day', byDay, dayColumns)}
        >
          <DataTable columns={dayColumns} data={byDay} loading={loading} skeletonRows={7} />
        </ReportSection>

        <ReportSection
          title="Sales by Item"
          loading={loading}
          onExport={() => exportTable('sales-by-item', byItem, itemColumns)}
        >
          <DataTable columns={itemColumns} data={byItem} loading={loading} skeletonRows={8} />
        </ReportSection>

        <div className="grid-2">
          <ReportSection
            title="Sales by Category"
            loading={loading}
            onExport={() => exportTable('sales-by-category', byCategory, categoryColumns)}
          >
            <DataTable columns={categoryColumns} data={byCategory} loading={loading} skeletonRows={6} />
          </ReportSection>

          <ReportSection
            title="Sales by Channel"
            loading={loading}
            onExport={() => exportTable('sales-by-channel', channelRows, channelColumns)}
          >
            <DataTable columns={channelColumns} data={channelRows} loading={loading} skeletonRows={2} />
          </ReportSection>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ title, loading, onExport, children }) {
  return (
    <div className="panel reports-section">
      <div className="reports-section-header">
        <h3 className="panel-title">{title}</h3>
        <button
          type="button"
          className="btn btn-secondary btn-sm reports-export-btn"
          onClick={onExport}
          disabled={loading}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>
      {children}
    </div>
  );
}
