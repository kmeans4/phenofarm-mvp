import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

interface GrowerSettingsBody {
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

// PUT - Update grower settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: GrowerSettingsBody = await request.json();
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

    // Build update data object
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

    // Update logo if provided (base64 string)
    if (logo !== undefined) {
      updateData.logo = logo || null;
    }

    // Update grower record
    const grower = await db.grower.update({
      where: { id: user.growerId },
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
      grower: {
        businessName: grower.businessName,
        licenseNumber: grower.licenseNumber,
        contactName: grower.contactName,
        phone: grower.phone,
        logo: grower.logo,
      },
    });
  } catch (error) {
    console.error('Error updating grower settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
