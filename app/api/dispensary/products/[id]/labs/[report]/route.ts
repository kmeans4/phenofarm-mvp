import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { buyerProductWhere } from '@/lib/buyer-products';
import { isLocalLabUrl, isStoredLabUrl, MAX_LAB_REFERENCE_LENGTH } from '@/lib/buyer-lab-reports';
import { LAB_REPORT_KEYS, LAB_REPORT_LABELS, type LabReportKey } from '@/lib/lab-reports';
import { FILE_UPLOAD_LIMITS, sanitizeFileName, validatePdfBytes } from '@/lib/upload-validation';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; report: string }> }) {
  const session = await getAuthSession();
  if (!session) return error('Sign in to download lab reports.', 401);
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) return error('Buyer access required.', 403);
  const { id, report } = await params;
  if (!LAB_REPORT_KEYS.includes(report as LabReportKey)) return error('Lab report not found.', 404);
  const product = await db.product.findFirst({ where: { id, ...buyerProductWhere() }, select: {
    id: true, name: true, growerId: true, batch: { select: { id: true, growerId: true } },
  } });
  if (!product?.batch || product.growerId !== product.batch.growerId) return error('Lab report not found.', 404);
  const [document] = await db.$queryRaw<Array<{ source: string | null }>>(Prisma.sql`
    SELECT CASE WHEN length(source) <= ${MAX_LAB_REFERENCE_LENGTH} THEN source ELSE NULL END AS source
    FROM (SELECT CASE WHEN ${report} = 'coa' THEN "coaDocumentUrl"
      ELSE "testResults" -> 'labDocuments' -> ${report} ->> 'dataUrl' END AS source
      FROM batches WHERE id = ${product.batch.id} AND "growerId" = ${product.growerId}) AS document`);
  const source = document?.source;
  if (!source) return error('Lab report not found.', 404);
  try {
    let bytes: Buffer;
    if (/^data:application\/pdf;base64,[A-Za-z0-9+/=\s]+$/.test(source)) {
      bytes = Buffer.from(source.slice(source.indexOf(',') + 1), 'base64');
    } else if (isLocalLabUrl(source)) {
      bytes = await readFile(path.join(process.cwd(), 'public', source));
    } else if (isStoredLabUrl(source, product.growerId, product.batch.id)) {
      const response = await fetch(source, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000) });
      if (!response.ok || !response.body) return error('This report is temporarily unavailable. Please try again.', 502);
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes) return error('This report could not be downloaded. Contact the grower.', 422);
          chunks.push(value);
        }
      } finally { await reader.cancel(); }
      bytes = Buffer.concat(chunks);
    } else return error('Lab report not found.', 404);
    if (bytes.length > FILE_UPLOAD_LIMITS.batchLabDocumentMaxBytes || !validatePdfBytes(bytes).ok) {
      return error('This report could not be downloaded. Contact the grower.', 422);
    }
    const fileName = `${sanitizeFileName(product.name).slice(0, 80)}-${LAB_REPORT_LABELS[report as LabReportKey]}.pdf`;
    return new NextResponse(new Uint8Array(bytes), { headers: { ...headers, 'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`, 'Content-Length': String(bytes.length) } });
  } catch { return error('This report is temporarily unavailable. Please try again.', 502); }
}
