import { Link } from 'react-router-dom';
import {
  APP_NAME,
  FOOTER_LEGAL_LINKS,
  ROUTES,
} from '../../../constants';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import loopsLogoDark from '../../../assets/brand/loops-logo-dark.png';
import loopsLogoLight from '../../../assets/brand/loops-logo-light.png';
import './Footer.css';

function Footer() {
  const { restaurantName, email, phone, address } = useSiteSettings();
  const brandName = restaurantName || APP_NAME;

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__block">
          <h3>Contact</h3>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
          )}
          {address && <p>{address}</p>}
          <Link to={ROUTES.CONTACT}>Contact page</Link>
        </div>

        <div className="app-footer__block">
          <h3>Legal</h3>
          {FOOTER_LEGAL_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="app-footer__bottom">
        <p className="app-footer__credit">
          <span>
            © {new Date().getFullYear()} {brandName}
          </span>
          <span className="app-footer__loops">
            <span className="app-footer__loops-label">Powered by</span>
            <span className="app-footer__loops-mark" aria-label="loops">
              <img
                className="app-footer__loops-logo app-footer__loops-logo--dark"
                src={loopsLogoDark}
                alt="loops"
              />
              <img
                className="app-footer__loops-logo app-footer__loops-logo--light"
                src={loopsLogoLight}
                alt=""
                aria-hidden="true"
              />
              <sup>®</sup>
            </span>
          </span>
        </p>
        <div className="app-footer__bottom-links">
          {FOOTER_LEGAL_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
