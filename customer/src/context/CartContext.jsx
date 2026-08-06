import { createContext, useContext, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../constants';
import { getItem, setItem } from '../utils/storage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => getItem(STORAGE_KEYS.CART, []));

  const persist = (nextItems) => {
    setItems(nextItems);
    setItem(STORAGE_KEYS.CART, nextItems);
  };

  const addItem = (menuItem, quantity = 1) => {
    const existing = items.find((item) => item.id === menuItem.id);
    if (existing) {
      persist(
        items.map((item) =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
      return;
    }
    persist([...items, { ...menuItem, quantity }]);
  };

  const removeItem = (itemId) => {
    persist(items.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    persist(
      items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => persist([]);

  const value = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
