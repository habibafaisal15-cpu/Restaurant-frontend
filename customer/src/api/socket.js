import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL || '', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinMenuUpdates() {
  getSocket().emit('join:menu');
}

export function joinOrderTracking(token) {
  if (token) getSocket().emit('join:track', { token });
}

export function onMenuUpdated(handler) {
  const client = getSocket();
  const events = [
    'menu.updated',
    'menu.item_created',
    'menu.item_updated',
    'menu.item_deleted',
    'menu.deal_created',
    'menu.deal_updated',
    'menu.deal_deleted',
  ];

  events.forEach((event) => client.on(event, handler));
  return () => events.forEach((event) => client.off(event, handler));
}

export function onOrderUpdated(handler) {
  const client = getSocket();
  const events = [
    'order.accepted',
    'order.status_changed',
    'order.rider_assigned',
    'order.delivered',
    'order.rider_assign_expired',
  ];

  events.forEach((event) => client.on(event, handler));
  return () => events.forEach((event) => client.off(event, handler));
}
