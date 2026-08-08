import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Banknote,
  ShoppingBag,
  Globe,
  UtensilsCrossed,
  Clock,
  ChefHat,
  TrendingUp,
  ArrowRight,
  LayoutGrid,
  ListOrdered,
  Monitor,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ChannelBadge from '../components/ui/ChannelBadge';
import SalesChart from '../components/charts/SalesChart';
import Skeleton from '../components/ui/Skeleton';
import * as salesService from '../services/salesService';
import * as orderService from '../services/orderService';
import { formatPKR, formatDateTime } from '../utils/format';
import './Dashboard.css';

const PERIODS = [
  { key: 'today', label: 'Today', range: 'daily', chartRange: 'daily' },
  { key: 'week', label: 'This Week', range: 'weekly', chartRange: 'weekly' },
  { key: 'month', label: 'This Month', range: 'monthly', chartRange: 'monthly' },
  { key: 'all', label: 'All Time', range: 'monthly', chartRange: 'monthly' },
];

const QUICK_ACTIONS = [
  { to: '/orders?status=pending', label: 'New Online Requests', icon: Clock, accent: 'warning' },
  { to: '/pos', label: 'Open POS', icon: Monitor, accent: 'copper' },
  { to: '/menu', label: 'Manage Menu', icon: ListOrdered, accent: 'info' },
  { to: '/categories', label: 'Categories', icon: LayoutGrid, accent: 'success' },
];

function formatChartLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { refreshKey } = useOutletContext() || {};
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [kitchenCount, setKitchenCount] = useState(0);

  const periodConfig = PERIODS.find((p) => p.key === period) ?? PERIODS[0];

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { range, chartRange } = periodConfig;
      const [summaryData, itemsData, categoriesData, dayData, ordersData] = await Promise.all([
        salesService.getSummary({ range }),
        salesService.getByItem({ range }),
        salesService.getByCategory({ range }),
        salesService.getByDay({ range: chartRange }),
        // All channels: ONLINE + walk-in dine-in / takeaway
        orderService.getAll({}),
      ]);

      const allOrders = [...ordersData].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setSummary(summaryData);
      setTopItems(itemsData.slice(0, 5));
      setTopCategories(categoriesData.slice(0, 5));
      setChartData(
        dayData.map((row) => ({
          label: formatChartLabel(row.date),
          sales: row.revenue,
          onlineSales: row.online,
          inRestaurantSales: row.inRestaurant,
        })),
      );
      setRecentOrders(allOrders.slice(0, 15));
      setKitchenCount(allOrders.filter((o) => o.status === 'preparing').length);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [periodConfig]);

  const pollPending = useCallback(async () => {
    try {
      const pending = await orderService.pollPendingOnline();
      setPendingCount(pending.length);
    } catch {
      /* silent poll failure */
    }
  }, []);

  useEffect(() => {
    loadDashboard({ silent: Boolean(refreshKey) });
  }, [loadDashboard, refreshKey]);

  useEffect(() => {
    pollPending();
    const interval = setInterval(() => {
      pollPending();
      loadDashboard({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, [pollPending, loadDashboard]);

  const onlineChannel = summary?.channels?.ONLINE;
  const inRestChannel = summary?.channels?.IN_RESTAURANT;

  const aovOnline = onlineChannel
    ? Math.round(onlineChannel.revenue / Math.max(onlineChannel.orders, 1))
    : 0;
  const aovInRest = inRestChannel
    ? Math.round(inRestChannel.revenue / Math.max(inRestChannel.orders, 1))
    : 0;

  const orderColumns = useMemo(
    () => [
      {
        key: 'orderNumber',
        label: 'Order',
        sortable: true,
        render: (_, row) => (
          <span className="dashboard-order-num">{row.orderNumber}</span>
        ),
      },
      {
        key: 'channel',
        label: 'Channel',
        render: (_, row) => (
          <ChannelBadge channel={row.channel} orderType={row.type} />
        ),
      },
      {
        key: 'customer',
        label: 'Customer',
        render: (_, row) => {
          const name = row.customer?.name ?? 'Guest';
          if (row.tableNumber) return `${name} · T-${row.tableNumber}`;
          if (row.tokenNumber) return `${name} · #${row.tokenNumber}`;
          return name;
        },
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        render: (_, row) => formatPKR(row.total),
      },
      {
        key: 'status',
        label: 'Status',
        render: (_, row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'createdAt',
        label: 'Time',
        sortable: true,
        render: (_, row) => formatDateTime(row.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of orders, revenue, and activity</p>
        </div>
        <div className="tabs dashboard-period-tabs">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`tab ${period === key ? 'active' : ''}`}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-4 dashboard-stats animate-slide-up">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="dashboard-stat-skeleton panel">
              <Skeleton height={20} width="40%" />
              <Skeleton height={32} width="60%" />
              <Skeleton height={14} width="50%" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon={Banknote}
              label="Total Sales"
              value={formatPKR(summary?.totalRevenue ?? 0)}
              subValue={`${summary?.totalOrders ?? 0} orders`}
              accent="copper"
            />
            <StatCard
              icon={Globe}
              label="Online Sales"
              value={formatPKR(onlineChannel?.revenue ?? 0)}
              subValue={`${onlineChannel?.orders ?? 0} delivered · ${onlineChannel?.percentage ?? 0}%`}
              accent="info"
            />
            <StatCard
              icon={UtensilsCrossed}
              label="In-Restaurant Sales"
              value={formatPKR(inRestChannel?.revenue ?? 0)}
              subValue={`${inRestChannel?.orders ?? 0} POS orders · ${inRestChannel?.percentage ?? 0}%`}
              accent="success"
            />
            <StatCard
              icon={ShoppingBag}
              label="Total Orders"
              value={summary?.totalOrders ?? 0}
              subValue={`AOV ${formatPKR(summary?.averageOrderValue ?? 0)}`}
              accent="copper"
            />
            <StatCard
              icon={Clock}
              label="Pending Online"
              value={pendingCount}
              subValue="Awaiting confirmation"
              accent="warning"
            />
            <StatCard
              icon={ChefHat}
              label="Active Kitchen"
              value={kitchenCount}
              subValue="Currently preparing"
              accent="info"
            />
            <StatCard
              icon={TrendingUp}
              label="AOV · Online"
              value={formatPKR(aovOnline)}
              subValue="Per online order"
              accent="info"
            />
            <StatCard
              icon={TrendingUp}
              label="AOV · In-Restaurant"
              value={formatPKR(aovInRest)}
              subValue="Per walk-in order"
              accent="success"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions animate-slide-up">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon, accent }) => (
          <Link key={to} to={to} className={`dashboard-quick-btn dashboard-quick-btn--${accent}`}>
            <Icon size={18} />
            <span>{label}</span>
            <ArrowRight size={14} className="dashboard-quick-arrow" />
          </Link>
        ))}
      </div>

      {/* Chart */}
      <div className="dashboard-chart-wrap animate-slide-up">
        {loading ? (
          <div className="panel dashboard-chart-skeleton">
            <Skeleton height={24} width={180} />
            <Skeleton height={280} />
          </div>
        ) : (
          <SalesChart
            data={chartData}
            title={`Sales · ${periodConfig.label}`}
          />
        )}
      </div>

      {/* Top lists */}
      <div className="grid-2 dashboard-lists animate-slide-up">
        <div className="panel dashboard-top-panel">
          <h3 className="panel-title">Top Selling Items</h3>
          {loading ? (
            <div className="dashboard-top-skeleton">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={48} />
              ))}
            </div>
          ) : topItems.length === 0 ? (
            <p className="dashboard-empty-list">No item data for this period</p>
          ) : (
            <ol className="dashboard-ranked-list">
              {topItems.map((item, i) => (
                <li key={item.menuItemId} className="dashboard-ranked-item">
                  <span className="dashboard-rank">{i + 1}</span>
                  <div className="dashboard-ranked-info">
                    <span className="dashboard-ranked-name">{item.name}</span>
                    <span className="dashboard-ranked-meta">
                      {item.quantity} sold · {formatPKR(item.revenue)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="panel dashboard-top-panel">
          <h3 className="panel-title">Top Categories</h3>
          {loading ? (
            <div className="dashboard-top-skeleton">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={48} />
              ))}
            </div>
          ) : topCategories.length === 0 ? (
            <p className="dashboard-empty-list">No category data for this period</p>
          ) : (
            <ol className="dashboard-ranked-list">
              {topCategories.map((cat, i) => (
                <li key={cat.categoryId} className="dashboard-ranked-item">
                  <span className="dashboard-rank">{i + 1}</span>
                  <div className="dashboard-ranked-info">
                    <span className="dashboard-ranked-name">{cat.name}</span>
                    <span className="dashboard-ranked-meta">
                      {cat.orders} orders · {formatPKR(cat.revenue)} · {cat.percentage}%
                    </span>
                  </div>
                  <div className="dashboard-cat-bar">
                    <div
                      className="dashboard-cat-bar-fill"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Recent Orders — online + walk-in (dine-in / takeaway) */}
      <div className="panel dashboard-orders-panel animate-slide-up">
        <div className="dashboard-orders-header">
          <div>
            <h3 className="panel-title">Recent Orders</h3>
            <p className="dashboard-orders-sub">
              Online, walk-in dine-in &amp; takeaway — latest across all channels
            </p>
          </div>
          <div className="dashboard-orders-links">
            <Link to="/orders?status=pending" className="btn btn-ghost btn-sm">
              Online orders
              <ArrowRight size={14} />
            </Link>
            <Link to="/pos" className="btn btn-ghost btn-sm">
              POS
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <DataTable
          columns={orderColumns}
          data={recentOrders}
          loading={loading}
          emptyMessage="No orders yet"
          skeletonRows={5}
        />
      </div>
    </div>
  );
}
