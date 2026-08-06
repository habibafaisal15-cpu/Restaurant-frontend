import { createOrder } from '../api/orders';

export const buildOrderPayload = ({
  items,
  branchId,
  location,
  customer,
  paymentMethod,
  paymentDetails,
}) => ({
  branchId,
  items: items.map((item) => ({
    menuItemId: item.id,
    quantity: item.quantity,
    price: item.price,
  })),
  deliveryLocation: location,
  customer: {
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    apartment: customer.apartment || '',
    city: customer.city || '',
    address: customer.address,
    notes: customer.notes || '',
  },
  paymentMethod,
  paymentDetails: paymentDetails || null,
});

export const placeOrder = async (orderData) => {
  const response = await createOrder(buildOrderPayload(orderData));
  return response?.data || response;
};
