import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

interface GrowerSettingsBody {
  businessName: string;
  licenseNumber: string;
  licenseExpiry: string;
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

const normalizeOptionalString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

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
      licenseExpiry,
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
    if (!licenseNumber) {
      return NextResponse.json({ error: 'License number is required' }, { status: 400 });
    }
    if (!licenseExpiry) {
      return NextResponse.json({ error: 'License expiry date is required' }, { status: 400 });
    }

    // Validate license expiry is in the future
    const expiryDate = new Date(licenseExpiry);
    if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
      return NextResponse.json({ error: 'License expiry must be a valid future date' }, { status: 400 });
    }

    // Build update data object
    const updateData: Prisma.GrowerUpdateInput = {
      businessName: businessName.trim(),
      licenseNumber: licenseNumber.trim(),
      licenseExpiry: expiryDate,
      contactName: normalizeOptionalString(contactName),
      phone: normalizeOptionalString(phone),
      address: normalizeOptionalString(address),
      city: normalizeOptionalString(city),
      state: normalizeOptionalString(state) || 'VT',
      zip: normalizeOptionalString(zip),
      website: normalizeOptionalString(website),
      description: normalizeOptionalString(description),
    };

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
