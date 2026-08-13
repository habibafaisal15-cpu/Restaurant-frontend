import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, ShoppingCart, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import './TopBar.css';

const ROLE_LABELS = {
  admin: 'Store Admin',
  'store-admin': 'Store Admin',
  'super-admin': 'Super Admin',
  manager: 'Manager',
  cashier: 'Cashier',
};

function getInitials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar no-print">
      <div className="topbar-left">
        <div className="topbar-restaurant">
          <h1 className="topbar-restaurant-name">
            {settings?.restaurantName || 'Your Kitchen'}
          </h1>
          {settings?.tagline && (
            <p className="topbar-restaurant-tag">{settings.tagline}</p>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="btn btn-primary topbar-pos-btn"
          onClick={() => navigate('/pos')}
        >
          <ShoppingCart size={18} />
          <span>New Walk-in Order</span>
        </button>

        <button
          type="button"
          className="topbar-theme-btn btn-icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar" aria-hidden="true">
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <span>{getInitials(user?.name)}</span>
            )}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name || 'Admin'}</span>
            <span className="topbar-user-role">
              {ROLE_LABELS[user?.role] || user?.role || 'Admin'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="topbar-logout-btn btn-icon"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
