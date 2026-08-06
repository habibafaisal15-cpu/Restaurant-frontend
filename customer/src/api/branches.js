import apiClient from './client';
import { mapZoneToBranch } from './adapters';

export async function checkDeliveryCoverage(location) {
  const payload = {
    latitude: location.lat != null ? Number(location.lat) : undefined,
    longitude: location.lng != null ? Number(location.lng) : undefined,
    address: location.address,
    formatted_address: location.address,
  };

  const response = payload.latitude != null && payload.longitude != null
    ? await apiClient.post('/storefront/location/select-live', {
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
      })
    : await apiClient.post('/storefront/check-location', payload);

  const data = response?.data || response || {};

  if (!data.serviceable) {
    return {
      data: {
        deliverable: false,
        available: false,
        message: data.message || "Sorry, we don't deliver here.",
      },
    };
  }

  const branch = mapZoneToBranch(data.zone, data.location);

  return {
    data: {
      deliverable: true,
      available: true,
      branch,
      zone: data.zone,
      location: data.location,
    },
  };
}

export async function getNearestBranch(location) {
  const coverage = await checkDeliveryCoverage(location);
  return { data: coverage.data.branch };
}
