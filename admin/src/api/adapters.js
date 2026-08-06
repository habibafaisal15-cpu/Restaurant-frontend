const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || '';

export function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

const STATUS_FROM_BACKEND = {
  New: 'pending',
  Accepted: 'confirmed',
  Preparing: 'preparing',
  'Rider Assigned': 'rider_assigned',
  'Out for Delivery': 'out_for_delivery',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
  Rejected: 'cancelled',
};

const STATUS_TO_BACKEND = {
  pending: 'New',
  confirmed: 'Accepted',
  preparing: 'Preparing',
  rider_assigned: 'Rider Assigned',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  placed: 'Preparing',
  ready: 'Preparing',
  served: 'Delivered',
};

export function mapBackendStatus(status, channel = 'ONLINE') {
  if (channel === 'IN_RESTAURANT' && status === 'Preparing') {
    return 'preparing';
  }
  return STATUS_FROM_BACKEND[status] || String(status || '').toLowerCase();
}

export function mapUiStatusToBackend(status, channel = 'ONLINE') {
  if (channel === 'IN_RESTAURANT') {
    const inStoreMap = {
      placed: 'Preparing',
      preparing: 'Preparing',
      ready: 'Preparing',
      served: 'Delivered',
      cancelled: 'Cancelled',
    };
    return inStoreMap[status] || STATUS_TO_BACKEND[status] || status;
  }
  return STATUS_TO_BACKEND[status] || status;
}

export function mapAdminUser(admin) {
  if (!admin) return null;
  return {
    id: admin.id,
    name: admin.full_name || admin.name || admin.email,
    email: admin.email,
    role: admin.role || 'admin',
    avatar: admin.avatar || null,
  };
}

export function mapAuthResponse(data) {
  const payload = data?.data ?? data;
  return {
    token: payload.token,
    user: mapAdminUser(payload.admin),
  };
}

