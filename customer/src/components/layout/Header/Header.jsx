import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, ROUTES } from '../../../constants';
import {
  useLocationContext,
  useNavDrawer,
  useTheme,
} from '../../../context';
import { CustomerActionButtons } from '../CustomerPanels';
import './Header.css';

function ModeIcon({ theme }) {
  if (theme === 'night') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 4.5a.75.75 0 0 1 .75-.75h.1a7.75 7.75 0 1 1-8.1 8.1.75.75 0 0 1-.75-.85A8.5 8.5 0 0 0 12.75 3.75H12.5A.75.75 0 0 1 12 4.5z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 7.25a4.75 4.75 0 1 1 0 9.5 4.75 4.75 0 0 1 0-9.5zM12 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 2zm0 17a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 19zM4.22 4.22a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06L4.22 5.28a.75.75 0 0 1 0-1.06zm13.44 13.44a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06zM2 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2 12zm17 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 19 12zM4.22 19.78a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0zm13.44-13.44a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0z"
      />
    </svg>
  );
}

function Header({ variant = 'page' }) {
  const { theme, toggleTheme } = useTheme();
  const { hasLocation, isLocationModalOpen } = useLocationContext();
  const { drawerOpen, toggleDrawer, closeDrawer } = useNavDrawer();
  const isOverlay = variant === 'overlay';

  useEffect(() => {
    if (isOverlay) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeDrawer();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow =
      drawerOpen || isLocationModalOpen ? 'hidden' : '';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = isLocationModalOpen ? 'hidden' : '';
    };
  }, [drawerOpen, isLocationModalOpen, closeDrawer, isOverlay]);

  const ctaTo = hasLocation ? ROUTES.MENU : ROUTES.LOCATION;
  const ctaLabel = hasLocation ? 'Order now' : 'Set location';

  return (
    <header
      className={
        isOverlay ? 'app-header app-header--overlay' : 'app-header'
      }
    >
      <nav className="app-header__pill" aria-label="Primary">
        <button
          type="button"
          className={
            drawerOpen ? 'app-header__toggle is-open' : 'app-header__toggle'
          }
          aria-expanded={drawerOpen}
          aria-controls="site-menu-panel"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          onClick={toggleDrawer}
        >
          <span />
          <span />
          <span />
        </button>

        <Link
          to={ROUTES.HOME}
          className="app-header__brand"
          onClick={closeDrawer}
        >
          {APP_NAME}
        </Link>

        <div className="app-header__mid">
          <Link
            to={ROUTES.MENU}
            className="app-header__link"
            onClick={closeDrawer}
          >
            Menu
          </Link>

          <CustomerActionButtons
            onOpenOrders={() =>
              window.dispatchEvent(new Event('open-customer-orders'))
            }
            onOpenNotifications={() =>
              window.dispatchEvent(new Event('open-customer-notifications'))
            }
          />

          <button
            type="button"
            className="app-header__mode"
            onClick={toggleTheme}
            aria-label={
              theme === 'night' ? 'Switch to day mode' : 'Switch to night mode'
            }
            title={theme === 'night' ? 'Day mode' : 'Night mode'}
          >
            <ModeIcon theme={theme} />
          </button>
        </div>

        <Link to={ctaTo} className="app-header__cta" onClick={closeDrawer}>
          {ctaLabel}
        </Link>
      </nav>
    </header>
  );
}

export default Header;
