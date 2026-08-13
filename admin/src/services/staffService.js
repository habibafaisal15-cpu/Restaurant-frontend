import { api, withFallback } from '../api/client';
import { unwrap } from '../api/adapters';
import { nextId } from '../mock/data';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

let mockStaff = [
  {
    id: 'staff-001',
    name: 'Restaurant Admin',
    email: 'admin@restaurant.com',
    phone: null,
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  },
];

export function mapStaff(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name || row.name || row.email,
    email: row.email,
    phone: row.phone || null,
    role: row.role || 'admin',
    active: row.active !== false && row.is_active !== false,
    createdAt: row.createdAt || row.created_at,
    lastLoginAt: row.lastLoginAt || row.last_login_at,
  };
}

function mockGetAll(filters = {}) {
  let list = [...mockStaff];
  if (filters.active === true) list = list.filter((s) => s.active);
  if (filters.active === false) list = list.filter((s) => !s.active);
  if (filters.search) {
    const q = String(filters.search).toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q),
    );
  }
  return list.map((s) => ({ ...s }));
}

export async function getAll(filters = {}) {
  await delay();
  return withFallback(
    async () => (unwrap(await api.get('/admin/staff', { params: filters })) || []).map(mapStaff),
    () => mockGetAll(filters),
  );
}

export async function getById(id) {
  const list = await getAll();
  const staff = list.find((s) => s.id === id);
  if (!staff) throw new Error('Staff member not found');
  return staff;
}

export async function create(payload) {
  await delay();
  return withFallback(
    async () =>
      mapStaff(
        unwrap(
          await api.post('/admin/staff', {
            full_name: payload.name || payload.full_name,
            email: payload.email,
            phone: payload.phone || null,
            role: payload.role,
            password: payload.password,
            active: payload.active,
          }),
        ),
      ),
    () => {
      const staff = {
        id: nextId('staff'),
        name: payload.name || payload.full_name,
        email: payload.email,
        phone: payload.phone || null,
        role: payload.role || 'admin',
        active: payload.active !== false,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      mockStaff = [staff, ...mockStaff];
      return { ...staff };
    },
  );
}

export async function update(id, payload) {
  await delay();
  return withFallback(
    async () =>
      mapStaff(
        unwrap(
          await api.patch(`/admin/staff/${id}`, {
            full_name: payload.name || payload.full_name,
            email: payload.email,
            phone: payload.phone,
            role: payload.role,
            password: payload.password || undefined,
            active: payload.active,
          }),
        ),
      ),
    () => {
      const index = mockStaff.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Staff member not found');
      mockStaff[index] = {
        ...mockStaff[index],
        name: payload.name ?? mockStaff[index].name,
        email: payload.email ?? mockStaff[index].email,
        phone: payload.phone !== undefined ? payload.phone : mockStaff[index].phone,
        role: payload.role ?? mockStaff[index].role,
        active: payload.active !== undefined ? payload.active : mockStaff[index].active,
      };
      return { ...mockStaff[index] };
    },
  );
}

export async function toggleActive(id) {
  await delay();
  return withFallback(
    async () => mapStaff(unwrap(await api.patch(`/admin/staff/${id}/toggle-active`))),
    async () => {
      const staff = await getById(id);
      return update(id, { active: !staff.active });
    },
  );
}
