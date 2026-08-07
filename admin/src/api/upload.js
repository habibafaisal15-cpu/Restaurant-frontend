import { getToken, clearAuth } from '../utils/storage';
import { unwrap } from './adapters';

const ALLOWED_FOLDERS = new Set(['products', 'deals', 'categories', 'hero']);
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|jfif|bmp|heic|heif)$/i.test(file.name || '');
}

/**
 * Upload with fetch so the browser sets the multipart boundary.
 * Axios default JSON Content-Type breaks multer parsing.
 */
export async function uploadImage(file, folder = 'products') {
  if (!file) throw new Error('No image file selected');
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error('Invalid upload folder');
  }
  if (!isImageFile(file)) {
    throw new Error('Please select an image file (JPG, PNG, WEBP…)');
  }

  const formData = new FormData();
  formData.append('image', file, file.name || 'upload.jpg');

  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}/delivery/media/${folder}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new Error('Upload failed — check your connection and try again');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    clearAuth();
    throw new Error(payload?.message || 'Session expired — please sign in again');
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Upload failed (${response.status})`);
  }

  const data = unwrap(payload) ?? payload?.data ?? payload;
  const url = data?.url || data?.image_url;
  if (!url) throw new Error('Upload failed — no image URL returned');
  return url;
}

export { isImageFile };
