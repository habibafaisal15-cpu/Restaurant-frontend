import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Loader from '../../components/common/Loader';
import { ROUTES } from '../../constants';
import { useLocationContext } from '../../context';
import { useDeals } from '../../hooks/useDeals';
import { formatCurrency } from '../../utils/format';
import '../Contact/Contact.css';

function Promotions() {
  const { branch } = useLocationContext();
  const { deals, loading, error } = useDeals(branch?.id);

  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Promotions</h1>
      <p>Live promotions from the restaurant backend.</p>

      {!branch?.id && (
        <p>Select a delivery location on the home page to load promotions.</p>
      )}

      {loading && <Loader label="Loading promotions..." />}
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
              {deal.discountType === 'fixed'
                ? `${formatCurrency(deal.discountValue)} off`
                : `${deal.discountValue}% off`}
            </p>
          </article>
        ))}

        {!loading && branch?.id && deals.length === 0 && (
          <p>No active promotions right now.</p>
        )}
      </div>

      <p style={{ marginTop: '1.75rem' }}>
        <Link to={ROUTES.DEALS}>See deals</Link>
        {' · '}
        <Link to={ROUTES.MENU}>Browse menu</Link>
      </p>
    </section>
  );
}

export default Promotions;
