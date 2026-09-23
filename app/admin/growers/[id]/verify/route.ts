import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get current verification status
    const grower = await db.grower.findUnique({
      where: { id },
      select: { businessName: true, isVerified: true, userId: true }
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    const verifying = !grower.isVerified;

    // Toggle verification status
    await db.$transaction(async (tx) => {
      await tx.grower.update({ where: { id }, data: { isVerified: verifying } });
      await createNotification(tx, { userId: grower.userId, type: 'VERIFICATION_DECISION', title: verifying ? 'Account verified' : 'Verification removed', body: verifying ? 'Your listings are now visible to verified dispensaries.' : 'Your listings are hidden until PhenoFarm verifies your account again.', href: '/grower/dashboard' });
    });

    if (request.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({
        success: true,
        verified: verifying,
        message: `${grower.businessName} ${verifying ? 'verified' : 'unverified'}.`,
      });
    }

    return NextResponse.redirect(new URL('/admin/growers', request.url), 303);
  } catch (error) {
    console.error('Error toggling grower verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
