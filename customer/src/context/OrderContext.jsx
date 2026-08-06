import { createContext, useContext, useMemo, useState } from 'react';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [activeOrder, setActiveOrder] = useState(null);
  const [rider, setRider] = useState(null);

  const value = useMemo(
    () => ({
      activeOrder,
      setActiveOrder,
      rider,
      setRider,
    }),
    [activeOrder, rider]
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
}
