import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  Package,
  Users,
  Layers,
  Lock,
  TrendingUp,
  CreditCard,
  Target,
  Wallet,
  Box,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays, parseISO } from 'date-fns';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import SalesChart from '../components/charts/SalesChart';
import Skeleton from '../components/ui/Skeleton';
import * as salesService from '../services/salesService';
import { formatPKR, formatDate } from '../utils/format';
import './Reports.css';

const PERIODS = [
  { key: 'daily', label: 'Today', days: 1 },
  { key: 'weekly', label: 'Last 7 Days', days: 7 },
  { key: 'monthly', label: 'Last 30 Days', days: 30 },
];

const REPORT_TABS = [
  { key: 'sales', label: 'Sales', icon: DollarSign, ready: true },
  { key: 'products', label: 'Products', icon: Box, ready: true },
  { key: 'customers', label: 'Customers', icon: Users, ready: false },
  { key: 'inventory', label: 'Inventory', icon: Layers, ready: false },
  { key: 'daily-closing', label: 'Daily Closing', icon: Wallet, ready: false },
  { key: 'udhaar', label: 'Udhaar / Credit', icon: CreditCard, ready: false },
  { key: 'payables', label: 'Supplier Payables', icon: CreditCard, ready: false },
  { key: 'profit', label: 'Profit / Products', icon: Target, ready: false },
];

