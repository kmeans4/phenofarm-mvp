import { NextResponse } from 'next/server';
import { customerWhere } from '@/lib/customers';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'GROWER' || !session.user.growerId) {
      return NextResponse.json(
        { error: 'Your account does not have access to this action.' },
        { status: 403 }
      );
    }

    const dispensaries = await db.dispensary.findMany({
      where: {
        OR: [
          { isOffPlatform: true, ...customerWhere(session.user.growerId) },
          { isVerified: true, licenseStatus: 'verified' },
        ],
      },
      select: {
        id: true,
        businessName: true,
        city: true,
        state: true,
        address: true,
        isOffPlatform: true,
        createdByGrowerId: true,
        orders: {
          where: { growerId: session.user.growerId },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const sorted = dispensaries
      .sort((a, b) => {
        const aOwn =
          a.createdByGrowerId === session.user.growerId || a.orders.length > 0;
        const bOwn =
          b.createdByGrowerId === session.user.growerId || b.orders.length > 0;
        return (
          Number(bOwn) - Number(aOwn) ||
          (b.orders[0]?.createdAt.getTime() || 0) -
            (a.orders[0]?.createdAt.getTime() || 0) ||
          a.businessName.localeCompare(b.businessName)
        );
      })
      .map((item) => ({
        id: item.id,
        businessName: item.businessName,
        city: item.city,
        state: item.state,
        address: item.address,
        isOffPlatform: item.isOffPlatform,
      }));
    return NextResponse.json(sorted, { status: 200 });
  } catch (error) {
    console.error('Error fetching dispensaries:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
