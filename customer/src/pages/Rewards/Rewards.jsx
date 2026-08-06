import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../constants';
import '../Contact/Contact.css';

function Rewards() {
  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>My Rewards</h1>
      <p>
        Rewards and loyalty points will appear here once the admin rewards API
        is connected.
      </p>
    </section>
  );
}

export default Rewards;
