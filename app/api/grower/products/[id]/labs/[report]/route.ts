import { downloadProductLab } from '@/lib/product-lab-download';
export function GET(_request: Request, context: { params: Promise<{ id: string; report: string }> }) {
  return downloadProductLab(context, 'grower');
}
