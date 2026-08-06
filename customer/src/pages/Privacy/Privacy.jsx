import BackButton from '../../components/common/BackButton';
import { APP_NAME, ROUTES } from '../../constants';
import '../Contact/Contact.css';

function Privacy() {
  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Privacy Policy</h1>
      <p>
        {APP_NAME} collects only the information needed to place and deliver
        your order — name, phone, delivery address, payment method, and
        location for nearest-branch assignment.
      </p>

      <div className="info-page__grid">
        <div>
          <h2>What we use</h2>
          <p>Order details, delivery location, and contact information.</p>
        </div>
        <div>
          <h2>Who receives it</h2>
          <p>
            Restaurant admin staff and the assigned rider for fulfillment only.
          </p>
        </div>
        <div>
          <h2>Your control</h2>
          <p>
            You can request order or contact data updates by emailing our
            support team.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Privacy;
