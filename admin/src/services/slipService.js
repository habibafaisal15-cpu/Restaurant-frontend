import { api, withFallback } from '../api/client';
import { unwrap } from '../api/adapters';
import { createSlipRecord, getOrders, getSlips, slips } from '../mock/data';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function mockGenerate(orderId, slipType = 'kitchen') {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found');
  const slip = createSlipRecord(order, slipType);
  order.slip = { id: slip.id, slipType: slip.slipType, printedAt: slip.printedAt };
  return slip;
}

export async function generate(orderId, slipType = 'kitchen') {
  await delay();
  return withFallback(
    () => api.post('/slips/generate', { orderId, slipType }).then((res) => unwrap(res)),
    () => mockGenerate(orderId, slipType),
  );
}

export async function getByOrder(orderId) {
  await delay();
  return withFallback(
    () => api.get(`/slips/order/${orderId}`).then((res) => unwrap(res)),
    () => getSlips().filter((s) => s.orderId === orderId),
  );
}

export async function getAll(filters = {}) {
  await delay();
  return withFallback(
    () => api.get('/slips', { params: filters }).then((res) => unwrap(res)),
    () => [...getSlips()],
  );
}

export async function reprint(slipId) {
  await delay();
  return withFallback(
    () => api.post(`/slips/${slipId}/reprint`).then((res) => unwrap(res)),
    () => {
      const slip = getSlips().find((s) => s.id === slipId);
      if (!slip) throw new Error('Slip not found');
      slip.reprintCount += 1;
      slip.printedAt = new Date().toISOString();
      return slip;
    },
  );
}

export { slips };
