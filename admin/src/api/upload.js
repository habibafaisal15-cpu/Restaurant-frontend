import { api } from './client';
import { unwrap } from './adapters';

const ALLOWED_FOLDERS = new Set(['products', 'deals', 'categories', 'hero']);

export async function uploadImage(file, folder = 'products') {
  if (!file) throw new Error('No image file selected');
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error('Invalid upload folder');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post(`/delivery/media/${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = unwrap(response);
  const url = data?.url || data?.image_url;
  if (!url) throw new Error('Upload failed — no image URL returned');
  return url;
}
