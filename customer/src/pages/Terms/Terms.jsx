import BackButton from '../../components/common/BackButton';
import { APP_NAME, ROUTES } from '../../constants';
import '../Contact/Contact.css';

function Terms() {
  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Terms & Conditions</h1>
      <p>
        By placing an order with {APP_NAME}, you agree to provide accurate
        delivery and contact details, and accept that order confirmation,
        preparation, and rider assignment are handled by the restaurant admin.
      </p>

      <div className="info-page__grid">
        <div>
          <h2>Orders</h2>
          <p>
            Orders are confirmed after checkout and may be updated if items are
            unavailable at the assigned branch.
          </p>
        </div>
        <div>
          <h2>Payments</h2>
          <p>
            Selected payment methods must be completed as shown at checkout.
            Cash on delivery remains subject to rider confirmation.
          </p>
        </div>
        <div>
          <h2>Delivery</h2>
          <p>
            Delivery times depend on branch distance, preparation time, and
            rider availability.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Terms;
