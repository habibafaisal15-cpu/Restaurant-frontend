import apiClient from './client';
import {
  buildStorefrontOrderPayload,
  mapCreatedOrder,
  mapRider,
  mapTrackingOrder,
} from './adapters';

export async function createOrder(orderPayload) {
  const response = await apiClient.post(
    '/storefront/orders',
    buildStorefrontOrderPayload(orderPayload)
  );

  const data = response?.data || response;
  return { data: mapCreatedOrder(data) };
}

export async function getOrderById(trackingToken) {
  const response = await apiClient.get(`/track/${trackingToken}`);
  const data = response?.data || response;
  return { data: mapTrackingOrder(data, trackingToken) };
}

export async function getOrderStatus(trackingToken) {
  return getOrderById(trackingToken);
}

export async function getOrderRider(trackingToken) {
  const response = await apiClient.get(`/track/${trackingToken}`);
  const data = response?.data || response;
  return { data: mapRider(data) };
}
