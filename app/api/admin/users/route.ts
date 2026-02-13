import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/users - List all users
export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (role && role !== 'ALL') {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch users with related data
    const users = await db.user.findMany({
      where,
      include: {
        grower: true,
        dispensary: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to response format
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      grower: user.grower ? {
        id: user.grower.id,
        businessName: user.grower.businessName,
        licenseNumber: user.grower.licenseNumber,
        isVerified: user.grower.isVerified
      } : null,
      dispensary: user.dispensary ? {
        id: user.dispensary.id,
        businessName: user.dispensary.businessName,
        licenseNumber: user.dispensary.licenseNumber,
        isVerified: user.dispensary.isVerified
      } : null
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
