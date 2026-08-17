import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Search,
  Package,
  AlertTriangle,
  PackageX,
  Layers,
  Pencil,
  History,
  Plus,
  Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import * as inventoryService from '../services/inventoryService';
import { formatPKR, formatDateTime } from '../utils/format';
import './Inventory.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

function StockBadge({ status }) {
  const map = {
    in_stock: { label: 'In stock', className: 'inventory-badge--ok' },
    available: { label: 'Available', className: 'inventory-badge--ok' },
    low_stock: { label: 'Low stock', className: 'inventory-badge--low' },
    out_of_stock: { label: 'Out of stock', className: 'inventory-badge--out' },
  };
  const config = map[status] || map.available;
  return <span className={`inventory-badge ${config.className}`}>{config.label}</span>;
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    type: 'adjust',
    quantity: '',
    reason: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    trackStock: true,
    lowStockThreshold: 5,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (search.trim()) filters.search = search.trim();

      const [list, stats, moves] = await Promise.all([
        inventoryService.getAll(filters),
        inventoryService.getSummary(),
        inventoryService.getMovements({ limit: 30 }),
      ]);
      setItems(list);
      setSummary(stats);
      setMovements(moves);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openAdjust = (item, type = 'adjust') => {
    setSelected(item);
    setAdjustForm({
      type,
      quantity: type === 'adjust' ? String(item.stockQty ?? 0) : '',
      reason: '',
    });
    setAdjustOpen(true);
  };

  const openSettings = (item) => {
    setSelected(item);
    setSettingsForm({
      trackStock: item.trackStock !== false,
      lowStockThreshold: item.lowStockThreshold ?? 5,
    });
    setSettingsOpen(true);
  };

  const openHistory = async (item) => {
    setSelected(item);
    setHistoryOpen(true);
    try {
      const moves = await inventoryService.getMovements({ productId: item.id, limit: 40 });
      setMovements(moves);
    } catch {
      toast.error('Failed to load stock history');
    }
  };

  const handleAdjust = async () => {
    if (!selected) return;
    const quantity = Number(adjustForm.quantity);
    if (!Number.isFinite(quantity) || (adjustForm.type !== 'adjust' && quantity <= 0)) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (adjustForm.type === 'adjust' && quantity < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    setSaving(true);
    try {
      await inventoryService.adjust(selected.id, {
        type: adjustForm.type,
        quantity,
        reason: adjustForm.reason.trim() || undefined,
        enableTracking: true,
      });
      toast.success('Stock updated');
      setAdjustOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await inventoryService.updateSettings(selected.id, {
        trackStock: settingsForm.trackStock,
        lowStockThreshold: Number(settingsForm.lowStockThreshold) || 0,
      });
      toast.success('Inventory settings saved');
      setSettingsOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Item',
        sortable: true,
        render: (_, row) => (
          <div className="inventory-item-cell">
            <div className="inventory-thumb" aria-hidden="true">
              {row.image ? <img src={row.image} alt="" /> : <Package size={16} />}
            </div>
            <div>
              <div className="inventory-item-name">{row.name}</div>
              <div className="inventory-item-meta">{row.categoryName}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'stockQty',
        label: 'Stock',
        sortable: true,
        render: (val, row) => (
          <span className="inventory-qty">
            {row.trackStock ? val : '—'}
          </span>
        ),
      },
      {
        key: 'lowStockThreshold',
        label: 'Low at',
        sortable: true,
        render: (val, row) => (row.trackStock ? val : '—'),
      },
      {
        key: 'stockStatus',
        label: 'Status',
        sortable: true,
        render: (val) => <StockBadge status={val} />,
      },
      {
        key: 'price',
        label: 'Price',
        sortable: true,
        render: (val) => formatPKR(val),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="inventory-actions">
            <button
              type="button"
              className="btn-icon"
              title="Add stock"
              onClick={(e) => {
                e.stopPropagation();
                openAdjust(row, 'in');
              }}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              title="Remove stock"
              onClick={(e) => {
                e.stopPropagation();
                openAdjust(row, 'out');
              }}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              title="Set stock level"
              onClick={(e) => {
                e.stopPropagation();
                openAdjust(row, 'adjust');
              }}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              title="Stock history"
              onClick={(e) => {
                e.stopPropagation();
                openHistory(row);
              }}
            >
              <History size={16} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                openSettings(row);
              }}
            >
              Settings
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="page inventory-page">
      <div className="page-header">
        <div className="inventory-title-block">
          <Boxes size={26} strokeWidth={1.75} className="inventory-title-icon" />
          <div>
            <h1>Inventory & Stock</h1>
            <p>Track menu item stock levels, low-stock alerts, and adjustments.</p>
          </div>
        </div>
      </div>

      <div className="inventory-stats animate-slide-up">
        <div className="inventory-stat-card">
          <Layers size={18} />
          <div>
            <span className="inventory-stat-label">Tracked items</span>
            <strong>{summary?.trackedItems ?? 0}</strong>
          </div>
        </div>
        <div className="inventory-stat-card inventory-stat-card--ok">
          <Package size={18} />
          <div>
            <span className="inventory-stat-label">In stock</span>
            <strong>{summary?.inStock ?? 0}</strong>
          </div>
        </div>
        <div className="inventory-stat-card inventory-stat-card--low">
          <AlertTriangle size={18} />
          <div>
            <span className="inventory-stat-label">Low stock</span>
            <strong>{summary?.lowStock ?? 0}</strong>
          </div>
        </div>
        <div className="inventory-stat-card inventory-stat-card--out">
          <PackageX size={18} />
          <div>
            <span className="inventory-stat-label">Out of stock</span>
            <strong>{summary?.outOfStock ?? 0}</strong>
          </div>
        </div>
        <div className="inventory-stat-card inventory-stat-card--units">
          <Boxes size={18} />
          <div>
            <span className="inventory-stat-label">Total units</span>
            <strong>{summary?.totalUnits ?? 0}</strong>
          </div>
        </div>
      </div>

      <div className="filters-bar animate-slide-up">
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search items or categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_FILTERS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="panel animate-slide-up">
        {!loading && items.length === 0 ? (
          <EmptyState
            title="No inventory items"
            description="Menu items will appear here. Use Set stock to start tracking quantities."
          />
        ) : (
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            emptyMessage="No items match your filters"
            skeletonRows={6}
          />
        )}
      </div>

      <div className="panel inventory-recent animate-slide-up">
        <div className="inventory-recent-header">
          <h3>Recent stock movements</h3>
        </div>
        {movements.length === 0 ? (
          <p className="inventory-empty">No stock movements yet</p>
        ) : (
          <div className="inventory-movement-list">
            {movements.slice(0, 8).map((move) => (
              <div key={move.id} className="inventory-movement-row">
                <div>
                  <strong>{move.productName || 'Item'}</strong>
                  <span>
                    {move.type.toUpperCase()} · {move.quantityBefore} → {move.quantityAfter}
                    {move.reason ? ` · ${move.reason}` : ''}
                  </span>
                </div>
                <time>{formatDateTime(move.createdAt)}</time>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={
          adjustForm.type === 'in'
            ? `Add stock · ${selected?.name || ''}`
            : adjustForm.type === 'out'
              ? `Remove stock · ${selected?.name || ''}`
              : `Set stock · ${selected?.name || ''}`
        }
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdjust}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save stock'}
            </button>
          </>
        )}
      >
        <div className="form-group">
          <label htmlFor="inv-qty">
            {adjustForm.type === 'adjust' ? 'New stock quantity' : 'Quantity'}
          </label>
          <input
            id="inv-qty"
            type="number"
            min="0"
            className="form-control"
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))}
          />
          {selected ? (
            <p className="form-hint">Current stock: {selected.stockQty}</p>
          ) : null}
        </div>
        <div className="form-group">
          <label htmlFor="inv-reason">Reason (optional)</label>
          <input
            id="inv-reason"
            type="text"
            className="form-control"
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Restock, waste, correction…"
          />
        </div>
      </Modal>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={`Inventory settings · ${selected?.name || ''}`}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setSettingsOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSettingsSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </>
        )}
      >
        <label className="inventory-toggle">
          <input
            type="checkbox"
            checked={settingsForm.trackStock}
            onChange={(e) =>
              setSettingsForm((prev) => ({ ...prev, trackStock: e.target.checked }))
            }
          />
          Track stock quantity for this item
        </label>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label htmlFor="inv-threshold">Low stock threshold</label>
          <input
            id="inv-threshold"
            type="number"
            min="0"
            className="form-control"
            value={settingsForm.lowStockThreshold}
            onChange={(e) =>
              setSettingsForm((prev) => ({
                ...prev,
                lowStockThreshold: e.target.value,
              }))
            }
          />
          <p className="form-hint">Items at or below this quantity show as low stock.</p>
        </div>
      </Modal>

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`Stock history · ${selected?.name || ''}`}
        size="lg"
      >
        {movements.length === 0 ? (
          <p className="inventory-empty">No movements for this item</p>
        ) : (
          <div className="inventory-movement-list">
            {movements.map((move) => (
              <div key={move.id} className="inventory-movement-row">
                <div>
                  <strong>{move.type.toUpperCase()}</strong>
                  <span>
                    {move.quantityBefore} → {move.quantityAfter}
                    {move.reason ? ` · ${move.reason}` : ''}
                  </span>
                </div>
                <time>{formatDateTime(move.createdAt)}</time>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
