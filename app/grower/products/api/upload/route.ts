import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_IMPORT_PATH = '/api/products/bulk';

export async function GET(request: NextRequest) {
  const url = new URL(SUPPORTED_IMPORT_PATH, request.url);
  url.searchParams.set('template', 'true');
  return NextResponse.redirect(url, 308);
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'This import endpoint has been retired. Upload product CSV files to /api/products/bulk.',
      supportedPath: SUPPORTED_IMPORT_PATH,
    },
    { status: 410 }
  );
}
