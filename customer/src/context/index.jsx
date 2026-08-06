import { CartProvider } from './CartContext';
import { LocationProvider } from './LocationContext';
import { NavDrawerProvider } from './NavDrawerContext';
import { OrderProvider } from './OrderContext';
import { SiteSettingsProvider } from './SiteSettingsContext';
import { ThemeProvider } from './ThemeContext';

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <NavDrawerProvider>
          <LocationProvider>
            <CartProvider>
              <OrderProvider>{children}</OrderProvider>
            </CartProvider>
          </LocationProvider>
        </NavDrawerProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  );
}

export { useCart } from './CartContext';
export { useLocationContext } from './LocationContext';
export { useNavDrawer } from './NavDrawerContext';
export { useOrder } from './OrderContext';
export { useTheme } from './ThemeContext';
export { useSiteSettings } from './SiteSettingsContext';
