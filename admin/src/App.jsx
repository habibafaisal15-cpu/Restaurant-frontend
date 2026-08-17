import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const POS = lazy(() => import('./pages/POS'));
const Categories = lazy(() => import('./pages/Categories'));
const MenuItems = lazy(() => import('./pages/MenuItems'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Deals = lazy(() => import('./pages/Deals'));
const Riders = lazy(() => import('./pages/Riders'));
const Slips = lazy(() => import('./pages/Slips'));
const Reports = lazy(() => import('./pages/Reports'));
const Staff = lazy(() => import('./pages/Staff'));
const Settings = lazy(() => import('./pages/Settings'));
const DeliveryLocations = lazy(() => import('./pages/DeliveryLocations'));

function PageLoader() {
  return (
    <div className="auth-loading">
      <div className="auth-spinner" aria-hidden="true" />
      <p>Loading page…</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="pos" element={<POS />} />
          <Route path="categories" element={<Categories />} />
          <Route path="menu" element={<MenuItems />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="deals" element={<Deals />} />
          <Route path="riders" element={<Riders />} />
          <Route path="locations" element={<DeliveryLocations />} />
          <Route path="slips" element={<Slips />} />
          <Route path="reports" element={<Reports />} />
          <Route path="staff" element={<Staff />} />
          <Route path="settings" element={<Settings />} />
          <Route path="hero" element={<Navigate to="/settings" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
