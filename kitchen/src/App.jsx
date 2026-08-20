import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import KitchenDashboard from './pages/KitchenBoard';
import RiderBoard from './pages/RiderBoard';

function Guard({ children, riderOnly = false, kitchenOnly = false }) {
  const { isAuthenticated, isRider } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (riderOnly && !isRider) return <Navigate to="/" replace />;
  if (kitchenOnly && isRider) return <Navigate to="/rider" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated, isRider } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={isRider ? '/rider' : '/'} replace /> : <Login />
        }
      />
      <Route
        path="/"
        element={(
          <Guard kitchenOnly>
            <KitchenDashboard />
          </Guard>
        )}
      />
      <Route
        path="/rider"
        element={(
          <Guard riderOnly>
            <RiderBoard />
          </Guard>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
