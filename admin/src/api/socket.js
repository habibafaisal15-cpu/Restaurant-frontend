import { io } from 'socket.io-client';
import { getToken } from '../utils/storage';

const WS_URL = import.meta.env.VITE_WS_URL ?? '';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(WS_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectAdminSocket() {
  const token = getToken();
  const s = getSocket();

  if (!token) {
    s.disconnect();
    return s;
  }

  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }

  s.emit('join:admin');
  return s;
}

export function disconnectAdminSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function onAdminOrderEvents(handler) {
  const s = getSocket();
  const events = [
    'order.created',
    'order.accepted',
    'order.status_changed',
    'order.rider_assigned',
    'order.delivered',
    'menu.updated',
    'menu.item_created',
    'menu.item_updated',
    'menu.item_deleted',
    'menu.deal_created',
    'menu.deal_updated',
    'menu.deal_deleted',
  ];

  events.forEach((event) => s.on(event, handler));

  return () => {
    events.forEach((event) => s.off(event, handler));
  };
}
