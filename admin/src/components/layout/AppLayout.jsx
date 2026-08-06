import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { connectAdminSocket, disconnectAdminSocket, onAdminOrderEvents } from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import './AppLayout.css';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('yk_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    connectAdminSocket();
    const unsubscribe = onAdminOrderEvents(() => {
      setRefreshKey((k) => k + 1);
    });

    return () => {
      unsubscribe();
      disconnectAdminSocket();
    };
  }, [isAuthenticated]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('yk_sidebar_collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className="app-layout-main">
        <TopBar />

        <main className="app-layout-content">
          <Outlet context={{ refreshKey }} />
        </main>
      </div>
    </div>
  );
}
