import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session as any)?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get current verification status
    const dispensary = await db.dispensary.findUnique({
      where: { id },
      select: { isVerified: true }
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    // Toggle verification status
    await db.dispensary.update({
      where: { id },
      data: { isVerified: !dispensary.isVerified }
    });

    return NextResponse.redirect(new URL('/admin/dispensaries', request.url));
  } catch (error) {
    console.error('Error toggling dispensary verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
