import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LocationModal from '../../location/LocationModal';
import { ROUTES } from '../../../constants';
import { useLocationContext, useNavDrawer } from '../../../context';
import Footer from '../Footer';
import Header from '../Header';
import SideDrawer from '../SideDrawer';
import {
  NotificationsSidePanel,
  OrdersSidePanel,
} from '../CustomerPanels';
import './MainLayout.css';

function MainLayout() {
  const { pathname } = useLocation();
  const { drawerOpen, closeDrawer } = useNavDrawer();
  const { isLocationModalOpen } = useLocationContext();
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isHome = pathname === ROUTES.HOME;
  const isMenu = pathname === ROUTES.MENU;
  const isCart = pathname === ROUTES.CART;
  const isCheckout = pathname === ROUTES.CHECKOUT;
  const hideChromeHeader = isHome || isMenu || isCart || isCheckout;

  useEffect(() => {
    if (!hideChromeHeader) return undefined;

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
  }, [hideChromeHeader, drawerOpen, isLocationModalOpen, closeDrawer]);

  useEffect(() => {
    const openOrders = () => setOrdersOpen(true);
    const openNotifications = () => setNotificationsOpen(true);
    window.addEventListener('open-customer-orders', openOrders);
    window.addEventListener('open-customer-notifications', openNotifications);
    return () => {
      window.removeEventListener('open-customer-orders', openOrders);
      window.removeEventListener('open-customer-notifications', openNotifications);
    };
  }, []);

  const layoutClass = isHome
    ? 'main-layout main-layout--home'
    : isMenu
      ? 'main-layout main-layout--menu'
      : isCart
        ? 'main-layout main-layout--cart'
        : isCheckout
          ? 'main-layout main-layout--checkout'
          : 'main-layout';

  return (
    <div className={layoutClass}>
      {!hideChromeHeader && <Header />}
      <main className="main-layout__content">
        <Outlet />
      </main>
      <Footer />
      <SideDrawer open={drawerOpen} onClose={closeDrawer} />
      <LocationModal />
      <OrdersSidePanel open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      <NotificationsSidePanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}

export default MainLayout;
