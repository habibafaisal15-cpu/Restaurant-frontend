import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useCart } from '../../../context';
import { formatCurrency } from '../../../utils/format';
import './BestSellers.css';

const ROTATE_MS = 1500;
const MAX_BEST_SELLERS = 3;

function BestSellers({ items = [] }) {
  const { addItem } = useCart();
  const list = useMemo(
    () => (items || []).slice(0, MAX_BEST_SELLERS),
    [items]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => (current >= list.length ? 0 : current));
  }, [list.length]);

  useEffect(() => {
    if (list.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % list.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [list.length]);

  if (!list.length) return null;

  return (
    <section
      id="best-sellers"
      className="best-sellers"
      aria-label="Best sellers"
    >
      <div className="best-sellers__inner page-container">
        <div className="best-sellers__head">
          <h2>
            <span>Best</span> Sellers
          </h2>
          <Link to={ROUTES.MENU} className="best-sellers__view-all">
            View All
          </Link>
        </div>

        <div className="best-sellers__stage">
          {list.map((item, index) => (
            <article
              key={item.id}
              className={
                index === activeIndex
                  ? 'best-sellers__card is-active'
                  : 'best-sellers__card'
              }
              aria-hidden={index !== activeIndex}
            >
              <div className="best-sellers__media">
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>
              <div className="best-sellers__body">
                <div className="best-sellers__copy">
                  <h3>{item.name}</h3>
                  <p>{formatCurrency(item.price)}</p>
                </div>
                <button type="button" onClick={() => addItem(item)}>
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="best-sellers__dots" role="tablist" aria-label="Best sellers">
          {list.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show ${item.name}`}
              className={
                index === activeIndex
                  ? 'best-sellers__dot is-active'
                  : 'best-sellers__dot'
              }
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BestSellers;
