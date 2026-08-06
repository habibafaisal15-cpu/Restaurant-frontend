export const APP_NAME = 'Your Kitchen';

export const STORAGE_KEYS = {
  LOCATION: 'customer_location',
  BRANCH: 'selected_branch',
  BRANCH_ID: 'selected_branch_id',
  CART: 'customer_cart',
  ORDER_ID: 'active_order_id',
  THEME: 'site_theme',
  LOCATION_PROMPT_DISMISSED: 'location_prompt_dismissed',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  RIDER_ASSIGNED: 'rider_assigned',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ROUTES = {
  HOME: '/',
  LOCATION: '/location',
  MENU: '/menu',
  CART: '/cart',
  CHECKOUT: '/checkout',
  TRACK: '/track',
  ORDER_TRACKING: '/order/:orderId',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ABOUT: '/about',
  DEALS: '/deals',
  PROMOTIONS: '/promotions',
  LOGIN: '/login',
  REWARDS: '/rewards',
};

export const SIDE_MENU_PRIMARY = [
  { label: 'Store Locator', to: ROUTES.LOCATION, icon: 'locator' },
  { label: 'Track Order', to: ROUTES.TRACK, icon: 'track' },
  { label: 'Explore Menu', to: ROUTES.MENU, icon: 'menu' },
  { label: 'Cart', to: ROUTES.CART, icon: 'menu' },
];

export const SIDE_MENU_SECONDARY = [
  { label: 'About Us', to: ROUTES.ABOUT },
  { label: 'Deals', to: ROUTES.DEALS },
  { label: 'Promotions', to: ROUTES.PROMOTIONS },
  { label: 'My Rewards', to: ROUTES.REWARDS },
  { label: 'Terms & Conditions', to: ROUTES.TERMS },
  { label: 'Privacy Policy', to: ROUTES.PRIVACY },
  { label: 'Contact Us', to: ROUTES.CONTACT },
];

export const FOOTER_LEGAL_LINKS = [
  { label: 'Privacy Policy', to: ROUTES.PRIVACY },
  { label: 'Terms & Conditions', to: ROUTES.TERMS },
];
