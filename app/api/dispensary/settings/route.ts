import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

interface DispensarySettingsBody {
  businessName: string;
  licenseNumber: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
}

// GET - Fetch dispensary settings
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;

    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dispensary = await db.dispensary.findUnique({
      where: { id: user.dispensaryId },
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

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    return NextResponse.json({
      businessName: dispensary.businessName,
      licenseNumber: dispensary.licenseNumber || '',
      email: dispensary.user.email,
      phone: dispensary.phone || '',
      address: dispensary.address || '',
      city: dispensary.city || '',
      state: dispensary.state || 'VT',
      zip: dispensary.zip || '',
      website: dispensary.website || '',
      description: dispensary.description || '',
    });
  } catch (error) {
    console.error('Error fetching dispensary settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update dispensary settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;

    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: DispensarySettingsBody = await request.json();
    const { businessName, licenseNumber, email, phone, address, website, description } = body;

    // Validate required fields
    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    // Parse address components if full address provided
    const addressData: Record<string, string> = {};
    if (address) {
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

    // Update dispensary record
    const dispensary = await db.dispensary.update({
      where: { id: user.dispensaryId },
      data: {
        businessName,
        licenseNumber: licenseNumber || null,
        phone: phone || null,
        address: addressData.address || null,
        city: addressData.city || null,
        state: addressData.state || 'VT',
        zip: addressData.zip || null,
        website: website || null,
        description: description || null,
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
      dispensary: {
        businessName: dispensary.businessName,
        licenseNumber: dispensary.licenseNumber,
        phone: dispensary.phone,
        address: dispensary.address,
      },
    });
  } catch (error) {
    console.error('Error updating dispensary settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