export function mapOrderListItem(row) {
  const channel = row.order_channel || row.channel || 'ONLINE';
  const type = row.order_type || row.type || 'DELIVERY';
  const total = Number(row.total_amount ?? row.total ?? 0);

  return {
    id: row.id,
    orderNumber: row.order_number || row.orderNumber,
    channel,
    type,
    status: mapBackendStatus(row.order_status || row.status, channel),
    orderStatus: row.order_status || row.status,
    customer: {
      name: row.customer_name || row.customer?.name || 'Customer',
      phone: row.customer_phone || row.customer?.phone || '',
      address:
        row.delivery_address ||
        row.customer?.delivery_address ||
        row.customer?.address ||
        '',
    },
    items: row.items || [],
    subtotal: Number(row.subtotal ?? total),
    tax: Number(row.tax_amount ?? row.tax ?? 0),
    serviceCharge: Number(row.service_charge ?? row.serviceCharge ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    discount: Number(row.discount ?? 0),
    total,
    totalAmount: total,
    paymentMethod: normalizePaymentMethod(row.payment_method || row.paymentMethod),
    paymentStatus:
      row.payment_status === 'Paid' || row.payment_status === 'Settled' || row.paymentStatus === 'paid'
        ? 'paid'
        : 'pending',
    riderId: row.rider_id || row.riderId || (row.rider_name ? 'assigned' : null),
    riderName: row.rider_name || row.rider?.name || null,
    rider: row.rider || (row.rider_name ? { name: row.rider_name, phone: row.rider_phone } : null),
    riderSharedWithCustomer: Boolean(row.rider_name || row.rider),
    tokenNumber: row.token_number || row.tokenNumber || null,
    tableNumber: row.table_number || row.tableNumber || null,
    createdAt: row.order_time || row.createdAt,
    updatedAt: row.order_time || row.updatedAt,
    timer: row.timer,
    area: row.area,
    itemCount: row.item_count ?? row.itemCount ?? row.items?.length ?? 0,
    slip: row.slip || null,
  };
}

export function mapOrderDetail(data) {
  const channel = data.order_channel || 'ONLINE';
  const base = mapOrderListItem({
    ...data,
    order_channel: channel,
    customer_name: data.customer?.name,
    customer_phone: data.customer?.phone,
    delivery_address: data.customer?.delivery_address,
    total_amount: data.pricing?.total_amount ?? data.total,
    payment_method: data.payment?.method ?? data.paymentMethod,
    payment_status: data.payment?.status ?? data.paymentStatus,
    order_status: data.order_status ?? data.status,
    order_number: data.order_number ?? data.orderNumber,
    order_time: data.order_time ?? data.createdAt,
    rider_name: data.rider?.name,
    rider_phone: data.rider?.phone,
  });

  return {
    ...base,
    items: (data.items || []).map((item) => ({
      id: item.id,
      menuItemId: item.product_id || item.menuItemId,
      name: item.product_name || item.name,
      quantity: item.quantity,
      price: Number(item.unit_price ?? item.price ?? 0),
      total: Number(item.total_price ?? item.total ?? 0),
      notes: item.notes || '',
    })),
    subtotal: Number(data.pricing?.subtotal ?? data.subtotal ?? base.subtotal),
    tax: Number(data.pricing?.tax_amount ?? data.tax ?? 0),
    serviceCharge: Number(data.pricing?.service_charge ?? data.serviceCharge ?? 0),
    deliveryFee: Number(data.pricing?.delivery_fee ?? data.deliveryFee ?? 0),
    discount: Number(data.pricing?.discount ?? data.discount ?? 0),
    total: Number(data.pricing?.total_amount ?? data.total ?? base.total),
    paymentMethod: normalizePaymentMethod(data.payment?.method ?? data.paymentMethod),
    paymentStatus: data.payment?.is_paid || data.paymentStatus === 'paid' ? 'paid' : base.paymentStatus,
    deliveryInstructions: data.customer?.delivery_instructions || '',
    zone: data.zone,
    availableActions: data.available_actions || [],
    trackingToken: data.tracking_token,
    statusHistory: (data.statusHistory || data.timeline || []).map((entry) => ({
      status: mapBackendStatus(entry.status, channel),
      at: entry.logged_at || entry.at,
      by: entry.set_by || entry.by || 'System',
      note: entry.note,
    })),
  };
}

function normalizePaymentMethod(method) {
  const value = String(method || 'COD').toLowerCase();
  if (value === 'cod' || value === 'cash') return 'cash';
  if (value === 'card') return 'card';
  if (value === 'online') return 'online';
  return value;
}

export function mapCategory(row) {
  return {
    id: row.id,
    name: row.category_name || row.name,
    description: row.description || '',
    image: resolveMediaUrl(row.image_url || row.image),
    heroImage: resolveMediaUrl(row.hero_image_url || row.hero_image || row.heroImage || row.image_url),
    heroTitle: row.hero_title || row.heroTitle || row.category_name || row.name,
    showInHero: row.show_in_hero ?? row.showInHero ?? false,
    sortOrder: row.display_order ?? row.sortOrder ?? 0,
    active: row.is_active ?? row.active ?? true,
    itemCount: row.item_count ?? row.itemCount ?? 0,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

export function mapMenuItem(row) {
  const available = row.availability_status
    ? row.availability_status === 'available'
    : row.available_for_delivery !== false && row.in_stock !== false && row.is_active !== false;

  return {
    id: row.id,
    categoryId: row.category_id || row.categoryId,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    discountPrice: row.deal_price != null ? Number(row.deal_price) : row.discountPrice,
    image: resolveMediaUrl(row.image_url || row.image),
    available,
    active: row.is_active ?? row.active ?? true,
    tags: row.tags || [],
    availabilityStatus: row.availability_status,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

export function mapDeal(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    price: Number(row.price ?? 0),
    originalPrice: row.originalPrice != null ? Number(row.originalPrice) : undefined,
    image: resolveMediaUrl(row.image_url || row.image),
    badge: row.badge || '',
    productId: row.productId || row.product_id || null,
    active: row.is_active ?? row.active ?? true,
    showOnCustomer: row.showOnCustomer ?? row.show_on_customer ?? true,
    sortOrder: row.sortOrder ?? row.sort_order ?? 0,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

export function mapHeroSlide(slide) {
  return {
    id: slide.id,
    image: resolveMediaUrl(slide.image),
    title: slide.title || '',
    active: slide.active !== false && Boolean(slide.image),
    sortOrder: slide.sortOrder ?? slide.sort_order ?? 0,
  };
}

export function mapHeroSideCard(card) {
  return {
    id: card.id,
    key: card.key || 'menu',
    title: card.title || '',
    image: resolveMediaUrl(card.image),
    link: card.link || '/',
    sortOrder: card.sortOrder ?? card.sort_order ?? 0,
  };
}

export function toCategoryPayload(payload) {
  const imageUrl = isRemoteUrl(payload.image) ? payload.image : undefined;
  const heroImageUrl = isRemoteUrl(payload.heroImage)
    ? payload.heroImage
    : payload.showInHero && imageUrl
      ? imageUrl
      : undefined;

  return {
    category_name: payload.name,
    display_order: payload.sortOrder,
    is_active: payload.active,
    description: payload.description,
    image_url: imageUrl,
    hero_image_url: heroImageUrl,
    hero_title: payload.heroTitle,
    show_in_hero: payload.showInHero,
  };
}

export function toMenuItemPayload(payload) {
  return {
    name: payload.name,
    category_id: payload.categoryId,
    description: payload.description,
    price: payload.price,
    image_url: isRemoteUrl(payload.image) ? payload.image : undefined,
    available_for_delivery: payload.available,
    in_stock: payload.available,
    is_active: payload.active,
  };
}

function isRemoteUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http') || url.startsWith('/uploads');
}

export function mapDashboardSummary(stats = {}) {
  if (stats.totalRevenue != null || stats.channels) {
    return {
      totalRevenue: Number(stats.totalRevenue ?? 0),
      totalOrders: Number(stats.totalOrders ?? 0),
      onlineOrders: Number(stats.onlineOrders ?? stats.channels?.ONLINE?.orders ?? 0),
      inRestaurantOrders: Number(
        stats.inRestaurantOrders ?? stats.channels?.IN_RESTAURANT?.orders ?? 0,
      ),
      averageOrderValue: Number(stats.averageOrderValue ?? 0),
      pendingOrders: Number(stats.pendingOrders ?? 0),
      preparingOrders: Number(stats.preparingOrders ?? 0),
      deliveredToday: Number(stats.deliveredToday ?? 0),
      cancelledOrders: Number(stats.cancelledOrders ?? 0),
      channels: stats.channels,
      paymentMethods: stats.paymentMethods,
      topItems: stats.topItems,
    };
  }

  const delivered = Number(stats.delivered_today ?? 0);
  return {
    totalRevenue: 0,
    totalOrders:
      Number(stats.new_orders ?? 0) +
      Number(stats.preparing ?? 0) +
      Number(stats.out_for_delivery ?? 0) +
      delivered,
    onlineOrders:
      Number(stats.new_orders ?? 0) +
      Number(stats.preparing ?? 0) +
      Number(stats.out_for_delivery ?? 0) +
      delivered,
    inRestaurantOrders: 0,
    averageOrderValue: 0,
    pendingOrders: Number(stats.new_orders ?? 0),
    preparingOrders: Number(stats.preparing ?? 0),
    deliveredToday: delivered,
    cancelledOrders: Number(stats.cancelled ?? 0),
  };
}

export function filterOrdersForUi(orders, filters = {}) {
  let result = [...orders];

  if (filters.channel === 'IN_RESTAURANT') {
    result = result.filter((o) => o.channel === 'IN_RESTAURANT');
  } else if (filters.channel === 'ONLINE') {
    result = result.filter((o) => o.channel === 'ONLINE');
  }

  if (filters.status) {
    result = result.filter((order) => order.status === filters.status);
  }
  if (filters.type) {
    result = result.filter((order) => order.type === filters.type);
  }
  if (filters.paymentStatus) {
    result = result.filter((order) => order.paymentStatus === filters.paymentStatus);
  }
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
  if (filters.from) {
    result = result.filter((o) => new Date(o.createdAt) >= new Date(filters.from));
  }
  if (filters.to) {
    result = result.filter((o) => new Date(o.createdAt) <= new Date(filters.to));
  }

  return result;
}

export function mapOrderFiltersToBackend(filters = {}) {
  const params = {};
  if (filters.search) params.search = filters.search;

  if (filters.status === 'pending') params.status = 'New';
  else if (filters.status === 'confirmed') params.status = 'Accepted';
  else if (filters.status === 'preparing') params.status = 'Preparing';
  else if (filters.status === 'rider_assigned') params.status = 'Preparing';
  else if (filters.status === 'out_for_delivery') params.status = 'Out for Delivery';
  else if (filters.status === 'delivered') params.status = 'Delivered';
  else if (filters.status === 'cancelled') params.status = 'Cancelled';

  return params;
}
