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
    const dispensary = await db.dispensary.findUnique({
      where: { id },
      select: { businessName: true, isVerified: true, userId: true }
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    const verifying = !dispensary.isVerified;

    // Order submission gates on licenseStatus, so verification has to keep
    // both fields in sync — toggling isVerified alone leaves buyers blocked.
    await db.$transaction(async (tx) => {
      await tx.dispensary.update({ where: { id }, data: verifying ? { isVerified: true, licenseStatus: 'verified', verifiedAt: new Date() } : { isVerified: false, licenseStatus: 'pending_review', verifiedAt: null } });
      await createNotification(tx, { userId: dispensary.userId, type: 'VERIFICATION_DECISION', title: verifying ? 'License verified' : 'Verification removed', body: verifying ? 'Ordering is now unlocked for your dispensary.' : 'Ordering is paused until PhenoFarm verifies your license again.', href: '/dispensary/dashboard' });
    });

    if (request.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({
        success: true,
        verified: verifying,
        message: `${dispensary.businessName} ${verifying ? 'verified' : 'unverified'}.`,
      });
    }

    return NextResponse.redirect(new URL('/admin/dispensaries', request.url), 303);
  } catch (error) {
    console.error('Error toggling dispensary verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
