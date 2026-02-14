import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';

interface SessionUser {
  role: string;
}

// GET single customer
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSession = session.user as SessionUser;
    
    if (userSession.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = (await context.params).id;

    const dispensary = await db.dispensary.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...dispensary,
      email: dispensary.user?.email,
      contactName: dispensary.user?.name,
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSession = session.user as SessionUser;
    
    if (userSession.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = (await context.params).id;

    const existingDispensary = await db.dispensary.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!existingDispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    const body = await request.json();
    const { businessName, contactName, email, phone, address, city, state, zipCode, licenseNumber, website, description } = body;

    const updateData: Prisma.DispensaryUpdateInput = {};
    if (businessName !== undefined) updateData.businessName = businessName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zip = zipCode;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (website !== undefined) updateData.website = website;
    if (description !== undefined) updateData.description = description;

    await db.dispensary.update({
      where: { id: customerId },
      data: updateData,
    });

    if (email !== undefined || contactName !== undefined) {
      const userUpdateData: Prisma.UserUpdateInput = {};
      if (email !== undefined) userUpdateData.email = email;
      if (contactName !== undefined) userUpdateData.name = contactName;
      
      await db.user.update({
        where: { id: existingDispensary.userId },
        data: userUpdateData,
      });
    }

    const finalDispensary = await db.dispensary.findUnique({
      where: { id: customerId },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json({
      ...finalDispensary,
      email: finalDispensary?.user?.email,
      contactName: finalDispensary?.user?.name,
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSession = session.user as SessionUser;
    
    if (userSession.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = (await context.params).id;

    const dispensary = await db.dispensary.findUnique({
      where: { id: customerId },
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    await db.dispensary.delete({ where: { id: customerId } });

    return NextResponse.json({ message: 'Dispensary deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
