import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/growers - List all growers
export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'pending' or 'verified'
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    // Filter by verification status
    if (status === 'pending') {
      where.isVerified = false;
    } else if (status === 'verified') {
      where.isVerified = true;
    }
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch growers with user data
    const growers = await db.grower.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to response format
    const formattedGrowers = growers.map(grower => ({
      id: grower.id,
      businessName: grower.businessName,
      licenseNumber: grower.licenseNumber,
      address: grower.address,
      city: grower.city,
      state: grower.state,
      zip: grower.zip,
      phone: grower.phone,
      website: grower.website,
      description: grower.description,
      isVerified: grower.isVerified,
      createdAt: grower.createdAt,
      updatedAt: grower.updatedAt,
      user: grower.user,
      productCount: grower._count.products
    }));

    return NextResponse.json({ growers: formattedGrowers });
  } catch (error) {
    console.error('Admin growers API error:', error);
    return NextResponse.json({ error: 'Failed to fetch growers' }, { status: 500 });
  }
}

// PATCH /api/admin/growers/:id/verify - Verify a grower
export async function PATCH(req: NextRequest) {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse URL to get grower ID
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const growerId = pathParts[pathParts.length - 2]; // /api/admin/growers/[id]/verify
    
    if (!growerId) {
      return NextResponse.json({ error: 'Grower ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { isVerified } = body;

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
      message: isVerified ? 'Grower verified successfully' : 'Grower unverified',
      grower 
    });
  } catch (error) {
    console.error('Admin grower verify error:', error);
    return NextResponse.json({ error: 'Failed to update grower' }, { status: 500 });
  }
}
