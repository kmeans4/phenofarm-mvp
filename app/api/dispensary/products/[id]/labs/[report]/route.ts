import { downloadProductLab } from '@/lib/product-lab-download';
export function GET(
  request: Request,
  context: { params: Promise<{ id: string; report: string }> }
) {
  return downloadProductLab(
    context,
    'buyer',
    new URL(request.url).searchParams.get('view') === 'inline'
  );
}
