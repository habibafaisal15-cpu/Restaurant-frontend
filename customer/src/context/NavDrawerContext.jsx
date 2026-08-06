import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NavDrawerContext = createContext(null);

export function NavDrawerProvider({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    () => setDrawerOpen((open) => !open),
    []
  );

  const value = useMemo(
    () => ({
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [drawerOpen, openDrawer, closeDrawer, toggleDrawer]
  );

  return (
    <NavDrawerContext.Provider value={value}>
      {children}
    </NavDrawerContext.Provider>
  );
}

export function useNavDrawer() {
  const context = useContext(NavDrawerContext);
  if (!context) {
    throw new Error('useNavDrawer must be used within NavDrawerProvider');
  }
  return context;
}
