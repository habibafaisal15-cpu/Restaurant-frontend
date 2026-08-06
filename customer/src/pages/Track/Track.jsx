import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../constants';
import '../Contact/Contact.css';

function Track() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');

  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Track Order</h1>
      <p>Enter your tracking token from the order confirmation page.</p>

      <form
        className="order-form"
        style={{ marginTop: '1.5rem' }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!orderId.trim()) return;
          navigate(`/order/${orderId.trim()}`);
        }}
      >
        <label className="input-field" htmlFor="orderId">
          <span className="input-field__label">Tracking token</span>
          <input
            id="orderId"
            name="orderId"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Paste token from order confirmation"
            required
          />
        </label>
        <button type="submit">Track order</button>
      </form>
    </section>
  );
}

export default Track;
