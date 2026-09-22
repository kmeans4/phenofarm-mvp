import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerSelect, customerWhere } from '@/lib/customers';
import { getAuthSession } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

const normalizeOptionalString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

// GET single customer
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'GROWER' || !session.user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = (await context.params).id;

    const dispensary = await db.dispensary.findFirst({
      where: { id: customerId, ...customerWhere(session.user.growerId) },
      select: customerSelect,
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...dispensary,
      email: dispensary.user?.email || dispensary.offPlatformEmail,
      contactName: dispensary.user?.name || dispensary.contactName,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update customer
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'GROWER' || !session.user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = (await context.params).id;

    const existingDispensary = await db.dispensary.findUnique({
      where: { id: customerId },
      select: { id: true, userId: true, createdByGrowerId: true },
    });

    if (!existingDispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    if (existingDispensary.userId || existingDispensary.createdByGrowerId !== session.user.growerId) {
      return NextResponse.json({ error: 'Only your own off-platform customer records can be edited' }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.values(body).some(value => value !== undefined && value !== null && typeof value !== 'string')) return NextResponse.json({ error: 'Customer fields must be text' }, { status: 400 });
    if (Object.values(body).some(value => typeof value === 'string' && value.length > 5000)) return NextResponse.json({ error: 'Customer field is too long' }, { status: 400 });
    const { businessName, contactName, email, phone, address, city, state, zipCode, licenseNumber, website, description } = body;

    if (businessName !== undefined && (typeof businessName !== 'string' || !businessName.trim() || businessName.trim().length > 200)) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const updateData: Prisma.DispensaryUpdateInput = {};
    if (email !== undefined && email !== null) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      updateData.offPlatformEmail = normalizedEmail;
    }

    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (phone !== undefined) updateData.phone = normalizeOptionalString(phone);
    if (address !== undefined) updateData.address = normalizeOptionalString(address);
    if (city !== undefined) updateData.city = normalizeOptionalString(city);
    if (state !== undefined) updateData.state = normalizeOptionalString(state) || 'VT';
    if (zipCode !== undefined) updateData.zip = normalizeOptionalString(zipCode);
    if (licenseNumber !== undefined) updateData.licenseNumber = normalizeOptionalString(licenseNumber);
    if (website !== undefined) updateData.website = normalizeOptionalString(website);
    if (description !== undefined) updateData.description = normalizeOptionalString(description);
    if (contactName !== undefined) updateData.contactName = normalizeOptionalString(contactName);

    if (Object.keys(updateData).length > 0) {
      await db.dispensary.update({
        where: { id: customerId },
        data: updateData,
      });
    }

    const finalDispensary = await db.dispensary.findUnique({
      where: { id: customerId },
      select: customerSelect,
    });

    return NextResponse.json({
      ...finalDispensary,
      email: finalDispensary?.user?.email || finalDispensary?.offPlatformEmail,
      contactName: finalDispensary?.user?.name || finalDispensary?.contactName,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE customer
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'GROWER' || !session.user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = (await context.params).id;

    const dispensary = await db.dispensary.findUnique({
      where: { id: customerId },
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    const removed = await db.dispensary.deleteMany({
      where: {
        id: customerId, userId: null, isOffPlatform: true,
        createdByGrowerId: session.user.growerId,
        orders: { none: {} }, conversations: { none: {} }, acceptedQuotes: { none: {} },
      },
    });
    if (!removed.count) return NextResponse.json({ error: 'Customer accounts and records with history must be retained' }, { status: 409 });

    return NextResponse.json({ message: 'Dispensary deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
