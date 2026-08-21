import { STORAGE_KEYS } from '../constants';

const HISTORY_KEY = STORAGE_KEYS.ORDER_HISTORY;
const NOTIF_KEY = STORAGE_KEYS.NOTIFICATIONS;
const MAX_ORDERS = 20;
const MAX_NOTIFS = 30;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getOrderHistory() {
  return readJson(HISTORY_KEY, []);
}

export function rememberOrder(order) {
  if (!order?.id) return;
  const entry = {
    id: order.id,
    orderNumber: order.orderNumber || order.order_number || order.id,
    status: order.status || 'pending',
    total: order.total ?? order.grandTotal ?? null,
    createdAt: order.createdAt || order.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const next = [
    entry,
    ...getOrderHistory().filter((item) => item.id !== entry.id),
  ].slice(0, MAX_ORDERS);
  writeJson(HISTORY_KEY, next);
  return next;
}

export function updateOrderInHistory(id, patch) {
  if (!id) return getOrderHistory();
  const next = getOrderHistory().map((item) =>
    item.id === id
      ? { ...item, ...patch, updatedAt: new Date().toISOString() }
      : item,
  );
  writeJson(HISTORY_KEY, next);
  return next;
}

export function getNotifications() {
  return readJson(NOTIF_KEY, []);
}

export function pushNotification({ title, body, orderId = null }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title || 'Update',
    body: body || '',
    orderId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...getNotifications()].slice(0, MAX_NOTIFS);
  writeJson(NOTIF_KEY, next);
  return next;
}

export function markNotificationsRead() {
  const next = getNotifications().map((n) => ({ ...n, read: true }));
  writeJson(NOTIF_KEY, next);
  return next;
}

export function unreadNotificationCount() {
  return getNotifications().filter((n) => !n.read).length;
}
