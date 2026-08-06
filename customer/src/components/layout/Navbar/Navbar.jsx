import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../../../constants';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="app-navbar" aria-label="Dashboard navigation">
      <div className="app-navbar__inner">
        <ul className="app-navbar__list">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'app-navbar__link is-active' : 'app-navbar__link'
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
