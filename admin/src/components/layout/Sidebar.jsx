import { NavLink } from 'react-router-dom';
import {
  Bike,
  Boxes,
  ChevronLeft,
  ChefHat,
  FileText,
  LayoutDashboard,
  MapPinned,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Online Orders', icon: ShoppingBag },
  { to: '/kitchen', label: 'Kitchen Board', icon: ChefHat },
  { to: '/pos', label: 'Place Walk-in Order', icon: ShoppingCart },
  { to: '/categories', label: 'Food Categories', icon: Package },
  { to: '/menu', label: 'Menu Items', icon: UtensilsCrossed },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/deals', label: 'Deals', icon: Tag },
  { to: '/riders', label: 'Riders', icon: Bike },
  { to: '/locations', label: 'Delivery Locations', icon: MapPinned },
  { to: '/slips', label: 'Receipts', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`sidebar no-print ${collapsed ? 'collapsed' : ''}`}
      aria-label="Main navigation"
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon" aria-hidden="true">
            <UtensilsCrossed size={20} strokeWidth={1.75} />
          </span>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Your Kitchen</span>
            <span className="sidebar-brand-tag">Admin</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                title={label}
              >
                <Icon size={20} strokeWidth={1.75} className="sidebar-link-icon" />
                <span className="sidebar-link-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        className="sidebar-squeeze-btn"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand' : 'Squeeze — icons only'}
      >
        <ChevronLeft size={16} strokeWidth={2.25} />
      </button>
    </aside>
  );
}
