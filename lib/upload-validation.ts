export const FILE_UPLOAD_LIMITS = {
  productImageMaxBytes: 1_000_000,
  productImagesMaxCount: 2,
  logoMaxBytes: 500_000,
  productDocumentMaxBytes: 2_000_000,
  batchLabDocumentMaxBytes: 2_000_000,
  csvImportMaxBytes: 1_000_000,
} as const;

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PRODUCT_DOCUMENT_MIME_TYPES = ['application/pdf'] as const;
export const CSV_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/csv'] as const;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const PDF_EXTENSIONS = ['pdf'];
const CSV_EXTENSIONS = ['csv'];

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function formatBytes(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(bytes % 1_000_000 === 0 ? 0 : 1)}MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)}KB`;
  return `${bytes}B`;
}

export function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\- ]+/g, '').trim().slice(0, 120) || 'upload';
}

function bytesStartWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectMimeFromBytes(bytes: Uint8Array) {
  if (bytesStartWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (
    bytes.length >= 12 &&
    bytesStartWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (bytesStartWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf';
  return null;
}

function decodeBase64Prefix(base64: string, byteLimit = 32) {
  try {
    const normalized = base64.replace(/\s/g, '');
    const charLimit = Math.ceil(byteLimit / 3) * 4;
    const binary = atob(normalized.slice(0, charLimit));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function hasAllowedExtension(fileName: string, allowedExtensions: string[]) {
  const extension = getFileExtension(fileName);
  return Boolean(extension && allowedExtensions.includes(extension));
}

export function validateUploadFile(
  file: File,
  options: {
    label: string;
    maxBytes: number;
    allowedMimeTypes: readonly string[];
    allowedExtensions: string[];
  }
): UploadValidationResult {
  if (!file || typeof file.name !== 'string') {
    return { ok: false, error: `${options.label} is missing.` };
  }

  if (file.size <= 0) {
    return { ok: false, error: `${file.name} is empty.` };
  }

  if (file.size > options.maxBytes) {
    return {
      ok: false,
      error: `${file.name} is too large. Maximum size is ${formatBytes(options.maxBytes)}.`,
    };
  }

  const mimeAllowed = file.type ? options.allowedMimeTypes.includes(file.type) : false;
  const extensionAllowed = hasAllowedExtension(file.name, options.allowedExtensions);

  if (!mimeAllowed || !extensionAllowed) {
    return {
      ok: false,
      error: `${file.name} is not an allowed ${options.label} type.`,
    };
  }

  return { ok: true };
}

export function validateProductImageFile(file: File) {
  return validateUploadFile(file, {
    label: 'product image',
    maxBytes: FILE_UPLOAD_LIMITS.productImageMaxBytes,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  });
}

export function validateProductImageBytes(bytes: Uint8Array, label = 'Product image'): UploadValidationResult {
  const detectedMime = detectMimeFromBytes(bytes);
  if (!detectedMime || !IMAGE_MIME_TYPES.includes(detectedMime as (typeof IMAGE_MIME_TYPES)[number])) {
    return { ok: false, error: `${label} content must be a JPG, PNG, or WebP image.` };
  }
  return { ok: true };
}

export function validateLogoFile(file: File) {
  return validateUploadFile(file, {
    label: 'logo image',
    maxBytes: FILE_UPLOAD_LIMITS.logoMaxBytes,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  });
}

export function validateProductDocumentFile(file: File) {
  return validateUploadFile(file, {
    label: 'product document',
    maxBytes: FILE_UPLOAD_LIMITS.productDocumentMaxBytes,
    allowedMimeTypes: PRODUCT_DOCUMENT_MIME_TYPES,
    allowedExtensions: PDF_EXTENSIONS,
  });
}

export function validatePdfBytes(bytes: Uint8Array, label = 'Document'): UploadValidationResult {
  if (detectMimeFromBytes(bytes) !== 'application/pdf') {
    return { ok: false, error: `${label} content must be a PDF.` };
  }
  return { ok: true };
}

export function validateBatchLabDocumentFile(file: File) {
  return validateUploadFile(file, {
    label: 'lab result PDF',
    maxBytes: FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes,
    allowedMimeTypes: PRODUCT_DOCUMENT_MIME_TYPES,
    allowedExtensions: PDF_EXTENSIONS,
  });
}

export function validateCsvImportFile(file: File) {
  return validateUploadFile(file, {
    label: 'CSV import',
    maxBytes: FILE_UPLOAD_LIMITS.csvImportMaxBytes,
    allowedMimeTypes: CSV_MIME_TYPES,
    allowedExtensions: CSV_EXTENSIONS,
  });
}

export function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;

  const base64 = match[2].replace(/\s/g, '');
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const sizeBytes = Math.max(0, Math.floor((base64.length * 3) / 4) - padding);

  return {
    mimeType: match[1],
    base64,
    sizeBytes,
  };
}

function isHttpUrl(value: string) {
  if (value.length > 2048) return false;
  if (/^\/uploads\/[a-zA-Z0-9-]+\.(png|jpg|jpeg|webp|pdf)$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isLikelyLegacyBase64(value: string) {
  return /^[A-Za-z0-9+/=\s]+$/.test(value) && value.replace(/\s/g, '').length >= 32;
}

export function validateImageReference(value: string, label = 'image'): UploadValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: `${label} is empty.` };

  if (isHttpUrl(trimmed)) return { ok: true };

  const dataUrl = parseDataUrl(trimmed);
  if (dataUrl) {
    if (!IMAGE_MIME_TYPES.includes(dataUrl.mimeType as (typeof IMAGE_MIME_TYPES)[number])) {
      return { ok: false, error: `${label} must be a JPG, PNG, or WebP image.` };
    }
    const bytes = decodeBase64Prefix(dataUrl.base64);
    const byteValidation = bytes ? validateProductImageBytes(bytes, label) : { ok: false as const, error: `${label} data is invalid.` };
    if (!byteValidation.ok) return byteValidation;
    if (dataUrl.sizeBytes > FILE_UPLOAD_LIMITS.productImageMaxBytes) {
      return {
        ok: false,
        error: `${label} is too large. Maximum size is ${formatBytes(FILE_UPLOAD_LIMITS.productImageMaxBytes)}.`,
      };
    }
    return { ok: true };
  }

  if (isLikelyLegacyBase64(trimmed)) {
    const bytes = decodeBase64Prefix(trimmed);
    const byteValidation = bytes ? validateProductImageBytes(bytes, label) : { ok: false as const, error: `${label} data is invalid.` };
    if (!byteValidation.ok) return byteValidation;

    const padding = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0;
    const sizeBytes = Math.max(0, Math.floor((trimmed.replace(/\s/g, '').length * 3) / 4) - padding);
    if (sizeBytes > FILE_UPLOAD_LIMITS.productImageMaxBytes) {
      return {
        ok: false,
        error: `${label} is too large. Maximum size is ${formatBytes(FILE_UPLOAD_LIMITS.productImageMaxBytes)}.`,
      };
    }
    return { ok: true };
  }

  return { ok: false, error: `${label} must be an image URL or data URL.` };
}

export function validateLogoDataUrl(value: unknown): UploadValidationResult {
  if (value === null || value === undefined || value === '') return { ok: true };
  if (typeof value !== 'string') return { ok: false, error: 'Logo must be an image URL.' };
  if (isHttpUrl(value)) return { ok: true };

  const dataUrl = parseDataUrl(value);
  if (!dataUrl || !IMAGE_MIME_TYPES.includes(dataUrl.mimeType as (typeof IMAGE_MIME_TYPES)[number])) {
    return { ok: false, error: 'Logo must be a JPG, PNG, or WebP image.' };
  }

  const bytes = decodeBase64Prefix(dataUrl.base64);
  const byteValidation = bytes ? validateProductImageBytes(bytes, 'Logo') : { ok: false as const, error: 'Logo data is invalid.' };
  if (!byteValidation.ok) return byteValidation;

  if (dataUrl.sizeBytes > FILE_UPLOAD_LIMITS.logoMaxBytes) {
    return {
      ok: false,
      error: `Logo is too large. Maximum size is ${formatBytes(FILE_UPLOAD_LIMITS.logoMaxBytes)}.`,
    };
  }

  return { ok: true };
}

export function validateProductImageList(images: unknown): UploadValidationResult {
  if (images === undefined || images === null) return { ok: true };
  if (!Array.isArray(images)) return { ok: false, error: 'images must be an array.' };

  if (images.length > FILE_UPLOAD_LIMITS.productImagesMaxCount) {
    return {
      ok: false,
      error: `Products can have at most ${FILE_UPLOAD_LIMITS.productImagesMaxCount} images.`,
    };
  }

  for (const [index, image] of images.entries()) {
    if (typeof image !== 'string') {
      return { ok: false, error: `Image ${index + 1} must be a URL or data URL.` };
    }
    const result = validateImageReference(image, `Image ${index + 1}`);
    if (!result.ok) return result;
  }

  return { ok: true };
}

export function validateDocumentReference(value: unknown): UploadValidationResult {
  if (value === undefined || value === null || value === '') return { ok: true };
  if (typeof value !== 'string') return { ok: false, error: 'Document reference must be text.' };
  if (isHttpUrl(value)) return { ok: true };

  const dataUrl = parseDataUrl(value);
  if (!dataUrl || !PRODUCT_DOCUMENT_MIME_TYPES.includes(dataUrl.mimeType as (typeof PRODUCT_DOCUMENT_MIME_TYPES)[number])) {
    return { ok: false, error: 'Document must be a PDF URL or PDF data URL.' };
  }

  const bytes = decodeBase64Prefix(dataUrl.base64);
  const byteValidation = bytes ? validatePdfBytes(bytes) : { ok: false as const, error: 'Document data is invalid.' };
  if (!byteValidation.ok) return byteValidation;

  if (dataUrl.sizeBytes > FILE_UPLOAD_LIMITS.productDocumentMaxBytes) {
    return {
      ok: false,
      error: `Document is too large. Maximum size is ${formatBytes(FILE_UPLOAD_LIMITS.productDocumentMaxBytes)}.`,
    };
  }

  return { ok: true };
}

export function validateBatchLabDocumentsPayload(value: unknown): UploadValidationResult {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== 'object') return { ok: false, error: 'Lab documents must be an object.' };

  const payload = value as { labDocuments?: Record<string, unknown> };
  if (JSON.stringify(value).length > 8_100_000) return { ok: false, error: 'Lab document payload is too large.' };
  if (!payload.labDocuments) return { ok: true };

  for (const [key, document] of Object.entries(payload.labDocuments)) {
    if (!document || typeof document !== 'object') {
      return { ok: false, error: `Lab document ${key} is invalid.` };
    }

    const record = document as Record<string, unknown>;
    const dataUrl = typeof record.dataUrl === 'string' ? parseDataUrl(record.dataUrl) : null;

    if (typeof record.dataUrl === 'string' && isHttpUrl(record.dataUrl)) continue;

    if (!dataUrl || dataUrl.mimeType !== 'application/pdf') {
      return { ok: false, error: `Lab document ${key} must be a PDF data URL.` };
    }

    const bytes = decodeBase64Prefix(dataUrl.base64);
    const byteValidation = bytes
      ? validatePdfBytes(bytes, `Lab document ${key}`)
      : { ok: false as const, error: `Lab document ${key} data is invalid.` };
    if (!byteValidation.ok) return byteValidation;

    if (dataUrl.sizeBytes > FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes) {
      return {
        ok: false,
        error: `Lab document ${key} is too large. Maximum size is ${formatBytes(FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes)}.`,
      };
    }
  }

  return { ok: true };
}
