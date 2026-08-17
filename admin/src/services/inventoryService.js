import { api, withFallback } from '../api/client';
import { unwrap, resolveMediaUrl } from '../api/adapters';
import * as menuService from './menuService';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

let mockItems = [
  {
    id: 'inv-001',
    name: 'Chicken Biryani',
    categoryId: 'cat-001',
    categoryName: 'Biryani',
    image: '',
    price: 850,
    active: true,
    inStock: true,
    trackStock: true,
    stockQty: 24,
    lowStockThreshold: 5,
    stockStatus: 'in_stock',
  },
  {
    id: 'inv-002',
    name: 'Chicken Wings',
    categoryId: 'cat-002',
    categoryName: 'Starters',
    image: '',
    price: 790,
    active: true,
    inStock: true,
    trackStock: true,
    stockQty: 4,
    lowStockThreshold: 5,
    stockStatus: 'low_stock',
  },
  {
    id: 'inv-003',
    name: 'Classic Shrimp Cocktail',
    categoryId: 'cat-002',
    categoryName: 'Starters',
    image: '',
    price: 1490,
    active: true,
    inStock: false,
    trackStock: true,
    stockQty: 0,
    lowStockThreshold: 3,
    stockStatus: 'out_of_stock',
  },
];

let mockMovements = [];

export function mapInventoryItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId || row.category_id,
    categoryName: row.categoryName || row.category_name || 'Uncategorized',
    image: resolveMediaUrl(row.image || row.image_url || ''),
    price: Number(row.price) || 0,
    active: row.active !== false && row.is_active !== false,
    inStock: row.inStock ?? row.in_stock !== false,
    trackStock: row.trackStock ?? row.track_stock === true,
    stockQty: Number(row.stockQty ?? row.stock_qty ?? 0),
    lowStockThreshold: Number(row.lowStockThreshold ?? row.low_stock_threshold ?? 5),
    stockStatus: row.stockStatus || row.stock_status || 'available',
    updatedAt: row.updatedAt || row.updated_at,
  };
}

export function mapMovement(row) {
  return {
    id: row.id,
    productId: row.productId || row.product_id,
    productName: row.productName || row.product_name,
    type: row.type,
    quantity: Number(row.quantity) || 0,
    quantityBefore: Number(row.quantityBefore ?? row.quantity_before ?? 0),
    quantityAfter: Number(row.quantityAfter ?? row.quantity_after ?? 0),
    reason: row.reason || null,
    createdAt: row.createdAt || row.created_at,
  };
}

export async function getSummary() {
  await delay();
  return withFallback(
    async () => unwrap(await api.get('/admin/inventory/summary')),
    () => {
      const tracked = mockItems.filter((i) => i.trackStock);
      return {
        totalItems: mockItems.length,
        trackedItems: tracked.length,
        inStock: tracked.filter((i) => i.stockStatus === 'in_stock').length,
        lowStock: tracked.filter((i) => i.stockStatus === 'low_stock').length,
        outOfStock: mockItems.filter((i) => i.stockStatus === 'out_of_stock').length,
        totalUnits: tracked.reduce((sum, i) => sum + i.stockQty, 0),
      };
    },
  );
}

function fromMenuItem(item) {
  return mapInventoryItem({
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    categoryName: item.categoryName || 'Uncategorized',
    image: item.image,
    price: item.price,
    active: item.active,
    inStock: item.available,
    trackStock: false,
    stockQty: 0,
    lowStockThreshold: 5,
    stockStatus: item.available === false ? 'out_of_stock' : 'available',
  });
}

export async function getAll(filters = {}) {
  await delay();
  return withFallback(
    async () => {
      let list = [];
      try {
        list = (unwrap(await api.get('/admin/inventory', { params: filters })) || []).map(
          mapInventoryItem,
        );
      } catch {
        list = [];
      }

      if (!list.length) {
        const menuItems = await menuService.getAll();
        list = menuItems.map(fromMenuItem);
        if (filters.search) {
          const q = String(filters.search).toLowerCase();
          list = list.filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              item.categoryName.toLowerCase().includes(q),
          );
        }
        if (filters.status && filters.status !== 'all') {
          list = list.filter((item) => item.stockStatus === filters.status);
        }
      }

      return list;
    },
    () => {
      let list = mockItems.map((i) => ({ ...i }));
      if (filters.status) list = list.filter((i) => i.stockStatus === filters.status);
      if (filters.search) {
        const q = String(filters.search).toLowerCase();
        list = list.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.categoryName.toLowerCase().includes(q),
        );
      }
      return list;
    },
  );
}

export async function updateSettings(id, payload) {
  await delay();
  return withFallback(
    async () => mapInventoryItem(unwrap(await api.patch(`/admin/inventory/${id}`, payload))),
    () => {
      const index = mockItems.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Item not found');
      mockItems[index] = {
        ...mockItems[index],
        trackStock: payload.trackStock ?? mockItems[index].trackStock,
        lowStockThreshold: payload.lowStockThreshold ?? mockItems[index].lowStockThreshold,
      };
      return { ...mockItems[index] };
    },
  );
}

export async function adjust(id, payload) {
  await delay();
  return withFallback(
    async () =>
      mapInventoryItem(unwrap(await api.post(`/admin/inventory/${id}/adjust`, payload))),
    () => {
      const index = mockItems.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Item not found');
      const before = mockItems[index].stockQty;
      let after = before;
      const qty = Math.abs(Number(payload.quantity) || 0);
      if (payload.type === 'adjust') after = Math.max(0, Math.floor(Number(payload.quantity) || 0));
      else if (payload.type === 'in' || payload.type === 'return') after = before + qty;
      else after = Math.max(0, before - qty);

      mockItems[index] = {
        ...mockItems[index],
        stockQty: after,
        trackStock: true,
        inStock: after > 0,
        stockStatus:
          after <= 0
            ? 'out_of_stock'
            : after <= mockItems[index].lowStockThreshold
              ? 'low_stock'
              : 'in_stock',
      };
      mockMovements.unshift({
        id: `mov-${Date.now()}`,
        productId: id,
        productName: mockItems[index].name,
        type: payload.type,
        quantity: Math.abs(after - before),
        quantityBefore: before,
        quantityAfter: after,
        reason: payload.reason || null,
        createdAt: new Date().toISOString(),
      });
      return { ...mockItems[index] };
    },
  );
}

export async function getMovements(filters = {}) {
  await delay();
  return withFallback(
    async () =>
      (unwrap(await api.get('/admin/inventory/movements', { params: filters })) || []).map(
        mapMovement,
      ),
    () => {
      let list = [...mockMovements];
      if (filters.productId) list = list.filter((m) => m.productId === filters.productId);
      return list.map((m) => ({ ...m }));
    },
  );
}
