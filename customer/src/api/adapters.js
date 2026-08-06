const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || '';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return Boolean(value && UUID_RE.test(String(value)));
}

function resolveZoneId(branchId) {
  if (isUuid(branchId)) return String(branchId);

  try {
    const stored = localStorage.getItem('selected_branch_id');
    if (isUuid(stored)) return stored;
  } catch {
    // ignore storage access errors
  }

  return branchId;
}

function toOptionalCoordinate(value) {
  if (value == null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

export function mapZoneToBranch(zone, location) {
  if (!zone) return null;

  return {
    id: zone.id,
    name: zone.zone_name || zone.name || 'Delivery zone',
    address: location?.formatted_address || location?.address || '',
    city: location?.city || '',
    baseFee: Number(zone.base_fee ?? zone.baseFee ?? 0),
    estimatedTime: zone.estimated_time || zone.estimatedTime || '',
  };
}

export function mapCategory(category) {
  const items = category.items || [];
  const categoryImage = category.image_url || category.image;
  const heroImage =
    category.hero_image_url || category.heroImage || categoryImage;
  const firstItemImage = items.find((item) => item.image_url)?.image_url;

  return {
    id: category.id,
    name: category.category_name || category.name,
    itemCount: items.length,
    itemsCount: items.length,
    showInHero: category.show_in_hero ?? Boolean(heroImage || firstItemImage),
    image: resolveMediaUrl(categoryImage || firstItemImage) || undefined,
    heroImage: resolveMediaUrl(heroImage || categoryImage || firstItemImage) || undefined,
    heroTitle: category.hero_title || category.category_name || category.name,
  };
}

export function mapMenuItem(item) {
  const price = Number(item.deal_price ?? item.price ?? 0);

  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    price,
    originalPrice: item.deal_price != null ? Number(item.price) : undefined,
    image: resolveMediaUrl(item.image_url),
    imageUrl: resolveMediaUrl(item.image_url),
    inStock: item.in_stock !== false,
    deal: item.deal || null,
  };
}

export function mapDeal(deal) {
  return {
    id: deal.id,
    title: deal.title,
    name: deal.title,
    detail: deal.description || '',
    description: deal.description || '',
    discountType: deal.discount_type,
    discountValue: Number(deal.discount_value),
    image: resolveMediaUrl(deal.image_url),
    productIds: deal.product_ids,
  };
}

export function mapTrackingOrder(data, token) {
  const statusMap = {
    New: 'pending',
    Accepted: 'confirmed',
    Preparing: 'preparing',
    'Rider Assigned': 'rider_assigned',
    'Out for Delivery': 'out_for_delivery',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
    Rejected: 'cancelled',
  };

  return {
    id: token,
    orderNumber: data.order_number,
    status: statusMap[data.order_status] || String(data.order_status || '').toLowerCase(),
    orderStatus: data.order_status,
    total: Number(data.total_amount ?? 0),
    subtotal: Number(data.subtotal ?? 0),
    deliveryFee: Number(data.delivery_fee ?? 0),
    discount: Number(data.discount ?? 0),
    eta: data.eta,
    rider: data.rider
      ? {
          name: data.rider.name,
          phone: data.rider.phone,
        }
      : null,
    riderId: data.rider ? 'assigned' : null,
    items: data.items || [],
    timeline: data.timeline || [],
    notification: data.notification,
  };
}

export function mapRider(data) {
  if (!data?.rider) return null;

  return {
    name: data.rider.name,
    phone: data.rider.phone,
  };
}

export function buildStorefrontOrderPayload(orderPayload) {
  const paymentMethod = String(orderPayload.paymentMethod || 'cash').toLowerCase();
  const deliveryLatitude = toOptionalCoordinate(orderPayload.deliveryLocation?.lat);
  const deliveryLongitude = toOptionalCoordinate(orderPayload.deliveryLocation?.lng);
  const notes = String(orderPayload.customer?.notes || '').trim();

  const payload = {
    zone_id: resolveZoneId(orderPayload.branchId),
    customer_name: orderPayload.customer?.name,
    customer_phone: orderPayload.customer?.phone,
    delivery_address:
      orderPayload.customer?.address ||
      orderPayload.deliveryLocation?.address ||
      '',
    payment_method: paymentMethod === 'cash' ? 'COD' : 'Online',
    items: (orderPayload.items || []).map((item) => ({
      product_id: item.menuItemId || item.id,
      quantity: item.quantity,
    })),
  };

  if (notes) payload.delivery_instructions = notes;
  if (deliveryLatitude != null) payload.delivery_latitude = deliveryLatitude;
  if (deliveryLongitude != null) payload.delivery_longitude = deliveryLongitude;

  return payload;
}

export function mapCreatedOrder(data) {
  return {
    id: data.tracking_token || data.id,
    orderId: data.id,
    orderNumber: data.order_number,
    trackingToken: data.tracking_token,
    trackingUrl: data.tracking_url,
    status: 'pending',
    orderStatus: data.order_status,
    total: Number(data.total_amount ?? 0),
    subtotal: Number(data.subtotal ?? 0),
    deliveryFee: Number(data.delivery_fee ?? 0),
    createdAt: new Date().toISOString(),
  };
}