function getDefaultDates(rangeKey) {
  const period = PERIODS.find((p) => p.key === rangeKey) || PERIODS[1];
  const today = new Date();
  return {
    from: format(subDays(today, period.days - 1), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  };
}

function formatChartLabel(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d');
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
  const [activeTab, setActiveTab] = useState('products');
  const [range, setRange] = useState('weekly');
  const [dateFrom, setDateFrom] = useState(() => getDefaultDates('weekly').from);
  const [dateTo, setDateTo] = useState(() => getDefaultDates('weekly').to);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byItem, setByItem] = useState([]);
  const [byCategory, setByCategory] = useState([]);

  const params = useMemo(
    () => ({ range, from: dateFrom, to: dateTo, channel: 'ALL' }),
    [range, dateFrom, dateTo],
  );

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
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
      setLoading(false);
      setRefreshing(false);
    }
  }, [params]);

  useEffect(() => {
    loadReports({ silent: Boolean(refreshKey) });
  }, [loadReports, refreshKey]);

  const handlePeriodChange = (key) => {
    setRange(key);
    const dates = getDefaultDates(key);
    setDateFrom(dates.from);
    setDateTo(dates.to);
  };

  const productMetrics = useMemo(() => {
    const unitsSold = byItem.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
    const revenue = byItem.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
    const avgUnit = unitsSold ? Math.round(revenue / unitsSold) : 0;
    return {
      revenue: summary?.totalRevenue ?? revenue,
      unitsSold,
      categories: byCategory.length,
      avgUnit,
    };
  }, [byItem, byCategory, summary]);

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

  const topProducts = useMemo(() => byItem.slice(0, 8), [byItem]);

  const itemColumns = useMemo(
    () => [
      { key: 'name', label: 'Product', sortable: true },
      { key: 'quantity', label: 'Units', sortable: true },
      {
        key: 'revenue',
        label: 'Revenue',
        sortable: true,
        export: (r) => r.revenue,
        render: (_, r) => formatPKR(r.revenue),
      },
    ],
    [],
  );

  const categoryColumns = useMemo(
    () => [
      { key: 'name', label: 'Category', sortable: true },
      { key: 'orders', label: 'Orders', sortable: true },
      {
        key: 'revenue',
        label: 'Revenue',
        sortable: true,
        export: (r) => r.revenue,
        render: (_, r) => formatPKR(r.revenue),
      },
      {
        key: 'percentage',
        label: 'Share',
        sortable: true,
        render: (val) => `${val ?? 0}%`,
      },
    ],
    [],
  );

  const dayColumns = useMemo(
    () => [
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        export: (r) => r.date,
        render: (_, r) => formatDate(r.date),
      },
      { key: 'orders', label: 'Orders', sortable: true },
      {
        key: 'revenue',
        label: 'Revenue',
        sortable: true,
        export: (r) => r.revenue,
        render: (_, r) => formatPKR(r.revenue),
      },
    ],
    [],
  );

  const handleExport = () => {
    if (activeTab === 'products') {
      if (!byItem.length) {
        toast.error('No data to export');
        return;
      }
      downloadCSV(`products-${dateFrom}-to-${dateTo}.csv`, byItem, itemColumns);
      toast.success('Products report exported');
      return;
    }
    if (activeTab === 'sales') {
      if (!byDay.length) {
        toast.error('No data to export');
        return;
      }
      downloadCSV(`sales-${dateFrom}-to-${dateTo}.csv`, byDay, dayColumns);
      toast.success('Sales report exported');
      return;
    }
    toast.error('Export is not available for this report yet');
  };

  const currentTab = REPORT_TABS.find((tab) => tab.key === activeTab) || REPORT_TABS[1];
  const periodLabel = PERIODS.find((p) => p.key === range)?.label || 'Last 7 Days';

  return (
    <div className="page reports-page">
      <div className="page-header reports-header">
        <div className="reports-title-block">
          <BarChart3 size={26} strokeWidth={1.75} className="reports-title-icon" />
          <div>
            <h1>Reports & Analytics</h1>
            <p>Comprehensive business insights and performance metrics</p>
          </div>
        </div>
        <div className="reports-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadReports({ silent: true })}
            disabled={refreshing || loading}
          >
            <RefreshCw size={16} className={refreshing ? 'reports-spin' : ''} />
            Refresh
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="reports-tabs animate-slide-up">
        {REPORT_TABS.map(({ key, label, icon: Icon, ready }) => (
          <button
            key={key}
            type="button"
            className={`reports-tab ${activeTab === key ? 'active' : ''} ${!ready ? 'reports-tab--locked' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} strokeWidth={2} />
            <span>{label}</span>
            {!ready && <Lock size={12} strokeWidth={2.25} />}
          </button>
        ))}
      </div>

      <div className="reports-period-bar animate-slide-up">
        <span className="reports-period-label">Period</span>
        <div className="reports-period-controls">
          <div className="reports-period-pills">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`reports-period-pill ${range === key ? 'active' : ''}`}
                onClick={() => handlePeriodChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
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
        </div>
      </div>

      {!currentTab.ready ? (
        <div className="panel reports-locked animate-slide-up">
          <Lock size={28} strokeWidth={1.5} />
          <h3>{currentTab.label}</h3>
          <p>This report module is coming soon. Sales and Products reports are available now.</p>
        </div>
      ) : activeTab === 'products' ? (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="reports-stat-skeleton panel">
                  <Skeleton height={20} width="50%" />
                  <Skeleton height={32} width="70%" />
                  <Skeleton height={14} width="40%" />
                </div>
              ))
            ) : (
              <>
                <StatCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={formatPKR(productMetrics.revenue)}
                  subValue="Product revenue"
                  accent="success"
                />
                <StatCard
                  icon={Package}
                  label="Units Sold"
                  value={productMetrics.unitsSold}
                  subValue="Total quantity"
                  accent="info"
                />
                <StatCard
                  icon={Layers}
                  label="Categories"
                  value={productMetrics.categories}
                  subValue="Active categories"
                  accent="copper"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Unit Price"
                  value={formatPKR(productMetrics.avgUnit)}
                  subValue="Per unit"
                  accent="warning"
                />
              </>
            )}
          </div>

          <div className="reports-panels grid-2 animate-slide-up">
            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <BarChart3 size={16} />
                <h3>Category Distribution</h3>
              </div>
              {loading ? (
                <Skeleton height={220} />
              ) : byCategory.length === 0 ? (
                <p className="reports-empty">No category sales in {periodLabel.toLowerCase()}</p>
              ) : (
                <div className="reports-distribution">
                  {byCategory.slice(0, 6).map((cat) => (
                    <div key={cat.categoryId || cat.name} className="reports-distribution-row">
                      <div className="reports-distribution-meta">
                        <span>{cat.name}</span>
                        <strong>{cat.percentage ?? 0}%</strong>
                      </div>
                      <div className="reports-distribution-track">
                        <span
                          className="reports-distribution-fill"
                          style={{ width: `${Math.min(100, Number(cat.percentage) || 0)}%` }}
                        />
                      </div>
                      <span className="reports-distribution-value">{formatPKR(cat.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <Package size={16} />
                <h3>Top Products</h3>
              </div>
              {loading ? (
                <Skeleton height={220} />
              ) : topProducts.length === 0 ? (
                <p className="reports-empty">No product sales in {periodLabel.toLowerCase()}</p>
              ) : (
                <DataTable
                  columns={itemColumns}
                  data={topProducts}
                  loading={false}
                  skeletonRows={5}
                />
              )}
            </div>
          </div>

          <div className="panel reports-section animate-slide-up">
            <div className="reports-section-header">
              <h3 className="panel-title">All Products</h3>
            </div>
            <DataTable columns={itemColumns} data={byItem} loading={loading} skeletonRows={8} />
          </div>
        </>
      ) : (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="reports-stat-skeleton panel">
                  <Skeleton height={20} width="50%" />
                  <Skeleton height={32} width="70%" />
                  <Skeleton height={14} width="40%" />
                </div>
              ))
            ) : (
              <>
                <StatCard
                  icon={DollarSign}
                  label="Gross Sales"
                  value={formatPKR(summary?.totalRevenue ?? 0)}
                  subValue={`${formatDate(dateFrom)} – ${formatDate(dateTo)}`}
                  accent="success"
                />
                <StatCard
                  icon={Package}
                  label="Orders"
                  value={summary?.totalOrders ?? 0}
                  subValue={periodLabel}
                  accent="info"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Average Order"
                  value={formatPKR(summary?.averageOrderValue ?? 0)}
                  subValue="Per completed order"
                  accent="copper"
                />
                <StatCard
                  icon={Users}
                  label="Cancelled"
                  value={summary?.cancelledOrders ?? 0}
                  subValue="Cancelled orders"
                  accent="danger"
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
              <SalesChart data={chartData} title={`Sales Trend · ${periodLabel}`} />
            )}
          </div>

          <div className="reports-panels grid-2 animate-slide-up">
            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <BarChart3 size={16} />
                <h3>Category Distribution</h3>
              </div>
              <DataTable
                columns={categoryColumns}
                data={byCategory}
                loading={loading}
                skeletonRows={5}
              />
            </div>
            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <Calendar size={16} />
                <h3>Sales by Day</h3>
              </div>
              <DataTable columns={dayColumns} data={byDay} loading={loading} skeletonRows={5} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
