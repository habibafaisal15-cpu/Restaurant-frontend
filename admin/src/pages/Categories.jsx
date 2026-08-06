import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UtensilsCrossed,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ImageUploadField from '../components/ui/ImageUploadField';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import * as categoryService from '../services/categoryService';
import * as menuService from '../services/menuService';
import { formatPKR } from '../utils/format';
import './Categories.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  image: '',
  heroImage: '',
  heroTitle: '',
  showInHero: false,
  active: true,
  sortOrder: 1,
};

const EMPTY_ITEM_DRAFT = { name: '', price: '', description: '' };

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [itemDrafts, setItemDrafts] = useState([{ ...EMPTY_ITEM_DRAFT }]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, menu] = await Promise.all([
        categoryService.getAll(),
        menuService.getAll({}),
      ]);
      setCategories(cats);
      setItems(menu);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const itemsByCategory = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (!map[item.categoryId]) map[item.categoryId] = [];
      map[item.categoryId].push(item);
    });
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [categories, search]);

  const openCreate = () => {
    const maxSort = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: maxSort + 1 });
    setItemDrafts([{ ...EMPTY_ITEM_DRAFT }]);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      image: cat.image ?? '',
      heroImage: cat.heroImage ?? '',
      heroTitle: cat.heroTitle ?? cat.name,
      showInHero: Boolean(cat.showInHero),
      active: Boolean(cat.active),
      sortOrder: cat.sortOrder ?? 1,
    });
    setItemDrafts([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setItemDrafts([{ ...EMPTY_ITEM_DRAFT }]);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDraft = (index, field, value) => {
    setItemDrafts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addDraftRow = () => {
    setItemDrafts((prev) => [...prev, { ...EMPTY_ITEM_DRAFT }]);
  };

  const removeDraftRow = (index) => {
    setItemDrafts((prev) =>
      prev.length === 1 ? [{ ...EMPTY_ITEM_DRAFT }] : prev.filter((_, i) => i !== index),
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required (e.g. Chinese, Desi, Steak)');
      return;
    }

    const draftsToCreate = !editingId
      ? itemDrafts.filter((d) => d.name.trim() && Number(d.price) > 0)
      : [];

    const incomplete = !editingId
      ? itemDrafts.filter(
          (d) =>
            (d.name.trim() && !(Number(d.price) > 0)) ||
            (!d.name.trim() && Number(d.price) > 0),
        )
      : [];

    if (incomplete.length) {
      toast.error('Each new item needs both a name and a valid price');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        heroTitle: form.heroTitle.trim() || form.name.trim(),
        sortOrder: Number(form.sortOrder) || 1,
      };

      let categoryId = editingId;

      if (editingId) {
        await categoryService.update(editingId, payload);
        toast.success('Category updated');
      } else {
        const created = await categoryService.create(payload);
        categoryId = created.id;

        for (const draft of draftsToCreate) {
          await menuService.create({
            name: draft.name.trim(),
            categoryId,
            description: draft.description?.trim() ?? '',
            price: Number(draft.price),
            available: true,
            active: true,
            tags: [],
            image: '',
          });
        }

        toast.success(
          draftsToCreate.length
            ? `Category “${payload.name}” created with ${draftsToCreate.length} item(s)`
            : `Category “${payload.name}” created — add items next`,
        );
      }

      closeModal();
      await loadData();

      if (!editingId && draftsToCreate.length === 0 && categoryId) {
        navigate(`/menu?category=${categoryId}`);
      }
    } catch (err) {
      toast.error(err.message ?? 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await categoryService.remove(deactivateId);
      toast.success('Category deactivated');
      setConfirmOpen(false);
      setDeactivateId(null);
      await loadData();
    } catch (err) {
      toast.error(err.message ?? 'Failed to deactivate category');
    }
  };

  if (loading) {
    return (
      <div className="page categories-page categories-page--loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page categories-page">
      <div className="page-header">
        <div>
          <h1>Food Categories</h1>
          <p>
            Categories jaise Chinese, Desi, Steak — har category ke andar uske menu items
            hote hain. Saari items mil kar poora menu banati hain.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="filters-bar animate-slide-up">
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link to="/menu" className="btn btn-secondary btn-sm">
          <UtensilsCrossed size={15} />
          All menu items
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="panel animate-slide-up">
          <EmptyState
            title="No categories yet"
            description="Create a food category like Chinese, Desi, or Steak, then add items under it."
            actionLabel="Add Category"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="categories-grid animate-slide-up">
          {filtered.map((cat) => {
            const catItems = itemsByCategory[cat.id] ?? [];
            return (
              <article
                key={cat.id}
                className={`categories-card panel ${cat.active ? '' : 'is-inactive'}`}
              >
                <div className="categories-card-media">
                  {cat.image ? (
                    <img src={cat.image} alt="" />
                  ) : (
                    <div className="categories-card-placeholder">
                      <UtensilsCrossed size={28} />
                    </div>
                  )}
                  {!cat.active && <span className="categories-inactive-pill">Inactive</span>}
                </div>

                <div className="categories-card-body">
                  <div className="categories-card-top">
                    <h3>{cat.name}</h3>
                    <span className="categories-card-count">
                      {catItems.length} item{catItems.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="categories-card-desc">
                    {cat.description || 'No description yet'}
                  </p>

                  <div className="categories-card-items">
                    {catItems.length === 0 ? (
                      <p className="categories-card-empty-items">
                        No items in this category yet
                      </p>
                    ) : (
                      <ul>
                        {catItems.slice(0, 4).map((item) => (
                          <li key={item.id}>
                            <span>{item.name}</span>
                            <span>{formatPKR(item.discountPrice ?? item.price)}</span>
                          </li>
                        ))}
                        {catItems.length > 4 && (
                          <li className="categories-card-more">
                            +{catItems.length - 4} more dishes
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="categories-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/menu?category=${cat.id}`)}
                    >
                      {catItems.length ? 'Manage items' : 'Add items'}
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    {cat.active && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        title="Deactivate"
                        onClick={() => {
                          setDeactivateId(cat.id);
                          setConfirmOpen(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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
        title={editingId ? 'Edit Category' : 'New Food Category'}
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
              {saving
                ? 'Saving…'
                : editingId
                  ? 'Update Category'
                  : itemDrafts.some((d) => d.name.trim() && Number(d.price) > 0)
                    ? 'Create + Save Items'
                    : 'Create Category'}
            </button>
          </>
        }
        size="md"
      >
        <div className="categories-modal-form">
          <p className="categories-modal-hint">
            Example: <strong>Chinese</strong>, <strong>Desi</strong>, <strong>Steak</strong>…
          </p>

          <div className="form-group">
            <label htmlFor="cat-name">Category name *</label>
            <input
              id="cat-name"
              type="text"
              className="form-control"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="e.g. Chinese"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              className="form-control"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Short description (optional)"
              rows={1}
            />
          </div>

          <ImageUploadField
            label="Category image"
            value={form.image}
            onChange={(v) => updateForm('image', v)}
            uploadFolder="categories"
          />

          <div className="categories-toggles">
            <div className="toggle-row">
              <div>
                <strong>Active</strong>
                <p className="form-hint">Show on menu / POS</p>
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
                <strong>Show in Hero</strong>
                <p className="form-hint">Customer homepage</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.showInHero}
                  onChange={(e) => updateForm('showInHero', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {!editingId && (
            <div className="categories-items-draft">
              <div className="categories-items-draft-head">
                <h4>Add items to this category</h4>
                <p>Name + price likho. Neeche se aur rows add kar sakte ho.</p>
              </div>

              {itemDrafts.map((draft, index) => (
                <div key={index} className="categories-draft-row">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Item ${index + 1} name`}
                    value={draft.name}
                    onChange={(e) => updateDraft(index, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="PKR"
                    min={1}
                    value={draft.price}
                    onChange={(e) => updateDraft(index, 'price', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeDraftRow(index)}
                    aria-label="Remove item row"
                    disabled={itemDrafts.length === 1 && !draft.name && !draft.price}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-primary btn-sm categories-add-item-btn"
                onClick={addDraftRow}
              >
                <Plus size={14} />
                Add item row
              </button>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate Category"
        message="Category hide ho jayegi. Uske items rahenge lekin customers ko nahi dikhenge jab tak category inactive hai."
        confirmText="Deactivate"
        cancelText="Cancel"
        danger
        onConfirm={handleDeactivate}
        onCancel={() => {
          setConfirmOpen(false);
          setDeactivateId(null);
        }}
      />
    </div>
  );
}
