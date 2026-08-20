import { api, unwrap } from '../api/client';

export async function listKitchenOrders(board) {
  return unwrap(await api.get('/kitchen/orders', { params: { board } })) || [];
}

export async function updateKitchenStatus(orderId, status, setBy) {
  return unwrap(
    await api.patch(`/kitchen/orders/${orderId}/status`, {
      status,
      set_by: setBy,
      actor: 'kitchen',
    }),
  );
}

export async function listRiderOrders(status = 'active') {
  return unwrap(await api.get('/kitchen/rider/orders', { params: { status } })) || [];
}

export async function updateRiderStatus(orderId, status, setBy) {
  return unwrap(
    await api.patch(`/kitchen/rider/orders/${orderId}/status`, {
      status,
      set_by: setBy,
      actor: 'rider',
    }),
  );
}
