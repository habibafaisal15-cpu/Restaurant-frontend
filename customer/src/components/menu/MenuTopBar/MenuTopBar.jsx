import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useNavDrawer } from '../../../context';
import { CustomerActionButtons } from '../../layout/CustomerPanels';
import CategoryPills from '../CategoryPills';
import './MenuTopBar.css';

function MenuTopBar({
  categories = [],
  activeCategoryId,
  onSelectCategory,
}) {
  const { toggleDrawer } = useNavDrawer();

  return (
    <header className="menu-top" aria-label="Menu navigation">
      <div className="menu-top__inner">
        <div className="menu-top__chrome">
          <nav className="menu-top__pill" aria-label="Page controls">
            <Link
              to={ROUTES.HOME}
              className="menu-top__icon"
              aria-label="Back to home"
            >
              ←
            </Link>

            <button
              type="button"
              className="menu-top__icon menu-top__icon--burger"
              aria-label="Open menu"
              onClick={toggleDrawer}
            >
              <span />
              <span />
              <span />
            </button>

            <span className="menu-top__divider" aria-hidden="true" />

            <h1 className="menu-top__title">Menu</h1>

            <CustomerActionButtons
              className="menu-top__actions"
              onOpenOrders={() =>
                window.dispatchEvent(new Event('open-customer-orders'))
              }
              onOpenNotifications={() =>
                window.dispatchEvent(new Event('open-customer-notifications'))
              }
            />
          </nav>
        </div>

        <CategoryPills
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={onSelectCategory}
        />
      </div>
    </header>
  );
}

export default MenuTopBar;
