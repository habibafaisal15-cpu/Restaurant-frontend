import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  FolderInput,
  LayoutGrid,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ImageUploadField from '../components/ui/ImageUploadField';
import EmptyState from '../components/ui/EmptyState';
import * as menuService from '../services/menuService';
import * as categoryService from '../services/categoryService';
import { formatPKR } from '../utils/format';
import './MenuItems.css';

const TAG_OPTIONS = [
  { key: 'spicy', label: 'Spicy' },
  { key: 'popular', label: 'Popular' },
  { key: 'new', label: 'New' },
  { key: 'bestseller', label: 'Bestseller' },
];

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  discountPrice: '',
  image: '',
  available: true,
  active: true,
  tags: [],
};

export default function MenuItems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get('category') || 'all',
  );
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState(null);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [menuData, catData] = await Promise.all([
        menuService.getAll({ search: search || undefined }),
        categoryService.getAll(),
      ]);
      setItems(menuData);
      setCategories(catData.filter((c) => c.active));
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadData, search]);

  useEffect(() => {
    const fromUrl = searchParams.get('category');
    if (fromUrl && fromUrl !== categoryFilter) {
      setCategoryFilter(fromUrl);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCategory = (id) => {
    setCategoryFilter(id);
    setSelectedIds([]);
    const params = new URLSearchParams(searchParams);
    if (id && id !== 'all') params.set('category', id);
    else params.delete('category');
    setSearchParams(params, { replace: true });
  };

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryFilter) ?? null,
    [categories, categoryFilter],
  );

  const itemCountByCategory = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      map[item.categoryId] = (map[item.categoryId] ?? 0) + 1;
    });
    return map;
  }, [items]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filteredItems = useMemo(() => {
    let list = [...items];

    if (categoryFilter !== 'all') {
      list = list.filter((item) => item.categoryId === categoryFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'price') return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [items, categoryFilter, sortBy]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const openCreate = () => {
    if (categories.length === 0) {
      toast.error('Create a food category first (Chinese, Desi, Steak…)');
      return;
    }
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      categoryId:
        categoryFilter !== 'all' ? categoryFilter : categories[0]?.id ?? '',
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      categoryId: item.categoryId,
      description: item.description ?? '',
      price: String(item.price ?? ''),
      discountPrice: item.discountPrice != null ? String(item.discountPrice) : '',
      image: item.image ?? '',
      available: Boolean(item.available),
      active: Boolean(item.active),
      tags: [...(item.tags ?? [])],
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

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        description: form.description.trim(),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        image: form.image,
        available: form.available,
        active: form.active,
        tags: form.tags,
      };

      if (editingId) {
        await menuService.update(editingId, payload);
        toast.success('Menu item updated');
      } else {
        await menuService.create(payload);
        toast.success('Menu item created');
      }

      closeModal();
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      toast.error(err.message ?? 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await menuService.remove(deactivateId);
      toast.success('Item removed from menu');
      setConfirmOpen(false);
      setDeactivateId(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deactivateId));
      await loadData();
    } catch (err) {
      toast.error(err.message ?? 'Failed to remove item');
    }
  };

  const handleBulkAvailability = async (available) => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      await menuService.bulkUpdateAvailability(selectedIds, available);
      toast.success(`${selectedIds.length} item(s) marked ${available ? 'available' : 'unavailable'}`);
      setSelectedIds([]);
      await loadData();
    } catch {
      toast.error('Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkMove = async () => {
    if (!selectedIds.length || !bulkCategoryId) return;
    setBulkLoading(true);
    try {
      await menuService.bulkMoveCategory(selectedIds, bulkCategoryId);
      toast.success(`${selectedIds.length} item(s) moved`);
      setBulkMoveOpen(false);
      setBulkCategoryId('');
      setSelectedIds([]);
      await loadData();
    } catch {
      toast.error('Failed to move items');
    } finally {
      setBulkLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={
              filteredItems.length > 0 &&
              selectedIds.length === filteredItems.length
            }
            onChange={toggleSelectAll}
            aria-label="Select all"
          />
        ),
        render: (_, row) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={() => toggleSelect(row.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${row.name}`}
          />
        ),
      },
      {
        key: 'image',
        label: 'Image',
        render: (_, row) =>
          row.image ? (
            <img src={row.image} alt="" className="menu-item-thumb" />
          ) : (
            <div className="menu-item-thumb menu-item-thumb--empty" />
          ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (_, row) => (
          <div className="menu-item-name-cell">
            <span className="menu-item-name">{row.name}</span>
            {row.description && (
              <span className="menu-item-desc">{row.description.slice(0, 50)}</span>
            )}
          </div>
        ),
      },
      {
        key: 'categoryId',
        label: 'Category',
        render: (_, row) => categoryMap[row.categoryId] ?? '—',
      },
      {
        key: 'price',
        label: 'Price',
        sortable: true,
        render: (_, row) => (
          <div className="menu-item-price-cell">
            {row.discountPrice != null ? (
              <>
                <span className="menu-item-price-sale">{formatPKR(row.discountPrice)}</span>
                <span className="menu-item-price-old">{formatPKR(row.price)}</span>
              </>
            ) : (
              <span>{formatPKR(row.price)}</span>
            )}
          </div>
        ),
      },
      {
        key: 'available',
        label: 'Available',
        render: (_, row) =>
          row.available ? (
            <span className="menu-item-avail menu-item-avail--yes">Yes</span>
          ) : (
            <span className="menu-item-avail menu-item-avail--no">No</span>
          ),
      },
      {
        key: 'tags',
        label: 'Tags',
        render: (_, row) => (
          <div className="menu-item-tags">
            {(row.tags ?? []).slice(0, 3).map((tag) => (
              <span key={tag} className="menu-item-tag">
                {tag}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'active',
        label: 'Active',
        render: (_, row) =>
          row.active ? (
            <span className="menu-item-active">Active</span>
          ) : (
            <span className="menu-item-inactive">Inactive</span>
          ),
      },
      {
        key: 'actions',
        label: '',
        render: (_, row) => (
          <div className="menu-item-actions">
            <button
              type="button"
              className="btn-icon"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="btn-icon menu-item-delete-btn"
              title="Remove"
              onClick={(e) => {
                e.stopPropagation();
                setDeactivateId(row.id);
                setConfirmOpen(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [filteredItems, selectedIds, categoryMap],
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
        {saving ? 'Saving…' : editingId ? 'Update Item' : 'Create Item'}
      </button>
    </>
  );

  return (
    <div className="page menu-items-page">
      <div className="page-header">
        <div>
          <h1>Menu Items</h1>
          <p>
            All dishes live here — each item belongs under a food category (Chinese, Desi,
            Steak…)
          </p>
        </div>
        <div className="menu-items-header-actions">
          <Link to="/categories" className="btn btn-secondary">
            <LayoutGrid size={16} />
            Categories
          </Link>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} />
            {activeCategory ? `Add to ${activeCategory.name}` : 'Add Item'}
          </button>
        </div>
      </div>

      <div className="menu-items-hint panel animate-slide-up">
        Select a category, then add or edit dishes in that category. Add the first item to
        an empty category to fill out the menu.
      </div>

      {/* Category tabs = food groups */}
      <div className="tabs menu-category-tabs animate-slide-up">
        <button
          type="button"
          className={`tab ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategory('all')}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`tab ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
            <span className="menu-cat-count">{itemCountByCategory[cat.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {activeCategory && (
        <div className="menu-active-category animate-slide-up">
          Showing items in <strong>{activeCategory.name}</strong>
          {activeCategory.description ? ` — ${activeCategory.description}` : ''}
        </div>
      )}

      <div className="filters-bar animate-slide-up">
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="price">Sort: Price Low–High</option>
          <option value="price-desc">Sort: Price High–Low</option>
        </select>
      </div>

      {selectedIds.length > 0 && (
        <div className="menu-bulk-bar animate-slide-up">
          <span>{selectedIds.length} selected</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={bulkLoading}
            onClick={() => handleBulkAvailability(true)}
          >
            <CheckCircle size={14} />
            Mark Available
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={bulkLoading}
            onClick={() => handleBulkAvailability(false)}
          >
            <XCircle size={14} />
            Mark Unavailable
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={bulkLoading}
            onClick={() => setBulkMoveOpen(true)}
          >
            <FolderInput size={14} />
            Move Category
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedIds([])}
          >
            Clear
          </button>
        </div>
      )}

      <div className="panel animate-slide-up">
        {!loading && filteredItems.length === 0 ? (
          <EmptyState
            title={
              activeCategory
                ? `No items in ${activeCategory.name}`
                : 'No menu items found'
            }
            description={
              activeCategory && !search
                ? `Add the first dish to this category — it will appear on both Online and POS menus.`
                : search
                  ? 'Try adjusting your search or category filter'
                  : 'Create a food group under Categories first, then add items here.'
            }
            actionLabel={!search ? (activeCategory ? `Add to ${activeCategory.name}` : 'Add Item') : undefined}
            onAction={!search ? openCreate : undefined}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredItems}
            loading={loading}
            emptyMessage="No items match your filters"
            skeletonRows={8}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Menu Item' : 'New Menu Item'}
        footer={modalFooter}
        size="md"
      >
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="item-name">Name *</label>
            <input
              id="item-name"
              type="text"
              className="form-control"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="e.g. Chicken Biryani"
            />
          </div>
          <div className="form-group">
            <label htmlFor="item-category">Food category *</label>
            <select
              id="item-category"
              className="form-control"
              value={form.categoryId}
              onChange={(e) => updateForm('categoryId', e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="item-desc">Description</label>
          <textarea
            id="item-desc"
            className="form-control"
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder="Ingredients, serving size, etc."
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="item-price">Price (PKR) *</label>
            <input
              id="item-price"
              type="number"
              className="form-control"
              value={form.price}
              min={0}
              onChange={(e) => updateForm('price', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="item-discount">Discount Price (PKR)</label>
            <input
              id="item-discount"
              type="number"
              className="form-control"
              value={form.discountPrice}
              min={0}
              placeholder="Optional sale price"
              onChange={(e) => updateForm('discountPrice', e.target.value)}
            />
          </div>
        </div>

        <ImageUploadField
          label="Item Image"
          value={form.image}
          onChange={(v) => updateForm('image', v)}
          uploadFolder="products"
        />

        <div className="form-group">
          <label>Tags</label>
          <div className="menu-tag-checkboxes">
            {TAG_OPTIONS.map(({ key, label }) => (
              <label key={key} className="menu-tag-check">
                <input
                  type="checkbox"
                  checked={form.tags.includes(key)}
                  onChange={() => toggleTag(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="toggle-row">
            <div>
              <strong>Available</strong>
              <p className="form-hint">Can be ordered now</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => updateForm('available', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="toggle-row">
            <div>
              <strong>Active</strong>
              <p className="form-hint">Visible on menu</p>
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
        </div>
      </Modal>

      <Modal
        open={bulkMoveOpen}
        onClose={() => {
          setBulkMoveOpen(false);
          setBulkCategoryId('');
        }}
        title="Move to Category"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setBulkMoveOpen(false);
                setBulkCategoryId('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBulkMove}
              disabled={!bulkCategoryId || bulkLoading}
            >
              Move {selectedIds.length} item(s)
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="bulk-category">Target Category</label>
          <select
            id="bulk-category"
            className="form-control"
            value={bulkCategoryId}
            onChange={(e) => setBulkCategoryId(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove Menu Item"
        message="This will deactivate the item and hide it from the menu. Continue?"
        confirmText="Remove"
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
