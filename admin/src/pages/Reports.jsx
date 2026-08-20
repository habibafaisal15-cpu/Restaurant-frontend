import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  Package,
  Users,
  Layers,
  TrendingUp,
  CreditCard,
  Target,
  Wallet,
  Box,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays, parseISO } from 'date-fns';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import SalesChart from '../components/charts/SalesChart';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import * as salesService from '../services/salesService';
import * as inventoryService from '../services/inventoryService';
import { formatPKR, formatDate, formatDateTime } from '../utils/format';
import './Reports.css';

const PERIODS = [
  { key: 'daily', label: 'Today', days: 1 },
  { key: 'weekly', label: 'Last 7 Days', days: 7 },
  { key: 'monthly', label: 'Last 30 Days', days: 30 },
];

const REPORT_TABS = [
  { key: 'sales', label: 'Sales', icon: DollarSign },
  { key: 'products', label: 'Products', icon: Box },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'inventory', label: 'Inventory', icon: Layers },
  { key: 'daily-closing', label: 'Daily Closing', icon: Wallet },
  { key: 'udhaar', label: 'Udhaar / Credit', icon: CreditCard },
  { key: 'payables', label: 'Supplier Payables', icon: CreditCard },
  { key: 'profit', label: 'Profit / Products', icon: Target },
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

const EMPTY_CLOSING = {
  grossSales: 0,
  discounts: 0,
  tax: 0,
  serviceCharge: 0,
  deliveryFees: 0,
  orderCount: 0,
  cancelledCount: 0,
  cancelledAmount: 0,
  openTabsCount: 0,
  openTabsAmount: 0,
  paymentMethods: {
    cash: { orders: 0, amount: 0 },
    card: { orders: 0, amount: 0 },
    online: { orders: 0, amount: 0 },
  },
  channels: {
    ONLINE: { orders: 0, amount: 0 },
    IN_RESTAURANT: { orders: 0, amount: 0 },
  },
};

const EMPTY_CREDIT = { totalOutstanding: 0, openTabs: 0, creditOrders: 0, rows: [] };
const EMPTY_PROFIT = { totals: { revenue: 0, cogs: 0, profit: 0, margin: 0 }, rows: [] };
const EMPTY_PAYABLES = { totalOpen: 0, count: 0, rows: [] };

