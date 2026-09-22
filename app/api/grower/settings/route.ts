import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { saveProfileSettings } from '@/lib/profile-settings';

// GET - Fetch grower settings
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: {
        businessName: true,
        licenseNumber: true,
        licenseExpiry: true,
        contactName: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        website: true,
        description: true,
        logo: true,
        user: { select: { email: true } },
      },
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    return NextResponse.json({
      businessName: grower.businessName,
      licenseNumber: grower.licenseNumber || '',
      licenseExpiry: grower.licenseExpiry || '',
      contactName: grower.contactName || '',
      email: grower.user.email,
      phone: grower.phone || '',
      address: grower.address || '',
      city: grower.city || '',
      state: grower.state || 'VT',
      zip: grower.zip || '',
      website: grower.website || '',
      description: grower.description || '',
      logo: grower.logo || '',
    });
  } catch (error) {
    console.error('Error fetching grower settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return saveProfileSettings(request, 'GROWER');
}

export async function PATCH(request: NextRequest) {
  return saveProfileSettings(request, 'GROWER', true);
}
