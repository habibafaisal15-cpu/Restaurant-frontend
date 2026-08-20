import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Users,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Power,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import * as staffService from '../services/staffService';
import './Staff.css';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'admin',
  password: '',
  active: true,
};

export const STAFF_ROLES = [
  { value: 'admin', label: 'Store Admin' },
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'rider', label: 'Rider' },
];

export function roleLabel(role) {
  const key = String(role || 'admin').toLowerCase();
  return STAFF_ROLES.find((r) => r.value === key)?.label || 'Store Admin';
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function RoleBadge({ role }) {
  const key = String(role || 'admin').toLowerCase();
  return (
    <span className={`staff-role-badge staff-role-badge--${key}`}>
      {roleLabel(role)}
    </span>
  );
}

function StatusCell({ active }) {
  if (active) {
    return (
      <span className="staff-status staff-status--active">
        <UserCheck size={15} strokeWidth={2} />
        Active
      </span>
    );
  }
  return (
    <span className="staff-status staff-status--inactive">
      <UserX size={15} strokeWidth={2} />
      Inactive
    </span>
  );
}

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffService.getAll();
      setStaff(data);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filtered = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter(
      (member) =>
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.phone || '').toLowerCase().includes(q),
    );
  }, [staff, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingId(member.id);
    setForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'admin',
      password: '',
      active: member.active !== false,
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
      toast.error('Name is required');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!editingId && !form.password.trim()) {
      toast.error('Password is required for new staff');
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        active: form.active,
      };
      if (form.password.trim()) payload.password = form.password.trim();

      if (editingId) {
        await staffService.update(editingId, payload);
        toast.success('Staff member updated');
      } else {
        await staffService.create(payload);
        toast.success('Staff member added');
      }

      closeModal();
      await loadStaff();
    } catch (err) {
      toast.error(err.message ?? 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    try {
      await staffService.toggleActive(toggleTarget.id);
      toast.success(toggleTarget.active ? 'Staff deactivated' : 'Staff activated');
      setConfirmOpen(false);
      setToggleTarget(null);
      await loadStaff();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update staff');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'User',
        sortable: true,
        render: (_, row) => (
          <div className="staff-user-cell">
            <div className="staff-avatar" aria-hidden="true">
              {getInitials(row.name)}
            </div>
            <div className="staff-user-meta">
              <span className="staff-user-name">{row.name}</span>
              <span className="staff-user-email">
                <Mail size={12} strokeWidth={2} />
                {row.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'Contact',
        sortable: true,
        render: (val) => (
          <span className="staff-contact">
            <Phone size={13} strokeWidth={2} />
            {val || 'N/A'}
          </span>
        ),
      },
      {
        key: 'role',
        label: 'Role',
        sortable: true,
        render: (val) => <RoleBadge role={val} />,
      },
      {
        key: 'active',
        label: 'Status',
        sortable: true,
        render: (_, row) => <StatusCell active={row.active} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => {
          const isSelf = user?.id && row.id === user.id;
          return (
            <div className="staff-actions">
              <button
                type="button"
                className="btn-icon staff-edit-btn"
                title="Edit staff member"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(row);
                }}
              >
                <Pencil size={16} />
              </button>
              {!isSelf && (
                <button
                  type="button"
                  className={`btn-icon staff-toggle-btn ${
                    row.active ? 'staff-toggle-btn--disable' : 'staff-toggle-btn--enable'
                  }`}
                  title={row.active ? 'Deactivate' : 'Activate'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setToggleTarget(row);
                    setConfirmOpen(true);
                  }}
                >
                  <Power size={16} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [user?.id],
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
        {saving ? 'Saving…' : editingId ? 'Update Staff' : 'Add Staff Member'}
      </button>
    </>
  );

  return (
    <div className="page staff-page">
      <div className="page-header">
        <div className="staff-page-title">
          <Users size={26} strokeWidth={1.75} className="staff-page-title-icon" />
          <div>
            <h1>User Management</h1>
            <p>Manage your store staff and their roles.</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Staff Member
        </button>
      </div>

      <div className="filters-bar animate-slide-up staff-search-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="panel animate-slide-up">
        {!loading && filtered.length === 0 ? (
          <EmptyState
            title="No staff found"
            description={
              search
                ? 'Try a different name or email'
                : 'Add your first staff member to get started'
            }
            actionLabel={!search ? 'Add Staff Member' : undefined}
            onAction={!search ? openCreate : undefined}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage="No staff match your search"
            skeletonRows={5}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Staff Member' : 'Add Staff Member'}
        footer={modalFooter}
        size="md"
      >
        <div className="form-group">
          <label htmlFor="staff-name">Full Name *</label>
          <input
            id="staff-name"
            type="text"
            className="form-control"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="e.g. Ahmad Majeed"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="staff-email">Email *</label>
            <input
              id="staff-email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="name@restaurant.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="staff-phone">Contact</label>
            <input
              id="staff-phone"
              type="tel"
              className="form-control"
              value={form.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
              placeholder="+92 300 1234567"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="staff-role">Role *</label>
            <select
              id="staff-role"
              className="form-control"
              value={form.role}
              onChange={(e) => updateForm('role', e.target.value)}
            >
              {STAFF_ROLES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="staff-password">
              Password {editingId ? '(optional)' : '*'}
            </label>
            <input
              id="staff-password"
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              placeholder={editingId ? 'Leave blank to keep current' : 'Min. 6 characters'}
              autoComplete="new-password"
            />
          </div>
        </div>

        {editingId && (
          <div className="form-group">
            <label className="staff-active-toggle">
              <input
                type="checkbox"
                checked={form.active}
                disabled={user?.id === editingId}
                onChange={(e) => updateForm('active', e.target.checked)}
              />
              Active account
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={toggleTarget?.active ? 'Deactivate Staff' : 'Activate Staff'}
        message={
          toggleTarget?.active
            ? `${toggleTarget.name} will no longer be able to sign in. Continue?`
            : `${toggleTarget?.name} will be able to sign in again. Continue?`
        }
        confirmText={toggleTarget?.active ? 'Deactivate' : 'Activate'}
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
