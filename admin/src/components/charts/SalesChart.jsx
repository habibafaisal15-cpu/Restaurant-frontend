import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import './SalesChart.css';

const CHANNELS = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'inRestaurant', label: 'In Restaurant' },
];

const COLORS = {
  sales: '#51553D',
  onlineSales: '#7D5B51',
  inRestaurantSales: '#6C422C',
};

function formatCurrency(value) {
  if (value == null) return '—';
  return `Rs ${Number(value).toLocaleString('en-PK')}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="sales-chart__tooltip">
      <p className="sales-chart__tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function SalesChart({ data = [], title = 'Sales Overview' }) {
  const [channel, setChannel] = useState('all');

  const chartData = useMemo(
    () =>
      data.map((row) => ({
        label: row.label,
        sales: row.sales ?? 0,
        onlineSales: row.onlineSales ?? 0,
        inRestaurantSales: row.inRestaurantSales ?? 0,
      })),
    [data],
  );

  const showSales = channel === 'all';
  const showOnline = channel === 'all' || channel === 'online';
  const showInRestaurant = channel === 'all' || channel === 'inRestaurant';

  return (
    <div className="sales-chart panel">
      <div className="sales-chart__header">
        <h3 className="panel-title sales-chart__title">{title}</h3>
        <div className="tabs sales-chart__tabs">
          {CHANNELS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`tab ${channel === key ? 'active' : ''}`}
              onClick={() => setChannel(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.sales} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.sales} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="onlineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.onlineSales} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.onlineSales} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="inRestGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.inRestaurantSales} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.inRestaurantSales} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#7a7268', fontSize: 12 }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#7a7268', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#b8b0a6' }}
            iconType="circle"
            iconSize={8}
          />

          {showSales && (
            <Area
              type="monotone"
              dataKey="sales"
              name="Total Sales"
              stroke={COLORS.sales}
              strokeWidth={2.5}
              fill="url(#salesGrad)"
              dot={false}
              activeDot={{ r: 5, fill: COLORS.sales, stroke: '#1a1612', strokeWidth: 2 }}
            />
          )}
          {showOnline && (
            <Area
              type="monotone"
              dataKey="onlineSales"
              name="Online"
              stroke={COLORS.onlineSales}
              strokeWidth={2}
              fill="url(#onlineGrad)"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.onlineSales }}
            />
          )}
          {showInRestaurant && (
            <Area
              type="monotone"
              dataKey="inRestaurantSales"
              name="In Restaurant"
              stroke={COLORS.inRestaurantSales}
              strokeWidth={2}
              fill="url(#inRestGrad)"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.inRestaurantSales }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
