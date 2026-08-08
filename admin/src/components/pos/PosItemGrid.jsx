import { useState, useMemo } from 'react';
import { Search, Plus, ImageOff } from 'lucide-react';
import './PosItemGrid.css';

function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(price ?? 0));
}

export default function PosItemGrid({
  items = [],
  categories = [],
  onAddItem,
  currency = 'USD',
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const availableItems = useMemo(
    () => items.filter((item) => item.available !== false && item.isAvailable !== false),
    [items],
  );

  const categoryList = useMemo(() => {
    if (categories.length) return categories;

    const seen = new Map();
    availableItems.forEach((item) => {
      const cat = item.category ?? item.categoryName ?? 'Other';
      const id = item.categoryId ?? cat;
      if (!seen.has(id)) seen.set(id, { id, name: cat });
    });
    return Array.from(seen.values());
  }, [categories, availableItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return availableItems.filter((item) => {
      const catId = item.categoryId ?? item.category ?? item.categoryName;
      const catMatch =
        activeCategory === 'all' ||
        String(catId) === String(activeCategory) ||
        (item.categoryName ?? item.category) ===
          categoryList.find((c) => String(c.id) === String(activeCategory))?.name;

      if (!catMatch) return false;
      if (!q) return true;

      const name = (item.name ?? '').toLowerCase();
      const desc = (item.description ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [availableItems, search, activeCategory, categoryList]);

  return (
    <div className="pos-item-grid">
      <div className="pos-item-grid__controls">
        <div className="search-input pos-item-grid__search">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search menu items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pos-item-grid__chips">
          <button
            type="button"
            className={`pos-item-grid__chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categoryList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pos-item-grid__chip ${String(activeCategory) === String(cat.id) ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="pos-item-grid__empty">
          <p>No items match your search</p>
        </div>
      ) : (
        <div className="pos-item-grid__grid">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="pos-item-grid__card"
              onClick={() => onAddItem?.(item)}
            >
              <div className="pos-item-grid__image-wrap">
                {item.image ?? item.imageUrl ? (
                  <img
                    src={item.image ?? item.imageUrl}
                    alt=""
                    className="pos-item-grid__image"
                    loading="lazy"
                  />
                ) : (
                  <div className="pos-item-grid__image-fallback">
                    <ImageOff size={20} strokeWidth={1.25} />
                  </div>
                )}
                <span className="pos-item-grid__add-badge">
                  <Plus size={13} />
                </span>
              </div>
              <div className="pos-item-grid__info">
                <span className="pos-item-grid__name">{item.name}</span>
                <span className="pos-item-grid__price">
                  {formatPrice(item.price, currency)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
