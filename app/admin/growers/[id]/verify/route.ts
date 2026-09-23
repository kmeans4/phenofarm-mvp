import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { applyVerification } from '@/lib/admin-verification';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const result = await applyVerification('GROWER', id, await request.json().catch(() => null));
    if (result.status !== 200 || request.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.redirect(new URL('/admin/growers', request.url), 303);
  } catch (error) {
    console.error('Unable to update verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
