import BackButton from '../../components/common/BackButton';
import { APP_NAME, ROUTES } from '../../constants';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import './Contact.css';

function formatOpeningHours(openingHours) {
  if (!openingHours || typeof openingHours !== 'object') return [];

  return Object.entries(openingHours).map(([day, hours]) => {
    if (hours?.closed) {
      return `${day}: Closed`;
    }
    return `${day}: ${hours?.open || '—'} – ${hours?.close || '—'}`;
  });
}

function Contact() {
  const { restaurantName, email, phone, address, settings } = useSiteSettings();
  const brandName = restaurantName || APP_NAME;
  const hours = formatOpeningHours(settings?.openingHours);

  return (
    <section className="info-page page-container">
      <BackButton label="Back" to={ROUTES.HOME} />
      <h1>Contact</h1>
      <p>Questions about an order or branch? Reach the {brandName} team anytime.</p>

      <div className="info-page__grid">
        {email && (
          <div>
            <h2>Email</h2>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
        )}
        {phone && (
          <div>
            <h2>Phone</h2>
            <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
          </div>
        )}
        {address && (
          <div>
            <h2>Location</h2>
            <p>{address}</p>
          </div>
        )}
        {hours.length > 0 && (
          <div>
            <h2>Opening hours</h2>
            <ul>
              {hours.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default Contact;
