import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Loader from '../../components/common/Loader';
import { ROUTES } from '../../constants';
import { useCart, useLocationContext } from '../../context';
import { dealToCartItem } from '../../api/adapters';
import { useDeals } from '../../hooks/useDeals';
import { formatCurrency } from '../../utils/format';
import './Deals.css';

function Deals() {
  const { branch } = useLocationContext();
  const { addItem } = useCart();
  const { deals, loading, error } = useDeals(branch?.id);

  const handleAddToCart = (deal) => {
    const cartItem = dealToCartItem(deal);
    if (cartItem) addItem(cartItem);
  };

  return (
    <section className="deals-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Deals</h1>
      <p className="deals-page__intro">
        Live offers from the restaurant. Updates instantly when admin adds or changes deals.
      </p>

      {!branch?.id && !loading && deals.length === 0 && (
        <p>Select a delivery location on the home page to load branch-specific menu pricing.</p>
      )}

      {loading && <Loader label="Loading deals..." />}
      {error && <p>{error}</p>}

      <div className="deals-page__grid">
        {deals.map((deal) => (
          <article key={deal.id} className="deals-page__card">
            <div className="deals-page__media">
              {deal.image ? (
                <img src={deal.image} alt={deal.title} loading="lazy" />
              ) : (
                <div className="deals-page__placeholder">{deal.title}</div>
              )}
            </div>

            <div className="deals-page__body">
              {deal.badge && <span className="deals-page__badge">{deal.badge}</span>}
              <h2>{deal.title}</h2>
              {deal.detail || deal.description ? (
                <p>{deal.detail || deal.description}</p>
              ) : null}
              <p className="deals-page__price">
                {deal.originalPrice != null && deal.originalPrice > (deal.price ?? 0) && (
                  <span className="deals-page__price-old">
                    {formatCurrency(deal.originalPrice)}
                  </span>
                )}
                {deal.price != null
                  ? formatCurrency(deal.price)
                  : deal.discountType === 'fixed'
                    ? `${formatCurrency(deal.discountValue)} off`
                    : `${deal.discountValue}% off`}
              </p>
              {deal.canAddToCart && (
                <button type="button" onClick={() => handleAddToCart(deal)}>
                  Add to cart
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {!loading && deals.length === 0 && (
        <p>No active deals right now. Check back soon.</p>
      )}

      <p className="deals-page__footer-link">
        <Link to={ROUTES.MENU}>Browse full menu</Link>
      </p>
    </section>
  );
}

export default Deals;
