import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useCart } from '../../../context';
import { dealToCartItem } from '../../../api/adapters';
import { formatCurrency } from '../../../utils/format';
import './TopDeals.css';

function dealLabel(deal) {
  if (deal.price != null) return formatCurrency(deal.price);
  if (deal.discountType === 'fixed') {
    return `${formatCurrency(deal.discountValue)} off`;
  }
  if (deal.discountValue) return `${deal.discountValue}% off`;
  return 'Special offer';
}

function TopDeals({ deals = [] }) {
  const { addItem } = useCart();
  const list = (deals || []).slice(0, 3);

  const handleAddToCart = (deal) => {
    const cartItem = dealToCartItem(deal);
    if (!cartItem) return;
    addItem(cartItem);
  };

  if (!list.length) {
    return (
      <section id="top-deals" className="top-deals" aria-label="Top deals">
        <div className="top-deals__inner page-container">
          <div className="top-deals__head">
            <h2>
              <span>Top</span> Deals
            </h2>
            <Link to={ROUTES.DEALS} className="top-deals__view-all">
              View All
            </Link>
          </div>
          <p>No active deals right now. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="top-deals" className="top-deals" aria-label="Top deals">
      <div className="top-deals__inner page-container">
        <div className="top-deals__head">
          <h2>
            <span>Top</span> Deals
          </h2>
          <Link to={ROUTES.DEALS} className="top-deals__view-all">
            View All
          </Link>
        </div>

        <div className="top-deals__grid">
          {list.map((deal) => (
            <article key={deal.id} className="top-deals__card">
              <div className="top-deals__card-top">
                <span className="top-deals__badge" aria-hidden="true">
                  {deal.badge || 'YK'}
                </span>
              </div>

              <div className="top-deals__media">
                {deal.image ? (
                  <img
                    src={deal.image}
                    alt={deal.name || deal.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="top-deals__placeholder">{deal.name || deal.title}</div>
                )}
              </div>

              <div className="top-deals__body">
                <h3>{deal.name || deal.title}</h3>
                <p>{deal.description || deal.detail}</p>
                <strong>{dealLabel(deal)}</strong>
                {deal.canAddToCart ? (
                  <button type="button" onClick={() => handleAddToCart(deal)}>
                    Add to cart
                  </button>
                ) : (
                  <Link to={ROUTES.MENU} className="top-deals__menu-link">
                    Browse menu
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopDeals;
