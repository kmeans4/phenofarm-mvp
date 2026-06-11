import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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
      select: { isVerified: true }
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    const verifying = !dispensary.isVerified;

    // Order submission gates on licenseStatus, so verification has to keep
    // both fields in sync — toggling isVerified alone leaves buyers blocked.
    await db.dispensary.update({
      where: { id },
      data: verifying
        ? { isVerified: true, licenseStatus: 'verified', verifiedAt: new Date() }
        : { isVerified: false, licenseStatus: 'pending_review', verifiedAt: null }
    });

    return NextResponse.redirect(new URL('/admin/dispensaries', request.url));
  } catch (error) {
    console.error('Error toggling dispensary verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
