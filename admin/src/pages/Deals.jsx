import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ImageUploadField from '../components/ui/ImageUploadField';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import * as dealService from '../services/dealService';
import { formatPKR } from '../utils/format';
import './Deals.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  image: '',
  badge: '',
  active: true,
  showOnCustomer: true,
};

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeId, setRemoveId] = useState(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dealService.getAll({ search: search || undefined });
      setDeals(data);
    } catch {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadDeals, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [loadDeals, search]);

  const filtered = useMemo(() => {
    let list = [...deals];
    if (filter === 'live') {
      list = list.filter((d) => d.active && d.showOnCustomer);
    } else if (filter === 'hidden') {
      list = list.filter((d) => !d.showOnCustomer || !d.active);
    }
    return list;
  }, [deals, filter]);

  const liveCount = deals.filter((d) => d.active && d.showOnCustomer).length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (deal) => {
    setEditingId(deal.id);
    setForm({
      title: deal.title ?? '',
      description: deal.description ?? '',
      price: String(deal.price ?? ''),
      originalPrice: deal.originalPrice != null ? String(deal.originalPrice) : '',
      image: deal.image ?? '',
      badge: deal.badge ?? '',
      active: Boolean(deal.active),
      showOnCustomer: Boolean(deal.showOnCustomer),
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
    if (!form.title.trim()) {
      toast.error('Deal title is required');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Enter a valid deal price');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : '',
        image: form.image.trim(),
        badge: form.badge.trim(),
        active: form.active,
        showOnCustomer: form.showOnCustomer,
      };

      if (editingId) {
        await dealService.update(editingId, payload);
        toast.success('Deal updated — customer site will show the latest');
      } else {
        await dealService.create(payload);
        toast.success(
          form.showOnCustomer
            ? 'Deal created & live for customers'
            : 'Deal created (hidden from customers)',
        );
      }

      closeModal();
      await loadDeals();
    } catch (err) {
      toast.error(err.message ?? 'Failed to save deal');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;
    try {
      await dealService.remove(removeId);
      toast.success('Deal deactivated');
      setConfirmOpen(false);
      setRemoveId(null);
      await loadDeals();
    } catch (err) {
      toast.error(err.message ?? 'Failed to remove deal');
    }
  };

  const toggleCustomer = async (deal) => {
    try {
      await dealService.update(deal.id, {
        showOnCustomer: !deal.showOnCustomer,
        active: !deal.showOnCustomer ? true : deal.active,
      });
      toast.success(
        !deal.showOnCustomer ? 'Deal now visible on customer site' : 'Deal hidden from customers',
      );
      await loadDeals();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update deal');
    }
  };

  if (loading && deals.length === 0) {
    return (
      <div className="page deals-page deals-page--loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page deals-page">
      <div className="page-header">
        <div>
          <h1>Deals</h1>
          <p>
            New deals yahan banao — title, price, description. Active deals customer website pe
            show hongi.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Deal
        </button>
      </div>

      <div className="deals-hint panel animate-slide-up">
        <Tag size={16} />
        <span>
          <strong>{liveCount}</strong> deal{liveCount === 1 ? '' : 's'} currently live for customers.
          Toggle “Show on customer” to publish or hide.
        </span>
      </div>

      <div className="filters-bar animate-slide-up">
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search deals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs deals-filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'live', label: 'Live on customer' },
            { key: 'hidden', label: 'Hidden' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`tab ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel animate-slide-up">
          <EmptyState
            title="No deals yet"
            description="Create a deal with price & details — customers will see it on the website."
            actionLabel="Add Deal"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="deals-grid animate-slide-up">
          {filtered.map((deal) => {
            const live = deal.active && deal.showOnCustomer;
            return (
              <article key={deal.id} className={`deals-card panel ${live ? '' : 'is-hidden'}`}>
                <div className="deals-card-media">
                  {deal.image ? (
                    <img src={deal.image} alt="" />
                  ) : (
                    <div className="deals-card-placeholder">
                      <Tag size={28} />
                    </div>
                  )}
                  {deal.badge && <span className="deals-badge">{deal.badge}</span>}
                  <span className={`deals-live-pill ${live ? 'is-live' : ''}`}>
                    {live ? 'Live on customer' : 'Hidden'}
                  </span>
                </div>

                <div className="deals-card-body">
                  <h3>{deal.title}</h3>
                  <p className="deals-card-desc">
                    {deal.description || 'No description'}
                  </p>
                  <div className="deals-card-price">
                    <span className="deals-price-now">{formatPKR(deal.price)}</span>
                    {deal.originalPrice != null && deal.originalPrice > deal.price && (
                      <span className="deals-price-old">{formatPKR(deal.originalPrice)}</span>
                    )}
                  </div>

                  <div className="deals-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(deal)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleCustomer(deal)}
                      title={live ? 'Hide from customers' : 'Show on customer site'}
                    >
                      {live ? <EyeOff size={14} /> : <Eye size={14} />}
                      {live ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setRemoveId(deal.id);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Deal' : 'New Deal'}
        size="md"
        footer={
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
              {saving ? 'Saving…' : editingId ? 'Update Deal' : 'Create Deal'}
            </button>
          </>
        }
      >
        <div className="deals-form">
          <p className="deals-form-hint">
            Yeh deal customer website pe dikhegi jab “Show on customer” on ho.
          </p>

          <div className="form-group">
            <label htmlFor="deal-title">Deal title *</label>
            <input
              id="deal-title"
              type="text"
              className="form-control"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              placeholder="e.g. Family Steak Combo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deal-desc">Description / details *</label>
            <textarea
              id="deal-desc"
              className="form-control"
              rows={3}
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="What's included in this deal…"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deal-price">Deal price (PKR) *</label>
              <input
                id="deal-price"
                type="number"
                className="form-control"
                min={1}
                value={form.price}
                onChange={(e) => updateForm('price', e.target.value)}
                placeholder="899"
              />
            </div>
            <div className="form-group">
              <label htmlFor="deal-original">Original price (optional)</label>
              <input
                id="deal-original"
                type="number"
                className="form-control"
                min={0}
                value={form.originalPrice}
                onChange={(e) => updateForm('originalPrice', e.target.value)}
                placeholder="1150"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="deal-badge">Badge label</label>
            <input
              id="deal-badge"
              type="text"
              className="form-control"
              value={form.badge}
              onChange={(e) => updateForm('badge', e.target.value)}
              placeholder="e.g. 20% OFF, Limited, Family Pack"
            />
          </div>

          <ImageUploadField
            label="Deal image"
            value={form.image}
            onChange={(v) => updateForm('image', v)}
            uploadFolder="deals"
          />

          <div className="deals-toggles">
            <div className="toggle-row">
              <div>
                <strong>Active</strong>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => updateForm('active', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="toggle-row">
              <div>
                <strong>Show on customer</strong>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.showOnCustomer}
                  onChange={(e) => updateForm('showOnCustomer', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate deal"
        message="Deal customer site se hide ho jayegi. Continue?"
        confirmText="Deactivate"
        danger
        onConfirm={handleRemove}
        onCancel={() => {
          setConfirmOpen(false);
          setRemoveId(null);
        }}
      />
    </div>
  );
}
