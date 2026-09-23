import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerSelect, customerWhere } from '@/lib/customers';
import { getAuthSession } from '@/lib/auth-helpers';


// Only owned contacts and established trading relationships are visible.
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'GROWER' || !session.user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dispensaries = await db.dispensary.findMany({
      where: customerWhere(session.user.growerId),
      select: customerSelect,
    });

    return NextResponse.json(dispensaries, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Off-platform contacts do not receive an unusable login account or password.
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'GROWER' || !session.user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.values(body).some(value => value !== undefined && value !== null && (typeof value !== 'string' || value.length > 500))) return NextResponse.json({ error: 'Invalid customer fields' }, { status: 400 });
    const { businessName, contactName, email, phone, address, city, state, zipCode, licenseNumber } = body;

    if (typeof businessName !== 'string' || !businessName.trim() || businessName.length > 200 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) {
      return NextResponse.json({ error: 'Business name and email are required' }, { status: 400 });
    }

    const dispensary = await db.dispensary.create({
      data: {
        createdByGrowerId: session.user.growerId,
        businessName: businessName.trim(),
        contactName: contactName?.trim() || businessName.trim(),
        licenseNumber: licenseNumber?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || 'VT',
        zip: zipCode?.trim() || null,
        offPlatformEmail: email.trim().toLowerCase(),
        isOffPlatform: true,
      },
      select: customerSelect,
    });

    return NextResponse.json({ ...dispensary, email: email.trim().toLowerCase() }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