export default function Reports() {
  const { refreshKey } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('sales');
  const [range, setRange] = useState('weekly');
  const [dateFrom, setDateFrom] = useState(() => getDefaultDates('weekly').from);
  const [dateTo, setDateTo] = useState(() => getDefaultDates('weekly').to);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byItem, setByItem] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [closing, setClosing] = useState(EMPTY_CLOSING);
  const [credit, setCredit] = useState(EMPTY_CREDIT);
  const [profit, setProfit] = useState(EMPTY_PROFIT);
  const [payables, setPayables] = useState(EMPTY_PAYABLES);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryMovements, setInventoryMovements] = useState([]);

  const [payableModalOpen, setPayableModalOpen] = useState(false);
  const [payableSaving, setPayableSaving] = useState(false);
  const [payableForm, setPayableForm] = useState({
    supplierName: '',
    amount: '',
    reference: '',
    dueDate: '',
    notes: '',
  });

  const params = useMemo(
    () => ({ range, from: dateFrom, to: dateTo, channel: 'ALL' }),
    [range, dateFrom, dateTo],
  );

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [
        summaryData,
        dayData,
        itemData,
        categoryData,
        customerData,
        closingData,
        creditData,
        profitData,
        payablesData,
        invSummary,
        invItems,
        invMovements,
      ] = await Promise.all([
        salesService.getSummary(params),
        salesService.getByDay(params),
        salesService.getByItem(params),
        salesService.getByCategory(params),
        salesService.getCustomers(params),
        salesService.getDailyClosing(params),
        salesService.getCredit(params),
        salesService.getProfit(params),
        salesService.getPayables(params),
        inventoryService.getSummary().catch(() => null),
        inventoryService.getAll().catch(() => []),
        inventoryService.getMovements({ limit: 12 }).catch(() => []),
      ]);

      const adjusted = {
        ...summaryData,
        cancelledOrders: summaryData.cancelledOrders ?? 0,
      };
      if (adjusted.totalOrders && !adjusted.averageOrderValue) {
        adjusted.averageOrderValue = Math.round(adjusted.totalRevenue / adjusted.totalOrders);
      }

      setSummary(adjusted);
      setByDay(dayData || []);
      setByItem(itemData || []);
      setByCategory(categoryData || []);
      setCustomers(customerData || []);
      setClosing(closingData || EMPTY_CLOSING);
      setCredit(creditData || EMPTY_CREDIT);
      setProfit(profitData || EMPTY_PROFIT);
      setPayables(payablesData || EMPTY_PAYABLES);
      setInventoryStats(invSummary);
      setInventoryItems(invItems || []);
      setInventoryMovements(invMovements || []);
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

  const lowStockItems = useMemo(
    () =>
      (inventoryItems || []).filter((item) =>
        ['low', 'out'].includes(String(item.stockStatus || '').toLowerCase()),
      ),
    [inventoryItems],
  );

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

  const customerColumns = useMemo(
    () => [
      { key: 'name', label: 'Customer', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true },
      { key: 'orders', label: 'Orders', sortable: true },
      {
        key: 'revenue',
        label: 'Spend',
        sortable: true,
        export: (r) => r.revenue,
        render: (_, r) => formatPKR(r.revenue),
      },
      {
        key: 'averageOrder',
        label: 'Avg order',
        sortable: true,
        export: (r) => r.averageOrder,
        render: (_, r) => formatPKR(r.averageOrder),
      },
      {
        key: 'lastOrderAt',
        label: 'Last order',
        sortable: true,
        export: (r) => r.lastOrderAt,
        render: (_, r) => (r.lastOrderAt ? formatDateTime(r.lastOrderAt) : '—'),
      },
    ],
    [],
  );

  const creditColumns = useMemo(
    () => [
      { key: 'orderNumber', label: 'Order', sortable: true },
      { key: 'customerName', label: 'Customer', sortable: true },
      {
        key: 'kind',
        label: 'Type',
        sortable: true,
        render: (val) => (val === 'open_tab' ? 'Open tab' : 'Udhaar'),
      },
      {
        key: 'tableNumber',
        label: 'Table',
        render: (val) => val || '—',
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        export: (r) => r.amount,
        render: (_, r) => formatPKR(r.amount),
      },
      {
        key: 'orderTime',
        label: 'Opened',
        sortable: true,
        export: (r) => r.orderTime,
        render: (_, r) => (r.orderTime ? formatDateTime(r.orderTime) : '—'),
      },
    ],
    [],
  );

  const profitColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Product',
        sortable: true,
        render: (_, r) => (
          <span>
            {r.name}
            {r.estimatedCost ? <em className="reports-est"> · est. cost</em> : null}
          </span>
        ),
      },
      { key: 'quantity', label: 'Units', sortable: true },
      {
        key: 'revenue',
        label: 'Revenue',
        sortable: true,
        export: (r) => r.revenue,
        render: (_, r) => formatPKR(r.revenue),
      },
      {
        key: 'cogs',
        label: 'COGS',
        sortable: true,
        export: (r) => r.cogs,
        render: (_, r) => formatPKR(r.cogs),
      },
      {
        key: 'profit',
        label: 'Profit',
        sortable: true,
        export: (r) => r.profit,
        render: (_, r) => formatPKR(r.profit),
      },
      {
        key: 'margin',
        label: 'Margin',
        sortable: true,
        render: (val) => `${val ?? 0}%`,
      },
    ],
    [],
  );

  const payableColumns = useMemo(
    () => [
      { key: 'supplierName', label: 'Supplier', sortable: true },
      { key: 'reference', label: 'Reference', render: (val) => val || '—' },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        export: (r) => r.amount,
        render: (_, r) => formatPKR(r.amount),
      },
      {
        key: 'paidAmount',
        label: 'Paid',
        sortable: true,
        export: (r) => r.paidAmount,
        render: (_, r) => formatPKR(r.paidAmount),
      },
      {
        key: 'balance',
        label: 'Balance',
        sortable: true,
        export: (r) => r.balance,
        render: (_, r) => formatPKR(r.balance),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (val) => <span className={`reports-pill reports-pill--${val}`}>{val}</span>,
      },
      {
        key: 'dueDate',
        label: 'Due',
        render: (val) => (val ? formatDate(val) : '—'),
      },
      {
        key: 'actions',
        label: '',
        render: (_, r) =>
          r.status === 'paid' ? null : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                try {
                  await salesService.settlePayable(r.id, { paidAmount: r.amount });
                  toast.success('Payable marked as paid');
                  loadReports({ silent: true });
                } catch (err) {
                  toast.error(err.message ?? 'Failed to settle payable');
                }
              }}
            >
              Mark paid
            </button>
          ),
      },
    ],
    [loadReports],
  );

  const inventoryColumns = useMemo(
    () => [
      { key: 'name', label: 'Item', sortable: true },
      { key: 'categoryName', label: 'Category', sortable: true },
      {
        key: 'stockQty',
        label: 'Qty',
        sortable: true,
        render: (_, r) => (r.trackStock ? r.stockQty : '—'),
      },
      {
        key: 'stockStatus',
        label: 'Status',
        sortable: true,
        render: (val) => <span className={`reports-pill reports-pill--${val}`}>{val}</span>,
      },
    ],
    [],
  );

  const handleExport = () => {
    const stamp = `${dateFrom}-to-${dateTo}`;
    if (activeTab === 'products') {
      if (!byItem.length) return toast.error('No data to export');
      downloadCSV(`products-${stamp}.csv`, byItem, itemColumns);
      return toast.success('Products report exported');
    }
    if (activeTab === 'sales') {
      if (!byDay.length) return toast.error('No data to export');
      downloadCSV(`sales-${stamp}.csv`, byDay, dayColumns);
      return toast.success('Sales report exported');
    }
    if (activeTab === 'customers') {
      if (!customers.length) return toast.error('No data to export');
      downloadCSV(`customers-${stamp}.csv`, customers, customerColumns);
      return toast.success('Customers report exported');
    }
    if (activeTab === 'udhaar') {
      if (!credit.rows?.length) return toast.error('No data to export');
      downloadCSV(`udhaar-${stamp}.csv`, credit.rows, creditColumns);
      return toast.success('Udhaar report exported');
    }
    if (activeTab === 'profit') {
      if (!profit.rows?.length) return toast.error('No data to export');
      downloadCSV(`profit-${stamp}.csv`, profit.rows, profitColumns);
      return toast.success('Profit report exported');
    }
    if (activeTab === 'payables') {
      if (!payables.rows?.length) return toast.error('No data to export');
      downloadCSV(`payables-${stamp}.csv`, payables.rows, payableColumns.filter((c) => c.key !== 'actions'));
      return toast.success('Payables report exported');
    }
    if (activeTab === 'daily-closing') {
      const rows = [
        { label: 'Gross sales', value: closing.grossSales },
        { label: 'Discounts', value: closing.discounts },
        { label: 'Tax', value: closing.tax },
        { label: 'Service charge', value: closing.serviceCharge },
        { label: 'Cash', value: closing.paymentMethods?.cash?.amount ?? 0 },
        { label: 'Card', value: closing.paymentMethods?.card?.amount ?? 0 },
        { label: 'Online', value: closing.paymentMethods?.online?.amount ?? 0 },
        { label: 'Open tabs', value: closing.openTabsAmount },
      ];
      downloadCSV(`daily-closing-${stamp}.csv`, rows, [
        { key: 'label', label: 'Metric' },
        { key: 'value', label: 'Amount' },
      ]);
      return toast.success('Daily closing exported');
    }
    if (activeTab === 'inventory') {
      if (!inventoryItems.length) return toast.error('No data to export');
      downloadCSV(`inventory-${stamp}.csv`, inventoryItems, inventoryColumns);
      return toast.success('Inventory report exported');
    }
    toast.error('Export is not available for this report yet');
  };

  const savePayable = async (e) => {
    e.preventDefault();
    setPayableSaving(true);
    try {
      await salesService.createPayable({
        supplierName: payableForm.supplierName.trim(),
        amount: Number(payableForm.amount),
        reference: payableForm.reference.trim() || undefined,
        dueDate: payableForm.dueDate || undefined,
        notes: payableForm.notes.trim() || undefined,
      });
      toast.success('Payable added');
      setPayableModalOpen(false);
      setPayableForm({
        supplierName: '',
        amount: '',
        reference: '',
        dueDate: '',
        notes: '',
      });
      loadReports({ silent: true });
    } catch (err) {
      toast.error(err.message ?? 'Failed to add payable');
    } finally {
      setPayableSaving(false);
    }
  };

  const periodLabel = PERIODS.find((p) => p.key === range)?.label || 'Last 7 Days';
  const payCash = closing.paymentMethods?.cash?.amount ?? 0;
  const payCard = closing.paymentMethods?.card?.amount ?? 0;
  const payOnline = closing.paymentMethods?.online?.amount ?? 0;

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
        {REPORT_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`reports-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} strokeWidth={2} />
            <span>{label}</span>
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

      {activeTab === 'sales' && (
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

      {activeTab === 'products' && (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="reports-stat-skeleton panel">
                  <Skeleton height={20} width="50%" />
                  <Skeleton height={32} width="70%" />
                </div>
              ))
            ) : (
              <>
                <StatCard icon={DollarSign} label="Total Revenue" value={formatPKR(productMetrics.revenue)} subValue="Product revenue" accent="success" />
                <StatCard icon={Package} label="Units Sold" value={productMetrics.unitsSold} subValue="Total quantity" accent="info" />
                <StatCard icon={Layers} label="Categories" value={productMetrics.categories} subValue="Active categories" accent="copper" />
                <StatCard icon={TrendingUp} label="Avg Unit Price" value={formatPKR(productMetrics.avgUnit)} subValue="Per unit" accent="warning" />
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
              <DataTable columns={itemColumns} data={topProducts} loading={loading} skeletonRows={5} />
            </div>
          </div>

          <div className="panel reports-section animate-slide-up">
            <div className="reports-section-header">
              <h3 className="panel-title">All Products</h3>
            </div>
            <DataTable columns={itemColumns} data={byItem} loading={loading} skeletonRows={8} />
          </div>
        </>
      )}

      {activeTab === 'customers' && (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            <StatCard icon={Users} label="Customers" value={customers.length} subValue={periodLabel} accent="info" />
            <StatCard
              icon={DollarSign}
              label="Customer spend"
              value={formatPKR(customers.reduce((s, c) => s + (c.revenue || 0), 0))}
              subValue="Completed sales"
              accent="success"
            />
            <StatCard
              icon={Package}
              label="Orders"
              value={customers.reduce((s, c) => s + (c.orders || 0), 0)}
              subValue="Across all customers"
              accent="copper"
            />
            <StatCard
              icon={TrendingUp}
              label="Top spender"
              value={customers[0] ? formatPKR(customers[0].revenue) : formatPKR(0)}
              subValue={customers[0]?.name || '—'}
              accent="warning"
            />
          </div>
          <div className="panel reports-section animate-slide-up">
            <div className="reports-section-header">
              <h3 className="panel-title">Customer ledger</h3>
            </div>
            <DataTable columns={customerColumns} data={customers} loading={loading} skeletonRows={8} />
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            <StatCard icon={Box} label="Items" value={inventoryStats?.totalItems ?? inventoryItems.length} subValue="Menu items" accent="info" />
            <StatCard icon={Layers} label="Tracked" value={inventoryStats?.trackedItems ?? 0} subValue="Stock tracking on" accent="copper" />
            <StatCard icon={AlertTriangle} label="Low stock" value={inventoryStats?.lowStock ?? lowStockItems.filter((i) => i.stockStatus === 'low').length} subValue="Below threshold" accent="warning" />
            <StatCard icon={Package} label="Out of stock" value={inventoryStats?.outOfStock ?? lowStockItems.filter((i) => i.stockStatus === 'out').length} subValue="Needs restock" accent="danger" />
          </div>
          <div className="reports-panels grid-2 animate-slide-up">
            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <AlertTriangle size={16} />
                <h3>Attention needed</h3>
              </div>
              <DataTable columns={inventoryColumns} data={lowStockItems} loading={loading} skeletonRows={5} />
            </div>
            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <RefreshCw size={16} />
                <h3>Recent movements</h3>
              </div>
              {inventoryMovements.length === 0 ? (
                <p className="reports-empty">No recent stock movements</p>
              ) : (
                <ul className="reports-movement-list">
                  {inventoryMovements.slice(0, 10).map((m) => (
                    <li key={m.id}>
                      <div>
                        <strong>{m.productName}</strong>
                        <span>{m.type} · {m.quantity}</span>
                      </div>
                      <em>{m.createdAt ? formatDateTime(m.createdAt) : ''}</em>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/inventory" className="btn btn-secondary" style={{ marginTop: '0.85rem', alignSelf: 'flex-start' }}>
                Open Inventory
              </Link>
            </div>
          </div>
        </>
      )}

      {activeTab === 'daily-closing' && (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            <StatCard icon={DollarSign} label="Gross sales" value={formatPKR(closing.grossSales)} subValue={periodLabel} accent="success" />
            <StatCard icon={Wallet} label="Cash collected" value={formatPKR(payCash)} subValue={`${closing.paymentMethods?.cash?.orders ?? 0} orders`} accent="copper" />
            <StatCard icon={CreditCard} label="Card + Online" value={formatPKR(payCard + payOnline)} subValue={`Card ${formatPKR(payCard)} · Online ${formatPKR(payOnline)}`} accent="info" />
            <StatCard icon={AlertTriangle} label="Open tabs" value={formatPKR(closing.openTabsAmount)} subValue={`${closing.openTabsCount} unpaid / draft`} accent="warning" />
          </div>
          <div className="reports-panels grid-2 animate-slide-up">
            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <Wallet size={16} />
                <h3>Closing summary</h3>
              </div>
              <div className="reports-kv">
                <div><span>Orders settled</span><strong>{closing.orderCount}</strong></div>
                <div><span>Discounts</span><strong>{formatPKR(closing.discounts)}</strong></div>
                <div><span>Tax</span><strong>{formatPKR(closing.tax)}</strong></div>
                <div><span>Service charge</span><strong>{formatPKR(closing.serviceCharge)}</strong></div>
                <div><span>Delivery fees</span><strong>{formatPKR(closing.deliveryFees)}</strong></div>
                <div><span>Cancelled</span><strong>{closing.cancelledCount} · {formatPKR(closing.cancelledAmount)}</strong></div>
                <div><span>Online channel</span><strong>{formatPKR(closing.channels?.ONLINE?.amount ?? 0)}</strong></div>
                <div><span>In-restaurant</span><strong>{formatPKR(closing.channels?.IN_RESTAURANT?.amount ?? 0)}</strong></div>
              </div>
            </div>
            <div className="panel reports-panel">
              <div className="reports-panel-header">
                <Calendar size={16} />
                <h3>Day-wise closing</h3>
              </div>
              <DataTable columns={dayColumns} data={closing.byDay || byDay} loading={loading} skeletonRows={5} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'udhaar' && (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            <StatCard icon={CreditCard} label="Outstanding" value={formatPKR(credit.totalOutstanding)} subValue="Unpaid + open tabs" accent="danger" />
            <StatCard icon={Wallet} label="Open tabs" value={credit.openTabs} subValue="Dine-in drafts" accent="warning" />
            <StatCard icon={Users} label="Credit orders" value={credit.creditOrders} subValue="Pending payment" accent="info" />
            <StatCard icon={CheckCircle2} label="Entries" value={credit.rows?.length ?? 0} subValue={periodLabel} accent="copper" />
          </div>
          <div className="panel reports-section animate-slide-up">
            <div className="reports-section-header">
              <h3 className="panel-title">Udhaar / open credit</h3>
            </div>
            <DataTable columns={creditColumns} data={credit.rows || []} loading={loading} skeletonRows={8} />
          </div>
        </>
      )}

      {activeTab === 'payables' && (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            <StatCard icon={CreditCard} label="Open payables" value={formatPKR(payables.totalOpen)} subValue="Supplier balance" accent="danger" />
            <StatCard icon={Package} label="Entries" value={payables.count} subValue={periodLabel} accent="info" />
            <StatCard
              icon={CheckCircle2}
              label="Paid entries"
              value={(payables.rows || []).filter((r) => r.status === 'paid').length}
              subValue="Settled"
              accent="success"
            />
            <div className="reports-stat-action panel">
              <p>Track supplier bills and settle them when paid.</p>
              <button type="button" className="btn btn-primary" onClick={() => setPayableModalOpen(true)}>
                <Plus size={16} />
                Add payable
              </button>
            </div>
          </div>
          <div className="panel reports-section animate-slide-up">
            <div className="reports-section-header">
              <h3 className="panel-title">Supplier payables</h3>
            </div>
            <DataTable columns={payableColumns} data={payables.rows || []} loading={loading} skeletonRows={8} />
          </div>
        </>
      )}

      {activeTab === 'profit' && (
        <>
          <div className="grid-4 reports-stats animate-slide-up">
            <StatCard icon={DollarSign} label="Revenue" value={formatPKR(profit.totals?.revenue ?? 0)} subValue={periodLabel} accent="success" />
            <StatCard icon={Package} label="COGS" value={formatPKR(profit.totals?.cogs ?? 0)} subValue="Cost of goods" accent="warning" />
            <StatCard icon={Target} label="Profit" value={formatPKR(profit.totals?.profit ?? 0)} subValue="Revenue − COGS" accent="copper" />
            <StatCard icon={TrendingUp} label="Margin" value={`${profit.totals?.margin ?? 0}%`} subValue="Overall margin" accent="info" />
          </div>
          <p className="reports-note animate-slide-up">
            Products without a set cost price use an estimated cost of 40% of selling price.
          </p>
          <div className="panel reports-section animate-slide-up">
            <div className="reports-section-header">
              <h3 className="panel-title">Profit by product</h3>
            </div>
            <DataTable columns={profitColumns} data={profit.rows || []} loading={loading} skeletonRows={8} />
          </div>
        </>
      )}

      <Modal open={payableModalOpen} onClose={() => !payableSaving && setPayableModalOpen(false)} title="Add supplier payable" size="md">
        <form className="reports-payable-form" onSubmit={savePayable}>
          <div className="form-group">
            <label htmlFor="payable-supplier">Supplier name</label>
            <input
              id="payable-supplier"
              className="form-control"
              required
              value={payableForm.supplierName}
              onChange={(e) => setPayableForm((f) => ({ ...f, supplierName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="payable-amount">Amount (PKR)</label>
            <input
              id="payable-amount"
              type="number"
              min="1"
              step="1"
              className="form-control"
              required
              value={payableForm.amount}
              onChange={(e) => setPayableForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="payable-ref">Reference</label>
            <input
              id="payable-ref"
              className="form-control"
              value={payableForm.reference}
              onChange={(e) => setPayableForm((f) => ({ ...f, reference: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="payable-due">Due date</label>
            <input
              id="payable-due"
              type="date"
              className="form-control"
              value={payableForm.dueDate}
              onChange={(e) => setPayableForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="payable-notes">Notes</label>
            <textarea
              id="payable-notes"
              className="form-control"
              rows={2}
              value={payableForm.notes}
              onChange={(e) => setPayableForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="reports-payable-actions">
            <button type="button" className="btn btn-secondary" disabled={payableSaving} onClick={() => setPayableModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={payableSaving}>
              {payableSaving ? 'Saving…' : 'Save payable'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
