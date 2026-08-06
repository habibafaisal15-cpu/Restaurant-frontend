import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Bike,
  Phone,
  Hash,
  Power,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import * as riderService from '../services/riderService';
import './Riders.css';

const EMPTY_FORM = {
  name: '',
  phone: '',
  vehicleNumber: '',
  status: 'offline',
};

const RIDER_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
];

function RiderStatusBadge({ status }) {
  const key = String(status ?? 'offline').toLowerCase();
  const config = {
    available: { label: 'Available', variant: 'success' },
    busy: { label: 'Busy', variant: 'warning' },
    offline: { label: 'Offline', variant: 'default' },
  }[key] ?? { label: 'Offline', variant: 'default' };

  return (
    <span className={`badge status-badge status-badge--${config.variant} riders-status-badge`}>
      <span className={`riders-status-dot riders-status-dot--${key}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);

  const loadRiders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await riderService.getAll();
      setRiders(data);
    } catch {
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  const filtered = useMemo(() => {
    let list = [...riders];

    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (activeFilter === 'active') list = list.filter((r) => r.active);
    if (activeFilter === 'inactive') list = list.filter((r) => !r.active);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.vehicleNumber.toLowerCase().includes(q),
      );
    }

    return list;
  }, [riders, search, statusFilter, activeFilter]);

  const stats = useMemo(() => {
    const active = riders.filter((r) => r.active).length;
    const available = riders.filter((r) => r.active && r.status === 'available').length;
    const busy = riders.filter((r) => r.status === 'busy').length;
    const totalDeliveries = riders.reduce((sum, r) => sum + (r.deliveredCount ?? 0), 0);
    return { active, available, busy, totalDeliveries };
  }, [riders]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, status: 'offline' });
    setModalOpen(true);
  };

  const openEdit = (rider) => {
    setEditingId(rider.id);
    setForm({
      name: rider.name,
      phone: rider.phone,
      vehicleNumber: rider.vehicleNumber,
      status: rider.status ?? 'offline',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Rider name is required');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!form.vehicleNumber.trim()) {
      toast.error('Vehicle number is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        status: form.status,
      };

      if (editingId) {
        await riderService.update(editingId, payload);
        toast.success('Rider updated');
      } else {
        await riderService.create(payload);
        toast.success('Rider added');
      }

      closeModal();
      await loadRiders();
    } catch (err) {
      toast.error(err.message ?? 'Failed to save rider');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    try {
      await riderService.toggleActive(toggleTarget.id);
      toast.success(toggleTarget.active ? 'Rider disabled' : 'Rider enabled');
      setConfirmOpen(false);
      setToggleTarget(null);
      await loadRiders();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update rider');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (_, row) => (
          <div className="riders-name-cell">
            <div className="riders-avatar" aria-hidden="true">
              <Bike size={16} />
            </div>
            <span className="riders-name">{row.name}</span>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'Phone',
        sortable: true,
        render: (val) => (
          <span className="riders-phone">
            <Phone size={13} />
            {val}
          </span>
        ),
      },
      {
        key: 'vehicleNumber',
        label: 'Vehicle',
        sortable: true,
        render: (val) => (
          <span className="riders-vehicle">
            <Hash size={13} />
            {val}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_, row) => <RiderStatusBadge status={row.status} />,
      },
      {
        key: 'active',
        label: 'Active',
        render: (_, row) =>
          row.active ? (
            <span className="riders-active-badge riders-active-badge--on">Enabled</span>
          ) : (
            <span className="riders-active-badge riders-active-badge--off">Disabled</span>
          ),
      },
      {
        key: 'deliveredCount',
        label: 'Deliveries',
        sortable: true,
        render: (val) => (
          <span className="riders-deliveries">
            <Package size={13} />
            {val ?? 0}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        render: (_, row) => (
          <div className="riders-actions">
            <button
              type="button"
              className="btn-icon"
              title="Edit rider"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className={`btn-icon riders-toggle-btn ${row.active ? 'riders-toggle-btn--disable' : 'riders-toggle-btn--enable'}`}
              title={row.active ? 'Disable rider' : 'Enable rider'}
              onClick={(e) => {
                e.stopPropagation();
                setToggleTarget(row);
                setConfirmOpen(true);
              }}
            >
              <Power size={16} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const modalFooter = (
    <>
      <button type="button" className="btn btn-secondary" onClick={closeModal}>
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving…' : editingId ? 'Update Rider' : 'Add Rider'}
      </button>
    </>
  );

  return (
    <div className="page riders-page">
      <div className="page-header">
        <div>
          <h1>Riders</h1>
          <p>Manage delivery riders and fleet status</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Rider
        </button>
      </div>

      <div className="riders-stats animate-slide-up">
        <div className="riders-stat-card">
          <span className="riders-stat-label">Active Riders</span>
          <span className="riders-stat-value">{stats.active}</span>
        </div>
        <div className="riders-stat-card riders-stat-card--success">
          <span className="riders-stat-label">Available Now</span>
          <span className="riders-stat-value">{stats.available}</span>
        </div>
        <div className="riders-stat-card riders-stat-card--warning">
          <span className="riders-stat-label">On Delivery</span>
          <span className="riders-stat-value">{stats.busy}</span>
        </div>
        <div className="riders-stat-card riders-stat-card--copper">
          <span className="riders-stat-label">Total Deliveries</span>
          <span className="riders-stat-value">{stats.totalDeliveries}</span>
        </div>
      </div>

      <div className="filters-bar animate-slide-up">
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search by name, phone, or vehicle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {RIDER_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="all">All riders</option>
          <option value="active">Enabled only</option>
          <option value="inactive">Disabled only</option>
        </select>
      </div>

      <div className="panel animate-slide-up">
        {!loading && filtered.length === 0 ? (
          <EmptyState
            title="No riders found"
            description={
              search || statusFilter !== 'all' || activeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first delivery rider to get started'
            }
            actionLabel={!search ? 'Add Rider' : undefined}
            onAction={!search ? openCreate : undefined}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage="No riders match your filters"
            skeletonRows={5}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Rider' : 'New Rider'}
        footer={modalFooter}
        size="md"
      >
        <div className="form-group">
          <label htmlFor="rider-name">Full Name *</label>
          <input
            id="rider-name"
            type="text"
            className="form-control"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="e.g. Ahmed Khan"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rider-phone">Phone *</label>
            <input
              id="rider-phone"
              type="tel"
              className="form-control"
              value={form.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
              placeholder="+92 300 1234567"
            />
          </div>
          <div className="form-group">
            <label htmlFor="rider-vehicle">Vehicle Number *</label>
            <input
              id="rider-vehicle"
              type="text"
              className="form-control"
              value={form.vehicleNumber}
              onChange={(e) => updateForm('vehicleNumber', e.target.value)}
              placeholder="KHI-4521"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="rider-status">Status</label>
          <select
            id="rider-status"
            className="form-control"
            value={form.status}
            onChange={(e) => updateForm('status', e.target.value)}
          >
            {RIDER_STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="form-hint">New riders start as offline until they go on duty</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={toggleTarget?.active ? 'Disable Rider' : 'Enable Rider'}
        message={
          toggleTarget?.active
            ? `${toggleTarget.name} will be set offline and won't receive new deliveries. Continue?`
            : `${toggleTarget?.name} will be re-enabled for delivery assignments. Continue?`
        }
        confirmText={toggleTarget?.active ? 'Disable' : 'Enable'}
        cancelText="Cancel"
        danger={toggleTarget?.active}
        onConfirm={handleToggleActive}
        onCancel={() => {
          setConfirmOpen(false);
          setToggleTarget(null);
        }}
      />
    </div>
  );
}
