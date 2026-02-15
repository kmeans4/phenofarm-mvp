import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

interface DispensarySettingsBody {
  businessName: string;
  licenseNumber: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  description: string;
  logo: string;
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
      contactName: dispensary.contactName || '',
      email: dispensary.user.email,
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
    const { 
      businessName, 
      licenseNumber, 
      contactName, 
      email, 
      phone, 
      address,
      city,
      state,
      zip,
      website, 
      description,
      logo
    } = body;

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

    // Build update data
    const updateData: any = {
      businessName,
      licenseNumber: licenseNumber || null,
      contactName: contactName || null,
      phone: phone || null,
      website: website || null,
      description: description || null,
    };

    // Only update address if provided
    if (address) {
      updateData.address = addressData.address || null;
      updateData.city = addressData.city || null;
      updateData.state = addressData.state || 'VT';
      updateData.zip = addressData.zip || null;
    }

    // Update logo if provided
    if (logo !== undefined) {
      updateData.logo = logo || null;
    }

    // Update dispensary record
    const dispensary = await db.dispensary.update({
      where: { id: user.dispensaryId },
      data: updateData,
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
        contactName: dispensary.contactName,
        phone: dispensary.phone,
        logo: dispensary.logo,
      },
    });
  } catch (error) {
    console.error('Error updating dispensary settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
