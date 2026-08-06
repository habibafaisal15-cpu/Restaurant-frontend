import { api, withFallback } from '../api/client';
import {
  filterOrdersForUi,
  mapOrderDetail,
  mapOrderFiltersToBackend,
  mapOrderListItem,
  mapUiStatusToBackend,
  unwrap,
} from '../api/adapters';
import * as riderService from './riderService';
import {
  buildOrderItem,
  calcTotals,
  createSlipRecord,
  generateTokenNumber,
  getOrders,
  getRiders,
  getSettings,
  nextId,
  orders,
} from '../mock/data';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

function applyFilters(list, filters = {}) {
  let result = [...list];
  if (filters.channel) result = result.filter((o) => o.channel === filters.channel);
  if (filters.status) result = result.filter((o) => o.status === filters.status);
  if (filters.type) result = result.filter((o) => o.type === filters.type);
  if (filters.paymentStatus) result = result.filter((o) => o.paymentStatus === filters.paymentStatus);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (o) =>
        o.id?.toLowerCase().includes(q) ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q),
    );
  }
  if (filters.from) result = result.filter((o) => new Date(o.createdAt) >= new Date(filters.from));
  if (filters.to) result = result.filter((o) => new Date(o.createdAt) <= new Date(filters.to));
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function enrichOrder(order) {
  if (!order) return order;
  const copy = {
    ...order,
    items: [...(order.items ?? [])],
    statusHistory: [...(order.statusHistory ?? [])],
    customer: order.customer ? { ...order.customer } : order.customer,
    rider: order.rider ? { ...order.rider } : null,
  };
  if (copy.riderId) {
    const rider = getRiders().find((r) => r.id === copy.riderId);
    if (rider) {
      copy.rider = {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicleNumber: rider.vehicleNumber ?? '',
      };
      copy.riderSharedWithCustomer = true;
    }
  }
  return copy;
}

async function fetchLiveOrders(filters = {}) {
  const response = await api.get('/delivery/orders', {
    params: mapOrderFiltersToBackend(filters),
  });
  const rows = unwrap(response) || [];
  const mapped = rows.map(mapOrderListItem);
  return filterOrdersForUi(mapped, filters);
}

async function fetchLiveOrderById(id) {
  const [orderRes, trackingRes] = await Promise.allSettled([
    api.get(`/delivery/orders/${id}`),
    api.get(`/delivery/orders/${id}/tracking`),
  ]);

  if (orderRes.status === 'rejected') throw orderRes.reason;

  const raw = unwrap(orderRes.value);
  const order = mapOrderDetail(raw);

  if (trackingRes.status === 'fulfilled') {
    const timeline = unwrap(trackingRes.value) || [];
    if (Array.isArray(timeline)) {
      order.statusHistory = timeline.map((entry) => ({
        status: entry.status,
        at: entry.logged_at,
        by: entry.set_by || 'System',
        note: entry.note,
      }));
    }
  }

  return order;
}

export async function getAll(filters = {}) {
  await delay(80);
  return withFallback(
    () => fetchLiveOrders(filters),
    () => applyFilters(getOrders(), filters).map(enrichOrder),
  );
}

export async function getById(id) {
  await delay(80);
  return withFallback(
    () => fetchLiveOrderById(id),
    () => {
      const order = getOrders().find((o) => o.id === id);
      if (!order) throw new Error('Order not found');
      return enrichOrder(order);
    },
  );
}

export async function updateStatus(id, status, meta = {}) {
  await delay(80);
  return withFallback(
    async () => {
      const existing = await fetchLiveOrderById(id);
      const backendStatus = mapUiStatusToBackend(status, existing.channel);
      const response = await api.patch(`/delivery/orders/${id}/status`, {
        status: backendStatus,
        set_by: meta.by || 'Admin',
        note: meta.note,
      });
      return mapOrderDetail(unwrap(response));
    },
    () => {
      const order = getOrders().find((o) => o.id === id);
      if (!order) throw new Error('Order not found');
      order.status = status;
      order.updatedAt = new Date().toISOString();
      return enrichOrder(order);
    },
  );
}

export async function accept(id, meta = {}) {
  return updateStatus(id, 'confirmed', meta);
}

export async function reject(id, reason = '', meta = {}) {
  await delay(80);
  return withFallback(
    async () => {
      const response = await api.patch(`/delivery/orders/${id}/status`, {
        status: 'Rejected',
        set_by: meta.by || 'Admin',
        note: reason || undefined,
      });
      return mapOrderDetail(unwrap(response));
    },
    () => updateStatus(id, 'cancelled', { ...meta, note: reason }),
  );
}

export async function assignRider(id, riderId, meta = {}) {
  await delay(80);
  return withFallback(
    async () => {
      const rider = await riderService.getById(riderId);
      const response = await api.patch(`/delivery/orders/${id}/assign-rider`, {
        rider_name: rider.name,
        rider_phone: rider.phone,
        set_by: meta.by || 'Admin',
      });
      const order = mapOrderDetail(unwrap(response));
      order.riderSharedWithCustomer = true;
      order.rider = { id: rider.id, name: rider.name, phone: rider.phone };
      return order;
    },
    () => {
      const order = getOrders().find((o) => o.id === id);
      const rider = getRiders().find((r) => r.id === riderId);
      if (!order || !rider) throw new Error('Order or rider not found');
      order.riderId = riderId;
      order.rider = rider;
      order.status = 'rider_assigned';
      order.riderSharedWithCustomer = true;
      return enrichOrder(order);
    },
  );
}

export async function createWalkIn(orderPayload) {
  await delay(200);
  return withFallback(
    async () => unwrap(await api.post('/orders/walk-in', orderPayload)),
    () => {
      const settings = getSettings();
      const items = (orderPayload.items ?? []).map((line) =>
        buildOrderItem(line.menuItemId, line.quantity, line.notes ?? ''),
      );
      const totals = calcTotals(items, { deliveryFee: 0, discount: orderPayload.discount ?? 0 });
      const order = {
        id: nextId('ord'),
        orderNumber: `YK-${1000 + getOrders().length + 1}`,
        channel: 'IN_RESTAURANT',
        type: orderPayload.type ?? 'DINE_IN',
        status: 'placed',
        customer: {
          name: orderPayload.customer?.name ?? 'Walk-in Guest',
          phone: orderPayload.customer?.phone ?? '',
        },
        items,
        ...totals,
        paymentMethod: orderPayload.paymentMethod ?? 'cash',
        paymentStatus: orderPayload.paymentStatus ?? 'pending',
        tokenNumber: generateTokenNumber(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      getOrders().unshift(order);
      if (settings.autoSlipWalkIn) createSlipRecord(order, 'kitchen');
      return order;
    },
  );
}

export async function pollPendingOnline() {
  await delay(80);
  return withFallback(
    async () => {
      const list = await fetchLiveOrders({ status: 'pending', channel: 'ONLINE' });
      return list.filter((o) => o.orderStatus === 'New' || o.status === 'pending');
    },
    () => getOrders().filter((o) => o.channel === 'ONLINE' && o.status === 'pending'),
  );
}

export { orders };
