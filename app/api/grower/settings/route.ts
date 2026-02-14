import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

interface GrowerSettingsBody {
  businessName: string;
  licenseNumber: string;
  email: string;
  phone: string;
  address: string;
}

// GET - Fetch grower settings
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const grower = await db.grower.findUnique({
      where: { id: user.growerId },
      select: {
        businessName: true,
        licenseNumber: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        website: true,
        description: true,
        user: { select: { email: true } },
      },
    });

    if (!grower) {
      return NextResponse.json({ error: 'Grower not found' }, { status: 404 });
    }

    return NextResponse.json({
      businessName: grower.businessName,
      licenseNumber: grower.licenseNumber || '',
      email: grower.user.email,
      phone: grower.phone || '',
      address: grower.address || '',
      city: grower.city || '',
      state: grower.state || 'VT',
      zip: grower.zip || '',
      website: grower.website || '',
      description: grower.description || '',
    });
  } catch (error) {
    console.error('Error fetching grower settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update grower settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: GrowerSettingsBody = await request.json();
    const { businessName, licenseNumber, email, phone, address } = body;

    // Validate required fields
    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    // Parse address components if full address provided
    const addressData: Record<string, string> = {};
    if (address) {
      // Try to extract city, state, zip from address
      const parts = address.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        addressData.address = parts[0];
        const cityStateZip = parts[parts.length - 1].split(' ');
        if (cityStateZip.length >= 2) {
          addressData.city = parts.length >= 3 ? parts[1] : '';
          addressData.state = cityStateZip[cityStateZip.length - 2] || 'VT';
          addressData.zip = cityStateZip[cityStateZip.length - 1] || '';
        }
      } else {
        addressData.address = address;
      }
    }

    // Update grower record
    const grower = await db.grower.update({
      where: { id: user.growerId },
      data: {
        businessName,
        licenseNumber: licenseNumber || null,
        phone: phone || null,
        address: addressData.address || null,
        city: addressData.city || null,
        state: addressData.state || 'VT',
        zip: addressData.zip || null,
      },
    });

    // Update email if changed and provided
    if (email && email !== user.email) {
      await db.user.update({
        where: { id: user.id },
        data: { email },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      grower: {
        businessName: grower.businessName,
        licenseNumber: grower.licenseNumber,
        phone: grower.phone,
        address: grower.address,
      },
    });
  } catch (error) {
    console.error('Error updating grower settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
