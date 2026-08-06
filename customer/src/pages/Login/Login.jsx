import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../constants';
import '../Contact/Contact.css';

function Login() {
  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Login</h1>
      <p>
        Customer login will connect to the backend auth API. For now this page
        is ready for that integration.
      </p>
    </section>
  );
}

export default Login;
