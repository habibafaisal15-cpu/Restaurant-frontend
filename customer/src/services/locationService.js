import { checkDeliveryCoverage, getNearestBranch } from '../api/branches';

export const DELIVERY_UNAVAILABLE_MESSAGE =
  "Sorry, we don't deliver here.";

export class DeliveryUnavailableError extends Error {
  constructor(message = DELIVERY_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = 'DeliveryUnavailableError';
  }
}

async function fetchJson(url, { timeoutMs = 2500 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function reverseGeocode(lat, lng) {
  const data = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export async function geocodeAddress(address) {
  const data = await fetchJson(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`
  );

  if (!data?.length) {
    throw new Error('Address not found. Try a more specific location.');
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    address: data[0].display_name || address,
  };
}

export async function checkDeliveryAvailability(location) {
  const response = await checkDeliveryCoverage(location);
  const data = response?.data || response || {};

  const deliverable =
    data.deliverable ??
    data.available ??
    data.isDeliverable ??
    Boolean(data.branch || data.branchId);

  return {
    deliverable: Boolean(deliverable),
    branch: data.branch || null,
    message: data.message || DELIVERY_UNAVAILABLE_MESSAGE,
    raw: data,
  };
}

export async function resolveNearestBranch(coords) {
  const response = await getNearestBranch(coords);
  return response?.data || response || null;
}

/**
 * Normalize coords/address, ask backend if we deliver there,
 * then return location + assigned branch.
 */
export async function validateAndAssignLocation(input) {
  let location = { ...input };

  if (
    (location.lat == null || location.lng == null) &&
    location.address
  ) {
    try {
      const found = await geocodeAddress(location.address);
      location = { ...location, ...found };
    } catch {
      location = {
        ...location,
        address: location.address,
      };
    }
  }

  if (location.lat != null && location.lng != null && !location.address) {
    try {
      location.address = await reverseGeocode(location.lat, location.lng);
    } catch {
      location.address = `${location.lat}, ${location.lng}`;
    }
  }

  const coverage = await checkDeliveryAvailability(location);

  if (!coverage.deliverable) {
    throw new DeliveryUnavailableError(
      coverage.message || DELIVERY_UNAVAILABLE_MESSAGE
    );
  }

  const branch = coverage.branch || (await resolveNearestBranch(location));

  if (!branch?.id) {
    throw new DeliveryUnavailableError(
      coverage.message || DELIVERY_UNAVAILABLE_MESSAGE
    );
  }

  return { location, branch };
}
