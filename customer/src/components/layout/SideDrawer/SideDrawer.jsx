import { Link } from 'react-router-dom';
import {
  ROUTES,
  SIDE_MENU_PRIMARY,
  SIDE_MENU_SECONDARY,
} from '../../../constants';
import './SideDrawer.css';

function MenuIcon({ name }) {
  if (name === 'locator') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
        />
      </svg>
    );
  }

  if (name === 'track') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 4h12a2 2 0 0 1 2 2v7H4V4zm0 11h14v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zm13.5-3.5a3.5 3.5 0 1 0 1.4 6.7l2.1 2.1 1.4-1.4-2.1-2.1a3.5 3.5 0 0 0-2.8-5.3zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"
      />
    </svg>
  );
}

function SideDrawer({ open, onClose }) {
  return (
    <>
      <button
        type="button"
        className={open ? 'side-drawer__backdrop is-open' : 'side-drawer__backdrop'}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <aside
        id="site-menu-panel"
        className={open ? 'side-drawer is-open' : 'side-drawer'}
        aria-hidden={!open}
      >
        <nav className="side-drawer__secondary" aria-label="More links">
          {SIDE_MENU_SECONDARY.map((item) => (
            <Link key={item.to} to={item.to} onClick={onClose}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="side-drawer__divider" />

        <nav className="side-drawer__primary" aria-label="Main actions">
          {SIDE_MENU_PRIMARY.map((item) => (
            <Link key={item.to} to={item.to} onClick={onClose}>
              <span className="side-drawer__icon">
                <MenuIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="side-drawer__footer">
          <Link to={ROUTES.LOGIN} className="side-drawer__login" onClick={onClose}>
            Login
          </Link>
        </div>
      </aside>
    </>
  );
}

export default SideDrawer;
