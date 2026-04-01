import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

interface DispensarySettingsBody {
  businessName: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseState: string;
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

    const user = session.user;

    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: DispensarySettingsBody = await request.json();
    const { 
      businessName, 
      licenseNumber, 
      licenseExpiry,
      licenseState,
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
    if (!licenseState) {
      return NextResponse.json({ error: 'License state is required' }, { status: 400 });
    }

    // Validate license expiry is in the future
    const expiryDate = new Date(licenseExpiry);
    if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
      return NextResponse.json({ error: 'License expiry must be a valid future date' }, { status: 400 });
    }

    // Build update data
    const updateData: Prisma.DispensaryUpdateInput = {
      businessName: businessName.trim(),
      licenseNumber: licenseNumber.trim(),
      licenseExpiry: expiryDate,
      licenseState: licenseState.trim(),
      contactName: normalizeOptionalString(contactName),
      phone: normalizeOptionalString(phone),
      address: normalizeOptionalString(address),
      city: normalizeOptionalString(city),
      state: normalizeOptionalString(state) || 'VT',
      zip: normalizeOptionalString(zip),
      website: normalizeOptionalString(website),
      description: normalizeOptionalString(description),
    };

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
