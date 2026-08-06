import BackButton from '../../components/common/BackButton';
import { APP_NAME, ROUTES } from '../../constants';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import '../Contact/Contact.css';

function About() {
  const { restaurantName, tagline, address } = useSiteSettings();
  const brandName = restaurantName || APP_NAME;

  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>About {brandName}</h1>
      <p>
        {brandName} connects customers to the nearest restaurant branch so
        meals arrive fresher and faster. Browse live categories from the admin
        menu, checkout securely, and track your rider in real time.
      </p>
      <div className="info-page__grid">
        {tagline && (
          <div>
            <h2>Our promise</h2>
            <p>{tagline}</p>
          </div>
        )}
        {address && (
          <div>
            <h2>Location</h2>
            <p>{address}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default About;
