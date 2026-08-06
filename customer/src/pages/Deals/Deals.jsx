import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Loader from '../../components/common/Loader';
import { ROUTES } from '../../constants';
import { useCart, useLocationContext } from '../../context';
import { dealToCartItem } from '../../api/adapters';
import { useDeals } from '../../hooks/useDeals';
import { formatCurrency } from '../../utils/format';
import '../Contact/Contact.css';

function Deals() {
  const { branch } = useLocationContext();
  const { addItem } = useCart();
  const { deals, loading, error } = useDeals(branch?.id);

  const handleAddToCart = (deal) => {
    const cartItem = dealToCartItem(deal);
    if (cartItem) addItem(cartItem);
  };

  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Deals</h1>
      <p>Live offers from the restaurant. Updates instantly when admin adds or changes deals.</p>

      {!branch?.id && !loading && deals.length === 0 && (
        <p>Select a delivery location on the home page to load branch-specific menu pricing.</p>
      )}

      {loading && <Loader label="Loading deals..." />}
      {error && <p>{error}</p>}

      <div className="info-page__list">
        {deals.map((deal) => (
          <article key={deal.id}>
            {deal.image && (
              <img
                src={deal.image}
                alt={deal.title}
                style={{ width: '100%', maxWidth: 420, borderRadius: 12, marginBottom: '0.75rem' }}
              />
            )}
            <h2>{deal.title}</h2>
            <p>{deal.detail || deal.description}</p>
            <p>
              {deal.price != null
                ? formatCurrency(deal.price)
                : deal.discountType === 'fixed'
                  ? `${formatCurrency(deal.discountValue)} off`
                  : `${deal.discountValue}% off`}
            </p>
            {deal.canAddToCart ? (
              <button type="button" onClick={() => handleAddToCart(deal)}>
                Add to cart
              </button>
            ) : (
              <p>This deal is display-only. Browse the menu to order items.</p>
            )}
          </article>
        ))}

        {!loading && deals.length === 0 && (
          <p>No active deals right now. Check back soon.</p>
        )}
      </div>

      <p style={{ marginTop: '1.75rem' }}>
        <Link to={ROUTES.MENU}>Browse full menu</Link>
      </p>
    </section>
  );
}

export default Deals;
