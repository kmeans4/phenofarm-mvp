import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { sanitizeFileName, detectMimeFromBytes } from '@/lib/upload-validation';

export interface StoredUpload {
  url: string;
  storage: 'blob' | 'local';
}

function fileExtension(fileName: string, mimeType: string) {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/jpeg') return 'jpg';
  return fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
}

export async function storeUpload({
  bytes,
  mimeType,
  fileName,
  pathPrefix,
}: {
  bytes: Buffer;
  mimeType: string;
  fileName: string;
  pathPrefix: string;
}): Promise<StoredUpload> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error('File storage is not configured. Set BLOB_READ_WRITE_TOKEN.');
    }
    const name = `${randomUUID()}.${fileExtension(fileName, mimeType)}`;
    const folder = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, name), bytes);
    return { url: `/uploads/${name}`, storage: 'local' };
  }

  const safePrefix = pathPrefix.replace(/^\/+|\/+$/g, '');
  const safeName = sanitizeFileName(fileName);
  const extension = fileExtension(safeName, mimeType);
  const blob = await put(`${safePrefix}/${randomUUID()}.${extension}`, bytes, {
    access: 'public',
    addRandomSuffix: false,
    contentType: mimeType,
  });

  return { url: blob.url, storage: 'blob' };
}

export function decodeDataUri(value: string) {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(value);
  if (!match) {
    if (!/^[A-Za-z0-9+/=\s]{32,}$/.test(value)) return null;
    const bytes = Buffer.from(value, 'base64');
    const mimeType = detectMimeFromBytes(bytes);
    return mimeType ? { bytes, mimeType } : null;
  }
  return {
    mimeType: match[1],
    bytes: Buffer.from(match[2], 'base64'),
  };
}

// Converts legacy bounded data URLs on writes while keeping existing remote URLs.
export async function persistMediaReference(value: string | null | undefined, pathPrefix: string) {
  if (!value) return value;
  const decoded = decodeDataUri(value);
  if (!decoded) return value;
  return (await storeUpload({ ...decoded, fileName: 'upload', pathPrefix })).url;
}

export async function persistLabDocuments(value: unknown, pathPrefix: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const result = { ...value } as Record<string, unknown>;
  if (result.labDocuments && typeof result.labDocuments === 'object') {
    const documents: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(result.labDocuments)) {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        documents[key] = { ...record, dataUrl: await persistMediaReference(String(record.dataUrl || ''), pathPrefix) };
      }
    }
    result.labDocuments = documents;
  }
  return result;
}
