import 'server-only';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { LAB_REPORT_KEYS, type LabReportKey } from '@/lib/lab-reports';
import { FILE_UPLOAD_LIMITS } from '@/lib/upload-validation';

export const MAX_LAB_REFERENCE_LENGTH = Math.ceil(FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes / 3) * 4 + 100;

// Only fetch our own public Blob uploads, never arbitrary URLs stored in old records.
export function isStoredLabUrl(source: string, growerId: string, batchId: string) {
  if (source.length > 2048) return false;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash
      || !/^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname)) return false;
    const prefixes = [`/products/${growerId}/documents/`, `/growers/${growerId}/batches/lab-documents/`,
      `/batches/${growerId}/${batchId}/`, `/batches/${growerId}/${batchId}/lab-results/`];
    return prefixes.some(prefix => url.pathname.startsWith(prefix) && /^[a-zA-Z0-9-]+\.pdf$/.test(url.pathname.slice(prefix.length)));
  } catch { return false; }
}

export function isLocalLabUrl(source: string) {
  return !process.env.VERCEL && process.env.NODE_ENV !== 'production' && /^\/uploads\/[a-zA-Z0-9-]+\.pdf$/.test(source);
}

// Input IDs must come from an authorized product query. Project small metadata
// in SQL so legacy PDF bodies never enter catalog queries or browser payloads.
export async function productLabReportsById(ids: string[]) {
  if (!ids.length) return new Map<string, LabReportKey[]>();
  const rows = await db.$queryRaw<Array<{ id: string; growerId: string; batchId: string; key: LabReportKey; source: string; fingerprint: string }>>(Prisma.sql`
    SELECT p.id, p."growerId", b.id AS "batchId", r.key,
      CASE WHEN length(r.source) <= 2048 THEN r.source
        WHEN r.source LIKE 'data:application/pdf;base64,%' THEN left(r.source, 40) ELSE '' END AS source,
      md5(r.source) AS fingerprint
    FROM products p JOIN batches b ON b.id = p."batchId" AND b."growerId" = p."growerId"
    CROSS JOIN LATERAL (VALUES
      ('cannabinoids', b."testResults" #>> '{labDocuments,cannabinoids,dataUrl}'),
      ('pesticides', b."testResults" #>> '{labDocuments,pesticides,dataUrl}'),
      ('microbials', b."testResults" #>> '{labDocuments,microbials,dataUrl}'),
      ('coa', b."coaDocumentUrl")
    ) AS r(key, source)
    WHERE p.id IN (${Prisma.join(ids)}) AND length(r.source) BETWEEN 1 AND ${MAX_LAB_REFERENCE_LENGTH}`);
  const result = new Map<string, LabReportKey[]>();
  for (const id of ids) {
    const reports = rows.filter(row => row.id === id);
    const seen = new Set<string>();
    const keys = LAB_REPORT_KEYS.filter(key => {
      const row = reports.find(report => report.key === key);
      if (!row || seen.has(row.fingerprint) || !(row.source.startsWith('data:application/pdf;base64,JVBERi0')
        || isStoredLabUrl(row.source, row.growerId, row.batchId) || isLocalLabUrl(row.source))) return false;
      seen.add(row.fingerprint);
      return true;
    });
    result.set(id, keys);
  }
  return result;
}
