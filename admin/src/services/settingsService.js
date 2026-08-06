import { api, withFallback } from '../api/client';
import { unwrap } from '../api/adapters';
import { getSettings, settings } from '../mock/data';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function mockGet() {
  return { ...getSettings() };
}

function mockUpdate(partial) {
  Object.assign(settings, partial, { updatedAt: new Date().toISOString() });
  return { ...settings };
}

export async function get() {
  await delay();
  return withFallback(
    () => api.get('/settings').then((res) => unwrap(res)),
    () => mockGet(),
  );
}

export async function update(partial) {
  await delay();
  return withFallback(
    () => api.put('/settings', partial).then((res) => unwrap(res)),
    () => mockUpdate(partial),
  );
}

export const DEFAULT_SETTINGS = { ...settings };

export { settings };
