import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/admin/stats - Get platform statistics
export async function GET() {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session as any)?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all stats in parallel
    const [
      totalUsers,
      totalGrowers,
      totalDispensaries,
      verifiedGrowers,
      verifiedDispensaries,
      pendingGrowers,
      pendingDispensaries,
      totalProducts,
      totalOrders,
      recentOrders,
      recentUsers
    ] = await Promise.all([
      db.user.count(),
      db.grower.count(),
      db.dispensary.count(),
      db.grower.count({ where: { isVerified: true } }),
      db.dispensary.count({ where: { isVerified: true } }),
      db.grower.count({ where: { isVerified: false } }),
      db.dispensary.count({ where: { isVerified: false } }),
      db.product.count(),
      db.order.count(),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          dispensary: { select: { businessName: true } },
          grower: { select: { businessName: true } }
        }
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalGrowers,
        totalDispensaries,
        verifiedGrowers,
        verifiedDispensaries,
        pendingGrowers,
        pendingDispensaries,
        totalProducts,
        totalOrders
      },
      recentOrders,
      recentUsers
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
