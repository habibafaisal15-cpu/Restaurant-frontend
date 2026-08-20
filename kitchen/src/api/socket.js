import { io } from 'socket.io-client';
import { getToken, getUser } from '../utils/storage';

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

export function connectKitchenSocket() {
  const token = getToken();
  const user = getUser();
  const s = getSocket();
  if (!token) {
    s.disconnect();
    return s;
  }
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  if (user?.role === 'rider') {
    s.emit('join:rider', { phone: user.phone });
  } else {
    s.emit('join:kitchen');
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export function onKitchenEvents(handler) {
  const s = getSocket();
  const events = [
    'order.sent_to_kitchen',
    'order.status_changed',
    'order.prepared',
    'order.rider_assigned',
    'order.delivered',
  ];
  events.forEach((event) => s.on(event, handler));
  return () => events.forEach((event) => s.off(event, handler));
}
