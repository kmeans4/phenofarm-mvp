'use client';

import { IMAGE_MIME_TYPES } from '@/lib/upload-validation';

/** Resize large source photos before their separate upload request. */
export async function prepareImageUpload(file: File, maxBytes: number): Promise<File> {
  if (!IMAGE_MIME_TYPES.includes(file.type as (typeof IMAGE_MIME_TYPES)[number]) || file.size > 10_000_000) {
    throw new Error('Choose a JPG, PNG, or WebP image smaller than 10MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= maxBytes) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the image. Choose a smaller image.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob && blob.size <= maxBytes) return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
    }
    throw new Error('This photo is too large after compression. Choose a smaller image.');
  } finally { bitmap.close(); }
}

export async function uploadFile(file: File, kind: 'image' | 'logo' | 'document'): Promise<string> {
  const payload = new FormData();
  payload.append('file', file);
  payload.append('kind', kind);
  const response = await fetch(kind === 'document' ? '/api/products/upload-document' : '/api/products/upload', { method: 'POST', body: payload });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.url !== 'string') throw new Error(data.error || `Could not upload ${file.name}.`);
  if (!/^https:\/\//.test(data.url) && !/^\/uploads\/[a-zA-Z0-9/_\-.]+$/.test(data.url)) throw new Error('The upload returned an invalid file URL.');
  return data.url;
}
