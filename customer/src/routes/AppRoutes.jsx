import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { ROUTES } from '../constants';
import About from '../pages/About';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Contact from '../pages/Contact';
import Deals from '../pages/Deals';
import Home from '../pages/Home';
import Location from '../pages/Location';
import Login from '../pages/Login';
import Menu from '../pages/Menu';
import OrderTracking from '../pages/OrderTracking';
import Privacy from '../pages/Privacy';
import Promotions from '../pages/Promotions';
import Rewards from '../pages/Rewards';
import Terms from '../pages/Terms';
import Track from '../pages/Track';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOCATION} element={<Location />} />
        <Route path={ROUTES.MENU} element={<Menu />} />
        <Route path={ROUTES.CART} element={<Cart />} />
        <Route path={ROUTES.CHECKOUT} element={<Checkout />} />
        <Route path={ROUTES.TRACK} element={<Track />} />
        <Route path={ROUTES.ORDER_TRACKING} element={<OrderTracking />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />
        <Route path={ROUTES.PRIVACY} element={<Privacy />} />
        <Route path={ROUTES.TERMS} element={<Terms />} />
        <Route path={ROUTES.ABOUT} element={<About />} />
        <Route path={ROUTES.DEALS} element={<Deals />} />
        <Route path={ROUTES.PROMOTIONS} element={<Promotions />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REWARDS} element={<Rewards />} />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
