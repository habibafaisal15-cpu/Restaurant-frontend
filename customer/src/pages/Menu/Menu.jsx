import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MenuTopBar from '../../components/menu/MenuTopBar';
import OrderPanel from '../../components/menu/OrderPanel';
import Loader from '../../components/common/Loader';
import { useCart, useLocationContext } from '../../context';
import { dealToCartItem } from '../../api/adapters';
import { useFullMenu } from '../../hooks/useMenu';
import { formatCurrency } from '../../utils/format';
import './Menu.css';

const BEST_SELLERS_SECTION_ID = 'best-sellers';
const DEALS_SECTION_ID = 'deals';

const EXTRA_MENU_SECTIONS = [
  { id: BEST_SELLERS_SECTION_ID, name: 'Best Sellers' },
  { id: DEALS_SECTION_ID, name: 'Deals' },
];

function isDealsCategoryName(name) {
  return String(name || '').trim().toLowerCase() === 'deals';
}

function Menu() {
  const { branch } = useLocationContext();
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const { menu, loading, error } = useFullMenu(branch?.id);
  // Hide DB "Deals" category — marketing deals already render as one Deals section.
  const categoryList = useMemo(
    () => (menu.categories || []).filter((category) => !isDealsCategoryName(category.name)),
    [menu.categories],
  );
  const bestSellers = menu.bestSellers || [];
  const deals = menu.deals?.length
    ? menu.deals
    : menu.topSellingDeals || [];
  const sectionList = useMemo(
    () => [...categoryList, ...EXTRA_MENU_SECTIONS],
    [categoryList]
  );
  const pillItems = sectionList;
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

    const exists = sectionList.some((section) => section.id === categoryFromUrl);
    if (!exists) return;

    const timer = window.setTimeout(() => {
      scrollToCategory(categoryFromUrl, false);
    }, 80);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sectionList]);

  useEffect(() => {
    const sections = sectionList
      .map((section) => document.getElementById(`category-${section.id}`))
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
  }, [sectionList]);

  const toggleFavorite = (id) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddDeal = (deal) => {
    const cartItem = dealToCartItem(deal);
    if (cartItem) addItem(cartItem);
  };

  const renderMenuCard = (item) => (
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
        {item.description ? <p>{item.description}</p> : null}
        <strong>
          {item.originalPrice ? (
            <>
              <span className="menu-explore__price-old">
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
  );

  const renderDealCard = (deal) => (
    <article key={deal.id} className="menu-explore__card">
      <div className="menu-explore__media">
        {deal.image ? (
          <img src={deal.image} alt={deal.title} loading="lazy" />
        ) : (
          <div className="menu-explore__placeholder">{deal.title}</div>
        )}
      </div>

      <div className="menu-explore__body">
        {deal.badge ? <span className="menu-explore__deal-badge">{deal.badge}</span> : null}
        <h3>{deal.title}</h3>
        {deal.description || deal.detail ? (
          <p>{deal.description || deal.detail}</p>
        ) : null}
        <strong>
          {deal.originalPrice != null && deal.originalPrice > (deal.price ?? 0) && (
            <span className="menu-explore__price-old">
              {formatCurrency(deal.originalPrice)}
            </span>
          )}
          {deal.price != null
            ? formatCurrency(deal.price)
            : deal.discountType === 'fixed'
              ? `${formatCurrency(deal.discountValue)} off`
              : `${deal.discountValue}% off`}
        </strong>
        {deal.canAddToCart && (
          <button type="button" onClick={() => handleAddDeal(deal)}>
            Add to cart
          </button>
        )}
      </div>
    </article>
  );

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
                {(catalog[category.id] || []).map((item) => renderMenuCard(item))}
              </div>
            </section>
          ))}

          <section
            id={`category-${BEST_SELLERS_SECTION_ID}`}
            className="menu-explore__section"
          >
            <h2>Best Sellers</h2>
            {bestSellers.length ? (
              <div className="menu-explore__grid">
                {bestSellers.map((item) => renderMenuCard(item))}
              </div>
            ) : (
              <p className="menu-explore__section-empty">
                Best sellers will appear here once orders start coming in.
              </p>
            )}
          </section>

          <section
            id={`category-${DEALS_SECTION_ID}`}
            className="menu-explore__section"
          >
            <h2>Deals</h2>
            {deals.length ? (
              <div className="menu-explore__grid">
                {deals.map((deal) => renderDealCard(deal))}
              </div>
            ) : (
              <p className="menu-explore__section-empty">
                No active deals right now. Check back soon.
              </p>
            )}
          </section>
        </div>

        <aside className="menu-explore__aside">
          <OrderPanel />
        </aside>
      </div>
    </section>
  );
}

export default Menu;
