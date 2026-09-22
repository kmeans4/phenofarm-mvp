import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { saveProfileSettings } from '@/lib/profile-settings';

// GET - Fetch dispensary settings
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dispensary = await db.dispensary.findUnique({
      where: { id: user.dispensaryId },
      select: {
        businessName: true,
        licenseNumber: true,
        licenseExpiry: true,
        licenseState: true,
        licenseStatus: true,
        licenseReviewNotes: true,
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

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    return NextResponse.json({
      businessName: dispensary.businessName,
      licenseNumber: dispensary.licenseNumber || '',
      licenseExpiry: dispensary.licenseExpiry || '',
      licenseState: dispensary.licenseState || 'VT',
      licenseStatus: dispensary.licenseStatus || 'pending_review',
      licenseReviewNotes: dispensary.licenseReviewNotes || '',
      contactName: dispensary.contactName || '',
      email: dispensary.user?.email || user.email || '',
      phone: dispensary.phone || '',
      address: dispensary.address || '',
      city: dispensary.city || '',
      state: dispensary.state || 'VT',
      zip: dispensary.zip || '',
      website: dispensary.website || '',
      description: dispensary.description || '',
      logo: dispensary.logo || '',
    });
  } catch (error) {
    console.error('Error fetching dispensary settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return saveProfileSettings(request, 'DISPENSARY');
}

export async function PATCH(request: NextRequest) {
  return saveProfileSettings(request, 'DISPENSARY', true);
}
