import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MenuTopBar from '../../components/menu/MenuTopBar';
import OrderPanel from '../../components/menu/OrderPanel';
import Loader from '../../components/common/Loader';
import {
  ROUTES,
} from '../../constants';
import { useCart, useLocationContext } from '../../context';
import { useCategories, useFullMenu } from '../../hooks/useMenu';
import { formatCurrency } from '../../utils/format';
import './Menu.css';

const EXTRA_MENU_PILLS = [
  {
    id: 'best-sellers',
    name: 'Best Sellers',
    to: { pathname: ROUTES.HOME, hash: 'best-sellers' },
  },
  {
    id: 'deals',
    name: 'Deals',
    to: ROUTES.DEALS,
  },
];

function Menu() {
  const { branch } = useLocationContext();
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories(branch?.id);
  const { menu, loading, error } = useFullMenu(branch?.id);
  const categoryList = categories;
  const pillItems = useMemo(
    () => [...categoryList, ...EXTRA_MENU_PILLS],
    [categoryList]
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    searchParams.get('category') || categoryList[0]?.id
  );
  const [favorites, setFavorites] = useState(() => new Set());
  const scrollingByClick = useRef(false);

  const catalog = useMemo(() => {
    const map = {};
    const liveCategories = menu.categories?.length ? menu.categories : categoryList;

    liveCategories.forEach((category) => {
      map[category.id] = category.items?.length
        ? category.items
        : [];
    });

    return map;
  }, [menu.categories, categoryList]);

  const scrollToCategory = (categoryId, updateUrl = true) => {
    const section = document.getElementById(`category-${categoryId}`);
    if (!section) return;

    scrollingByClick.current = true;
    setActiveCategoryId(categoryId);

    if (updateUrl) {
      setSearchParams({ category: categoryId });
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      scrollingByClick.current = false;
    }, 700);
  };

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (!categoryFromUrl) return;

    const exists = categoryList.some((category) => category.id === categoryFromUrl);
    if (!exists) return;

    const timer = window.setTimeout(() => {
      scrollToCategory(categoryFromUrl, false);
    }, 80);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categoryList]);

  useEffect(() => {
    const sections = categoryList
      .map((category) => document.getElementById(`category-${category.id}`))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingByClick.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          const id = visible.target.id.replace('category-', '');
          setActiveCategoryId(id);
        }
      },
      {
        rootMargin: '-35% 0px -50% 0px',
        threshold: [0.15, 0.35, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categoryList]);

  const toggleFavorite = (id) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!branch?.id) {
    return (
      <section className="menu-explore page-container">
        <p>Select a delivery location first to view the live menu.</p>
      </section>
    );
  }

  return (
    <section className="menu-explore">
      <MenuTopBar
        categories={pillItems}
        activeCategoryId={activeCategoryId}
        onSelectCategory={scrollToCategory}
      />

      {loading && <Loader label="Loading menu..." />}
      {error && <p className="menu-explore__error">{error}</p>}
      {!loading && !error && !categoryList.length && (
        <p className="menu-explore__empty page-container">No menu categories available yet.</p>
      )}

      <div className="menu-explore__layout">
        <div className="menu-explore__main">
          {categoryList.map((category) => (
            <section
              key={category.id}
              id={`category-${category.id}`}
              className="menu-explore__section"
            >
              <h2>{category.name}</h2>

              <div className="menu-explore__grid">
                {(catalog[category.id] || []).map((item) => (
                  <article key={item.id} className="menu-explore__card">
                    <button
                      type="button"
                      className={
                        favorites.has(item.id)
                          ? 'menu-explore__fav is-active'
                          : 'menu-explore__fav'
                      }
                      aria-label="Toggle favorite"
                      onClick={() => toggleFavorite(item.id)}
                    >
                      ♥
                    </button>

                    <div className="menu-explore__media">
                      {item.image ? (
                        <img src={item.image} alt={item.name} loading="lazy" />
                      ) : (
                        <div className="menu-explore__placeholder">{item.name}</div>
                      )}
                    </div>

                    <div className="menu-explore__body">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <strong>
                        {item.originalPrice ? (
                          <>
                            <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '0.5rem' }}>
                              {formatCurrency(item.originalPrice)}
                            </span>
                            {formatCurrency(item.price)}
                          </>
                        ) : (
                          formatCurrency(item.price)
                        )}
                      </strong>
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        disabled={item.inStock === false}
                      >
                        {item.inStock === false ? 'Out of stock' : 'Add to cart'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="menu-explore__aside">
          <OrderPanel />
        </div>
      </div>
    </section>
  );
}

export default Menu;
