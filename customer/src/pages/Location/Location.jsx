import { useEffect } from 'react';
import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../constants';
import { useLocationContext } from '../../context';

function Location() {
  const { openLocationModal, hasLocation, location, branch } =
    useLocationContext();

  useEffect(() => {
    openLocationModal();
  }, [openLocationModal]);

  return (
    <section className="page page-container location-page">
      <BackButton label="Back to home" to={ROUTES.HOME} />
      <h1>Delivery location</h1>
      <p>
        Use the popup to set your location. We verify delivery coverage before
        saving it.
      </p>

      {hasLocation ? (
        <div style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
          <p>
            <strong style={{ color: 'var(--color-heading)' }}>Current:</strong>{' '}
            {location?.address}
          </p>
          {branch?.name && <p>Serving from: {branch.name}</p>}
          <button
            type="button"
            className="checkout-page__map-btn"
            onClick={openLocationModal}
            style={{ marginTop: '0.75rem' }}
          >
            Change location
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="checkout-page__map-btn"
          onClick={openLocationModal}
          style={{ marginTop: '0.75rem' }}
        >
          Open location popup
        </button>
      )}
    </section>
  );
}

export default Location;
