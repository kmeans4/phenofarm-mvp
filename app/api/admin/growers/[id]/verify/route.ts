import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/growers/:id/verify - Toggle grower verification status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session as any)?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: growerId } = await params;
    
    if (!growerId) {
      return NextResponse.json({ error: 'Grower ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { isVerified } = body;

    if (typeof isVerified !== 'boolean') {
      return NextResponse.json({ error: 'isVerified boolean required' }, { status: 400 });
    }

    // Update grower
    const grower = await db.grower.update({
      where: { id: growerId },
      data: { isVerified },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: isVerified ? 'Grower verified successfully' : 'Grower unverified',
      grower 
    });
  } catch (error) {
    console.error('Admin grower verify error:', error);
    return NextResponse.json({ error: 'Failed to update grower' }, { status: 500 });
  }
}
